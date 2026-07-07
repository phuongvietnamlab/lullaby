"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useParams } from "next/navigation";
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
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/" as const, label: t("home") },
    { href: "/rooms" as const, label: t("rooms") },
    { href: "/gallery" as const, label: t("gallery") },
    { href: "/blog" as const, label: t("blog") },
    { href: "/contact" as const, label: t("contact") },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-[var(--duration-slow)] ease-[var(--ease-luxury)] ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-[var(--shadow-soft)] py-3"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span
              className={`font-[family-name:var(--font-heading)] text-2xl font-medium tracking-wider transition-colors duration-[var(--duration-normal)] ${
                isScrolled ? "text-[var(--color-primary)]" : "text-white"
              }`}
            >
              HASANA
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8" role="navigation" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm uppercase tracking-widest transition-colors duration-[var(--duration-normal)] hover:text-[var(--color-accent)] ${
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
              className="px-6 py-2.5 bg-[var(--color-accent)] text-[var(--color-primary-dark)] text-xs uppercase tracking-widest font-medium rounded-sm hover:bg-[var(--color-accent-light)] transition-all duration-[var(--duration-normal)] ease-[var(--ease-luxury)]"
            >
              {tCommon("bookNow")}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2"
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
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white shadow-[var(--shadow-elevated)] border-t border-[var(--color-border)]">
          <nav className="max-w-7xl mx-auto px-4 py-6 space-y-4" role="navigation" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-[var(--color-text)] text-sm uppercase tracking-widest py-2 hover:text-[var(--color-accent)] transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-[var(--color-border)]">
              <LanguageSwitcher isScrolled={true} />
            </div>
            <Link
              href="/booking"
              className="block text-center px-6 py-3 bg-[var(--color-accent)] text-[var(--color-primary-dark)] text-xs uppercase tracking-widest font-medium rounded-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {tCommon("bookNow")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
