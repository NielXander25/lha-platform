import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-cookie";

// Quick check only: send visitors without a session cookie to the login page.
// Real authorisation (valid session, correct role) happens in each layout and Server Action.
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  const url = new URL("/login", request.url);
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/portal", "/portal/:path*", "/tutor", "/tutor/:path*"],
};
