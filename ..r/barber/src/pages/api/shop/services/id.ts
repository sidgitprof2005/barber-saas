import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "@/lib/db";
import { authenticate, authorizeShopRole } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await authenticate(req);

    const subdomain = req.headers["x-shop-subdomain"] as string;
    const serviceId = req.query.id as string;

    const shopResult = await query(
      "SELECT id FROM shops WHERE subdomain = $1",
      [subdomain]
    );

    if (shopResult.rowCount === 0) {
      return res.status(404).json({ error: "Shop not found" });
    }

    const shopId = shopResult.rows[0].id;

    await authorizeShopRole(user.userId, shopId, ["ADMIN", "STAFF"]);

    // =========================
    // 📌 PUT: Update service
    // =========================
    if (req.method === "PUT") {
      const { name, durationMinutes, price, isActive } = req.body;

      const result = await query(
        `UPDATE services
         SET name = $1,
             duration_minutes = $2,
             price = $3,
             is_active = $4
         WHERE id = $5 AND shop_id = $6
         RETURNING *`,
        [name, durationMinutes, price, isActive, serviceId, shopId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Service not found" });
      }

      return res.json({ service: result.rows[0] });
    }

    // =========================
    // 📌 DELETE: Delete service
    // =========================
    if (req.method === "DELETE") {
      await query(
        "DELETE FROM services WHERE id = $1 AND shop_id = $2",
        [serviceId, shopId]
      );

      return res.json({ message: "Service deleted" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
}