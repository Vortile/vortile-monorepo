import { type NextRequest, NextResponse } from "next/server";

const ADMIN_ONLY_PATHS = ["/usuarios", "/configuracoes", "/ifood"];

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // 1. Allow static files, assets, and auth endpoints
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/menu") ||
    pathname.startsWith("/api/orders") ||
    pathname.startsWith("/api/ai") ||
    pathname.startsWith("/api/whatsapp") ||
    pathname === "/login" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Check session cookie
  const sessionToken = request.cookies.get("vortile_session")?.value;
  const userRole = request.cookies.get("vortile_user_role")?.value || "admin";

  // 3. Admin-only Route Guard
  const isAdminRoute = ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p));
  if (isAdminRoute && userRole === "operador") {
    // Redirect operator to home dashboard
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("error", "unauthorized_role");
    return NextResponse.redirect(url);
  }

  // 4. Redirect unauthenticated users on protected admin routes
  if (isAdminRoute && !sessionToken) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
};

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
