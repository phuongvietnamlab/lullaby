import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--color-primary)] text-white/80 rounded-t-3xl safe-bottom">
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 sm:gap-12 text-center sm:text-left">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1 pb-6 sm:pb-0 border-b border-white/10 sm:border-b-0">
            <h3 className="font-[family-name:var(--font-heading)] text-2xl text-white mb-4 tracking-wider">
              Lullaby
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-white/60">
              {t("description")}
            </p>
          </div>

          {/* Quick Links */}
          <div className="pt-2 sm:pt-0">
            <h4 className="text-xs uppercase tracking-widest text-white/40 mb-4 sm:mb-6">
              {t("quickLinks")}
            </h4>
            <nav className="space-y-0" aria-label="Footer navigation">
              <Link
                href="/rooms"
                className="block text-sm hover:text-[var(--color-accent)] transition-colors py-2.5 min-h-[44px] flex items-center justify-center sm:justify-start"
              >
                {tNav("rooms")}
              </Link>
              <Link
                href="/gallery"
                className="block text-sm hover:text-[var(--color-accent)] transition-colors py-2.5 min-h-[44px] flex items-center justify-center sm:justify-start"
              >
                {tNav("gallery")}
              </Link>
              <Link
                href="/booking"
                className="block text-sm hover:text-[var(--color-accent)] transition-colors py-2.5 min-h-[44px] flex items-center justify-center sm:justify-start"
              >
                {tNav("booking")}
              </Link>
              <Link
                href="/blog"
                className="block text-sm hover:text-[var(--color-accent)] transition-colors py-2.5 min-h-[44px] flex items-center justify-center sm:justify-start"
              >
                {tNav("blog")}
              </Link>
              <Link
                href="/about"
                className="block text-sm hover:text-[var(--color-accent)] transition-colors py-2.5 min-h-[44px] flex items-center justify-center sm:justify-start"
              >
                {tNav("about")}
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-white/40 mb-6">
              {t("contactInfo")}
            </h4>
            <div className="space-y-3 text-sm">
              <p>Ha Long, Quang Ninh, Vietnam</p>
              <p>+84 (0) 203 xxx xxxx</p>
              <p className="break-all sm:break-normal">info@lullabyskyvillahahalong.com</p>
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-white/40 mb-6">
              {t("followUs")}
            </h4>
            <div className="flex space-x-4 justify-center sm:justify-start">
              <a
                href="#"
                className="w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center border border-white/20 rounded-xl hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center border border-white/20 rounded-xl hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-12 sm:mt-12 pt-8 sm:pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-white/40 gap-4 pb-4">
          <p>{t("copyright", { year: currentYear })}</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-white/70 transition-colors min-h-[44px] flex items-center">
              {t("privacy")}
            </a>
            <a href="#" className="hover:text-white/70 transition-colors min-h-[44px] flex items-center">
              {t("terms")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
