import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["vi", "en"],
  defaultLocale: "vi",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/rooms": {
      vi: "/phong",
      en: "/rooms",
    },
    "/rooms/[slug]": {
      vi: "/phong/[slug]",
      en: "/rooms/[slug]",
    },
    "/gallery": {
      vi: "/thu-vien-anh",
      en: "/gallery",
    },
    "/booking": {
      vi: "/dat-phong",
      en: "/booking",
    },
    "/blog": {
      vi: "/blog",
      en: "/blog",
    },
    "/contact": {
      vi: "/lien-he",
      en: "/contact",
    },
    "/about": {
      vi: "/gioi-thieu",
      en: "/about",
    },
  },
});

export type Locale = (typeof routing.locales)[number];
export type Pathnames = keyof typeof routing.pathnames;
