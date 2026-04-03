import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const ADMIN_COOKIE_NAME = "acj_admin_session"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith("/admin") || pathname.startsWith("/admin/login")) {
    return NextResponse.next()
  }

  if (!request.cookies.get(ADMIN_COOKIE_NAME)) {
    const loginUrl = new URL("/admin/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}

