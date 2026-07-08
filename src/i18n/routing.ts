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
    "/booking/status": {
      vi: "/dat-phong/trang-thai",
      en: "/booking/status",
    },
    "/booking/payment": {
      vi: "/dat-phong/thanh-toan",
      en: "/booking/payment",
    },
    "/blog": {
      vi: "/blog",
      en: "/blog",
    },
    "/blog/[slug]": {
      vi: "/blog/[slug]",
      en: "/blog/[slug]",
    },
    "/reviews": {
      vi: "/danh-gia",
      en: "/reviews",
    },
    "/reviews/submit": {
      vi: "/danh-gia/gui",
      en: "/reviews/submit",
    },
    "/promotions": {
      vi: "/khuyen-mai",
      en: "/promotions",
    },
    "/contact": {
      vi: "/lien-he",
      en: "/contact",
    },
    "/about": {
      vi: "/gioi-thieu",
      en: "/about",
    },
    "/attractions": {
      vi: "/diem-tham-quan",
      en: "/attractions",
    },
  },
});

export type Locale = (typeof routing.locales)[number];
export type Pathnames = keyof typeof routing.pathnames;
