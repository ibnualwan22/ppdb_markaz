import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const isAuth = !!req.nextauth.token;
    const isSantriRoute = req.nextUrl.pathname.startsWith('/santri');
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');

    if (!isAuth) {
      if (isSantriRoute) {
        return NextResponse.redirect(new URL('/santri/login', req.url));
      }
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // RBAC Redirects
    if (isAdminRoute && req.nextauth.token?.role === 'SANTRI') {
      return NextResponse.redirect(new URL('/santri/dashboard', req.url));
    }
    if (isSantriRoute && req.nextauth.token?.role !== 'SANTRI') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true, // Selalu masuk ke middleware function untuk handle redirect manual
    }
  }
)

export const config = {
  matcher: ["/admin/:path*", "/santri/dashboard/:path*"],
}
