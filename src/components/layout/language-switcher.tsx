"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Props = {
  isScrolled: boolean;
};

export function LanguageSwitcher({ isScrolled }: Props) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    router.replace(
      // @ts-expect-error — pathname is dynamically obtained and is always valid
      pathname,
      { locale: newLocale }
    );
  };

  return (
    <div className="flex items-center space-x-1 text-xs uppercase tracking-widest">
      {routing.locales.map((loc, index) => (
        <span key={loc} className="flex items-center">
          {index > 0 && (
            <span
              className={`mx-1 ${
                isScrolled ? "text-[var(--color-muted)]" : "text-white/50"
              }`}
            >
              |
            </span>
          )}
          <button
            onClick={() => switchLocale(loc)}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors duration-[var(--duration-normal)] ${
              locale === loc
                ? "text-[var(--color-accent)] font-medium"
                : isScrolled
                ? "text-[var(--color-text-light)] hover:text-[var(--color-accent)]"
                : "text-white/70 hover:text-white"
            }`}
            aria-label={`Switch to ${loc === "vi" ? "Vietnamese" : "English"}`}
          >
            {loc.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}
