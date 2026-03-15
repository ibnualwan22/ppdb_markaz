import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Custom authorization logic jika perlu tambahan di level edge
    const isAuth = !!req.nextauth.token
    if (!isAuth) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    }
  }
)

export const config = {
  matcher: ["/admin/:path*"],
}
