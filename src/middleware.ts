import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "addis_profile_id";

/** Routes accessible without signing in. */
function isPublicPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/login" || pathname === "/signup") return true;
  // /listings/new (and /listings/new/upgrade) are the posting flow, not a listing
  // detail page — they require a signed-in profile, checked below.
  if (pathname === "/listings/new" || pathname.startsWith("/listings/new/")) return false;
  if (/^\/listings\/[^/]+$/.test(pathname)) return true;
  if (/^\/profiles\/[^/]+$/.test(pathname)) return true;
  // Chapa's server-to-server webhook and browser return redirect carry no
  // session cookie of their own — they must bypass the login gate.
  if (pathname.startsWith("/api/payments/")) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(SESSION_COOKIE)?.value;

  if (pathname.startsWith("/onboarding")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
