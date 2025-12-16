import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "@/lib/db";
import { authenticate, authorizeShopRole } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 🔐 Step 1: JWT check
    const user = await authenticate(req);

    // 🏪 Step 2: Subdomain → shop
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
    // 📌 GET: List services
    // =========================
    if (req.method === "GET") {
      const services = await query(
        "SELECT * FROM services WHERE shop_id = $1 ORDER BY created_at DESC",
        [shopId]
      );

      return res.json({ services: services.rows });
    }

    // =========================
    // 📌 POST: Add service
    // =========================
    if (req.method === "POST") {
      const { name, durationMinutes, price } = req.body;

      if (!name || !durationMinutes || !price) {
        return res.status(400).json({ error: "Missing fields" });
      }

      const result = await query(
        `INSERT INTO services (shop_id, name, duration_minutes, price)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [shopId, name, durationMinutes, price]
      );

      return res.status(201).json({ service: result.rows[0] });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
}