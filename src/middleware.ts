import { type NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const sessionId = request.cookies.get("session_id")?.value;
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname === "/login" || pathname === "/verify";

  // Unauthenticated user trying to access protected route
  if (!sessionId && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Authenticated user trying to access auth routes
  if (sessionId && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|manifest.webmanifest|sw.js|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
