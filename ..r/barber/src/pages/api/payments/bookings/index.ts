import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "@/lib/db";
import { authenticate, authorizeShopRole } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 🔐 Step 1: Auth
    const user = await authenticate(req);

    // 🏪 Step 2: Shop from subdomain
    const subdomain = req.headers["x-shop-subdomain"] as string;
    if (!subdomain) {
      return res.status(400).json({ error: "Subdomain missing" });
    }

    const shopResult = await query(
      "SELECT id FROM shops WHERE subdomain = $1",
      [subdomain]
    );

    if (shopResult.rowCount === 0) {
      return res.status(404).json({ error: "Shop not found" });
    }

    const shopId = shopResult.rows[0].id;

    // 🎭 Step 3: Role check
    await authorizeShopRole(user.userId, shopId, ["ADMIN", "STAFF"]);

    // =========================
    // 📌 Filters
    // =========================
    const { date, status } = req.query;

    let sql = `
      SELECT 
        b.id,
        b.start_time,
        b.end_time,
        b.status,
        b.payment_status,
        u.name as customer_name,
        u.email as customer_email,
        s.name as service_name,
        s.price
      FROM bookings b
      JOIN users u ON u.id = b.customer_id
      JOIN services s ON s.id = b.service_id
      WHERE b.shop_id = $1
    `;

    const params: any[] = [shopId];
    let idx = 2;

    // 📅 Date filter
    if (date) {
      sql += ` AND DATE(b.start_time) = $${idx}`;
      params.push(date);
      idx++;
    }

    // 📦 Status filter
    if (status) {
      sql += ` AND b.status = $${idx}`;
      params.push(status);
      idx++;
    }

    sql += " ORDER BY b.start_time DESC";

    const result = await query(sql, params);

    return res.json({
      bookings: result.rows,
    });
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
}