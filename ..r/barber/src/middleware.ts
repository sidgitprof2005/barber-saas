import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";

  if (host.includes("localhost")) {
    return NextResponse.next();
  }

  const parts = host.split(".");
  const subdomain = parts[0];

  const response = NextResponse.next();
  response.headers.set("x-shop-subdomain", subdomain);

  return response;
}