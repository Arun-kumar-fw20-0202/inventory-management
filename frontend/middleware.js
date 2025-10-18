import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies?.get("inventory_management_token")?.value || null;

  if (process.env.NODE_ENV === "development") {
    console.log("Token in middleware:", token);
  }

  // Define public routes
  const publicRoutes = ["/login", "/signup", "/privacy-policy", "/terms-conditions", "/refund-policy", "/about-us", "/contact-us", "/forgot", "/reset"];

    if (process.env.NODE_ENV === "development") {
      console.log("Token in middleware:", token);
      console.log("Pathname:", pathname);
  }

  // ✅ Allow all /transactions/[transaction_id] routes
  const isPublicTransactionRoute = pathname.startsWith("/transactions/");

  if (publicRoutes.includes(pathname) || isPublicTransactionRoute) {
    if (token && (pathname === "/login" || pathname === "/signup")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
