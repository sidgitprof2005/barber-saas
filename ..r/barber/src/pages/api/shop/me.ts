import type { NextApiRequest, NextApiResponse } from "next";
import { query } from "@/lib/db";

export default async function handler(req, res) {
  const subdomain = req.headers["x-shop-subdomain"];

  if (!subdomain || typeof subdomain !== "string") {
    return res.status(400).json({ error: "Shop subdomain missing" });
  }

  const result = await query(
    "SELECT id, name, subdomain FROM shops WHERE subdomain = $1",
    [subdomain]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: "Shop not found" });
  }

  return res.status(200).json({
    shop: result.rows[0],
  });
}