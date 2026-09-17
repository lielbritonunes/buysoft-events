import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";

const SESSION_COOKIE_NAME = "buysoft_session";
const JWT_SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "buysoft_events_super_secure_jwt_secret_key_2026_enterprise_grade_security"
);

// Matcher paths that should bypass middleware completely
const PUBLIC_FILE = /\.(.*)$/;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Skip next internals and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/integrations/youtube") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/stream") ||
    pathname.startsWith("/api/livekit") ||
    pathname.startsWith("/api/upload-video") ||
    pathname.startsWith("/api/upload-background") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Participant public paths (Never require admin login)
  if (
    pathname.startsWith("/e/") ||
    pathname.startsWith("/s/") ||
    pathname.startsWith("/live/")
  ) {
    return NextResponse.next();
  }

  // 3. Auth pages (login, register, forgot-password, invite)
  const isAuthPage =
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/invite/");

  // Verify session cookie
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  let hasValidSession = false;

  if (sessionCookie) {
    try {
      await jose.jwtVerify(sessionCookie, JWT_SECRET_KEY);
      hasValidSession = true;
    } catch {
      hasValidSession = false;
    }
  }

  // If user is logged in and trying to access login/register, redirect to dashboard
  if (hasValidSession && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // If user is on an auth page, allow them through
  if (isAuthPage) {
    return NextResponse.next();
  }

  // If user is not authenticated and trying to access protected pages (dashboard `/` or `/studio/:id`), redirect to login
  if (!hasValidSession) {
    const loginUrl = new URL("/login", req.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, media files
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
