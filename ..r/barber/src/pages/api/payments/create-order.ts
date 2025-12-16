import type { NextApiRequest, NextApiResponse } from "next";
import Razorpay from "razorpay";
import { authenticate } from "@/lib/auth";
import { query } from "@/lib/db";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const user = await authenticate(req);
  const { bookingId } = req.body;

  // 1️⃣ Booking fetch
  const booking = await query(
    "SELECT * FROM bookings WHERE id = $1 AND customer_id = $2",
    [bookingId, user.userId]
  );

  if (booking.rowCount === 0) {
    return res.status(404).json({ error: "Booking not found" });
  }

  // 2️⃣ Amount (example fixed / service based)
  const amount = 300 * 100; // ₹300 → paise

  // 3️⃣ Razorpay order
  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt: `booking_${bookingId}`,
  });

  // 4️⃣ Save order id
  await query(
    "UPDATE bookings SET razorpay_order_id = $1 WHERE id = $2",
    [order.id, bookingId]
  );

  res.json({
    orderId: order.id,
    amount,
    key: process.env.RAZORPAY_KEY_ID,
  });
}