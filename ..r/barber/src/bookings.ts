import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "@/lib/db";
import { authenticate } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    // 🔐 Customer login
    const user = await authenticate(req);

    const { serviceId, startTime } = req.body;
    const subdomain = req.headers["x-shop-subdomain"] as string;

    if (!serviceId || !startTime) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // 1️⃣ Shop
    const shopResult = await query(
      "SELECT id FROM shops WHERE subdomain = $1",
      [subdomain]
    );

    if (shopResult.rowCount === 0) {
      return res.status(404).json({ error: "Shop not found" });
    }

    const shopId = shopResult.rows[0].id;

    // 2️⃣ Service duration
    const serviceResult = await query(
      "SELECT duration_minutes FROM services WHERE id = $1 AND shop_id = $2",
      [serviceId, shopId]
    );

    if (serviceResult.rowCount === 0) {
      return res.status(404).json({ error: "Service not found" });
    }

    const duration = serviceResult.rows[0].duration_minutes;
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);

    // 3️⃣ Overlap check
    const overlap = await query(
      `SELECT id FROM bookings
       WHERE shop_id = $1
       AND start_time < $2
       AND end_time > $1::timestamp`,
      [shopId, start, end]
    );

    if (overlap.rowCount > 0) {
      return res.status(400).json({ error: "Slot already booked" });
    }

    // 4️⃣ Insert booking
    const result = await query(
      `INSERT INTO bookings (shop_id, customer_id, service_id, start_time, end_time, status)
       VALUES ($1,$2,$3,$4,$5,'CONFIRMED')
       RETURNING *`,
      [shopId, user.userId, serviceId, start, end]
    );

    res.status(201).json({ booking: result.rows[0] });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
}