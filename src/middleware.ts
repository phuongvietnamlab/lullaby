import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except API routes, static files, and admin panel
  matcher: [
    "/((?!api|admin|_next|_vercel|.*\\..*).*)",
    // Enable redirects that add missing locales
    // (e.g. `/rooms` -> `/vi/rooms`)
    "/",
  ],
};
