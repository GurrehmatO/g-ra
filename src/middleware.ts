import { auth } from "@/lib/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = Boolean(req.auth);

  const isProtected =
    nextUrl.pathname.startsWith("/projects") ||
    nextUrl.pathname.startsWith("/api/projects") ||
    nextUrl.pathname.startsWith("/api/tickets");

  if (isProtected && !isLoggedIn) {
    const url = new URL("/login", nextUrl.origin);
    url.searchParams.set("callbackUrl", nextUrl.pathname);
    return Response.redirect(url, 302);
  }
});

export const config = {
  matcher: [
    "/projects/:path*",
    "/api/projects/:path*",
    "/api/tickets/:path*",
  ],
};
