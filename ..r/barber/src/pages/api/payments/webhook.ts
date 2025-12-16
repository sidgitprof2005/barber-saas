import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { query } from "@/lib/db";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;

  const body = await getRawBody(req);
  const signature = req.headers["x-razorpay-signature"] as string;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  if (expected !== signature) {
    return res.status(400).send("Invalid signature");
  }

  const event = JSON.parse(body.toString());

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    const orderId = payment.order_id;

    await query(
      `UPDATE bookings
       SET payment_status='PAID',
           razorpay_payment_id=$1,
           status='CONFIRMED'
       WHERE razorpay_order_id=$2`,
      [payment.id, orderId]
    );
  }

  res.json({ status: "ok" });
}

// helper
async function getRawBody(req: any): Promise<Buffer> {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}