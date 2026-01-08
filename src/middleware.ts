import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proxy /backend requests to the actual backend
  if (pathname.startsWith("/backend")) {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
    // Strip /backend prefix
    const targetPath = pathname.replace(/^\/backend/, "") || "/";
    // Create new URL
    const targetUrl = new URL(targetPath, backendUrl);
    // Copy search params
    targetUrl.search = request.nextUrl.search;
    
    // Rewrite the request
    return NextResponse.rewrite(targetUrl);
  }

  // Auth logic for protected routes
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ??
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/backend/:path*"],
};