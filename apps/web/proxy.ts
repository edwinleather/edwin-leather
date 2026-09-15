import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"]
};

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";

  // Force the canonical domain. Strip the www. prefix once redirection has
  // settled so deep links, shared URLs, and search-engine crawlers all land on
  // the same hostname. Browsers may pin the pre-redirect URL for password
  // managers and autofill, so we also set the relevant cross-origin policies
  // on every HTML response so OAuth popups (Google sign-in) continue to work.
  if (host.startsWith("www.")) {
    const url = request.nextUrl.clone();
    url.hostname = host.replace(/^www\./, "");
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }

  const response = NextResponse.next();

  // Tell browsers to keep popups and the opener in the same browsing context
  // group so Google's sign-in popup can postMessage back to this origin.
  if (request.nextUrl.pathname.endsWith(".html") || request.nextUrl.pathname === "/" || request.nextUrl.pathname.startsWith("/product/") || request.nextUrl.pathname.startsWith("/category/") || request.nextUrl.pathname.startsWith("/shop") || request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup") || request.nextUrl.pathname.startsWith("/account")) {
    response.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    response.headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  }

  // Standard security hardening.
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}
