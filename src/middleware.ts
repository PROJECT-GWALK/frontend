import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ua = request.headers.get("user-agent")?.toLowerCase() ?? "";
  const isCrawler =
    ua.includes("facebookexternalhit") ||
    ua.includes("facebot") ||
    ua.includes("twitterbot") ||
    ua.includes("slackbot") ||
    ua.includes("discordbot") ||
    ua.includes("telegrambot") ||
    ua.includes("whatsapp") ||
    ua.includes("linkedinbot") ||
    ua.includes("skypeuripreview") ||
    ua.includes("line") ||
    ua.includes("googlebot");
  const isOgEligiblePath =
    /^\/event\/[^/]+\/Projects\/[^/]+(\/Scores)?$/.test(pathname);

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

  // Allow static files (images, etc) to bypass auth
  if (/\.(?:svg|png|jpg|jpeg|gif|webp)$/i.test(pathname)) {
    return NextResponse.next();
  }

  // Auth logic for protected routes
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ??
    request.cookies.get("__Secure-authjs.session-token")?.value;

  const isPublicPath = 
    pathname === "/" ||
    pathname === "/sign-in" || 
    pathname === "/error" ||
    pathname === "/event" ||
    pathname.startsWith("/api/auth") ||
    /^\/event\/[^/]+$/.test(pathname) || // Allow /event/:id
    /^\/event\/[^/]+\/invite$/.test(pathname) || // Allow /event/:id/invite
    /^\/event\/[^/]+\/NotRole$/.test(pathname); // Allow /event/:id/NotRole

  if (!isPublicPath && !sessionToken) {
    if (isCrawler && isOgEligiblePath) {
      return NextResponse.next();
    }
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("redirectTo", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match backend routes specifically (to allow images/files through)
    "/backend/:path*",
    // Match everything else, excluding static files and images
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ],
};
