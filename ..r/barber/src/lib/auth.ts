import jwt from "jsonwebtoken";
import { query } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export async function authenticate(req: any) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new Error("No token provided");
  }

  const token = authHeader.split(" ")[1]; // Bearer TOKEN

  const payload: any = jwt.verify(token, JWT_SECRET);

  return payload; // { userId, isSuperadmin }
}

export async function authorizeShopRole(
  userId: number,
  shopId: number,
  allowedRoles: string[]
) {
  const result = await query(
    "SELECT role FROM shop_users WHERE user_id = $1 AND shop_id = $2",
    [userId, shopId]
  );

  if (result.rowCount === 0) {
    throw new Error("User not part of this shop");
  }

  const role = result.rows[0].role;

  if (!allowedRoles.includes(role)) {
    throw new Error("Forbidden");
  }

  return role;
}