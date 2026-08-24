import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

const PUBLIC_PATHS = new Set(["/gh-zoom/login", "/api/backoffice/auth/login"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");

  if (PUBLIC_PATHS.has(pathname)) return response;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (session) return response;

  if (pathname.startsWith("/api/backoffice")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/gh-zoom/login", request.url));
}

export const config = {
  matcher: ["/gh-zoom/:path*", "/api/backoffice/:path*"],
};
