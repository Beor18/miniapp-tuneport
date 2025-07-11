import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n/config";

export default createMiddleware({
  // A list of all locales that are supported
  locales: locales,

  // Used when no locale matches
  defaultLocale: defaultLocale,

  // Always use the default locale for the root path
  localePrefix: "as-needed",

  // Detectar idioma desde headers
  localeDetection: true,

  // Usar redirect en lugar de rewrite para mejor performance
  alternateLinks: false,
});

export const config = {
  // Match only internationalized pathnames
  matcher: [
    "/",
    "/(es|en|pt)/:path*",
    // Excluir archivos estáticos para mejor performance
    "/((?!api|_next/static|_next/image|favicon.ico|logo-white.svg|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|\\.well-known).*)",
  ],
};
