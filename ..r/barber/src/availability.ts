import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { date, serviceId } = req.query;
  const subdomain = req.headers["x-shop-subdomain"] as string;

  if (!date || !serviceId) {
    return res.status(400).json({ error: "date and serviceId required" });
  }

  // 1️⃣ Shop find
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

  // 3️⃣ Existing bookings
  const bookings = await query(
    `SELECT start_time, end_time
     FROM bookings
     WHERE shop_id = $1 AND DATE(start_time) = $2`,
    [shopId, date]
  );

  // 4️⃣ Generate slots (10 AM – 8 PM)
  const openHour = 10;
  const closeHour = 20;

  const slots: string[] = [];
  let current = new Date(`${date}T${openHour}:00:00`);

  while (current.getHours() + duration / 60 <= closeHour) {
    const end = new Date(current.getTime() + duration * 60000);

    const overlap = bookings.rows.some((b: any) => {
      return (
        current < new Date(b.end_time) &&
        end > new Date(b.start_time)
      );
    });

    if (!overlap) {
      slots.push(current.toISOString());
    }

    current = new Date(current.getTime() + 30 * 60000); // next slot
  }

  res.json({ slots });
}