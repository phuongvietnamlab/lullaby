"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useState, useEffect } from "react";
import { LanguageSwitcher } from "./language-switcher";

export function Header() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { href: "/" as const, label: t("home") },
    { href: "/rooms" as const, label: t("rooms") },
    { href: "/gallery" as const, label: t("gallery") },
    { href: "/blog" as const, label: t("blog") },
    { href: "/promotions" as const, label: t("promotions") },
    { href: "/contact" as const, label: t("contact") },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-[var(--duration-slow)] ease-[var(--ease-luxury)] ${
        isScrolled
          ? "bg-white/90 backdrop-blur-xl shadow-[var(--shadow-soft)] py-3 sm:mx-4 sm:mt-3 sm:rounded-2xl"
          : "bg-transparent py-4 sm:py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 min-h-[44px] items-center">
            <span
              className={`font-[family-name:var(--font-heading)] text-xl sm:text-2xl font-medium tracking-wider transition-colors duration-[var(--duration-normal)] ${
                isScrolled ? "text-[var(--color-primary)]" : "text-white"
              }`}
            >
              Lullaby
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8" role="navigation" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm uppercase tracking-widest transition-colors duration-[var(--duration-normal)] hover:text-[var(--color-accent)] min-h-[44px] flex items-center ${
                  pathname === link.href
                    ? "text-[var(--color-accent)]"
                    : isScrolled
                    ? "text-[var(--color-text)]"
                    : "text-white/90"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side: Language + Book button */}
          <div className="hidden lg:flex items-center space-x-4">
            <LanguageSwitcher isScrolled={isScrolled} />
            <Link
              href="/booking"
              className="px-6 py-2.5 bg-[var(--color-accent)] text-[var(--color-primary-dark)] text-xs uppercase tracking-widest font-medium rounded-full hover:bg-[var(--color-accent-light)] hover:shadow-[var(--shadow-glow)] transition-all duration-[var(--duration-normal)] ease-[var(--ease-luxury)] min-h-[44px] flex items-center"
            >
              {tCommon("bookNow")}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <div className="space-y-1.5">
              <span
                className={`block w-6 h-0.5 transition-all duration-[var(--duration-normal)] ${
                  isScrolled ? "bg-[var(--color-primary)]" : "bg-white"
                } ${isMobileMenuOpen ? "rotate-45 translate-y-2" : ""}`}
              />
              <span
                className={`block w-6 h-0.5 transition-all duration-[var(--duration-normal)] ${
                  isScrolled ? "bg-[var(--color-primary)]" : "bg-white"
                } ${isMobileMenuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`block w-6 h-0.5 transition-all duration-[var(--duration-normal)] ${
                  isScrolled ? "bg-[var(--color-primary)]" : "bg-white"
                } ${isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed inset-x-0 top-0 z-50 transition-all duration-[var(--duration-slow)] ease-[var(--ease-luxury)] ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 h-screen bg-black/40 transition-opacity duration-[var(--duration-slow)] ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Menu panel */}
        <div
          className={`relative bg-white shadow-[var(--shadow-elevated)] transition-transform duration-[var(--duration-slow)] ease-[var(--ease-luxury)] ${
            isMobileMenuOpen ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          {/* Close button */}
          <div className="flex justify-end p-4 safe-top">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="px-6 pb-8 space-y-1" role="navigation" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block text-[var(--color-text)] text-sm uppercase tracking-widest py-3 min-h-[44px] flex items-center hover:text-[var(--color-accent)] transition-colors ${
                  pathname === link.href ? "text-[var(--color-accent)]" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-[var(--color-border)]">
              <div className="py-3 min-h-[44px] flex items-center">
                <LanguageSwitcher isScrolled={true} />
              </div>
            </div>
            <Link
              href="/booking"
              className="block w-full text-center px-6 py-4 bg-[var(--color-accent)] text-[var(--color-primary-dark)] text-xs uppercase tracking-widest font-medium rounded-full min-h-[48px] flex items-center justify-center"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {tCommon("bookNow")}
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
