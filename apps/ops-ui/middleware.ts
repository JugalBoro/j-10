import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to protected routes if user has a valid token
        if (req.nextUrl.pathname.startsWith('/dashboard') || 
            req.nextUrl.pathname.startsWith('/runs') ||
            req.nextUrl.pathname.startsWith('/workflows') ||
            req.nextUrl.pathname.startsWith('/connectors') ||
            req.nextUrl.pathname.startsWith('/rules') ||
            req.nextUrl.pathname.startsWith('/approvals') ||
            req.nextUrl.pathname.startsWith('/dlq') ||
            req.nextUrl.pathname.startsWith('/settings') ||
            req.nextUrl.pathname.startsWith('/prioritization')) {
          return !!token;
        }
        
        // Allow access to public routes
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (auth pages)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth).*)',
  ],
};
