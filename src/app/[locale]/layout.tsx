import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LiveChat } from "@/components/ui/live-chat";
import { RegisterSW } from "@/components/pwa/register-sw";
import { getSiteSettings } from "@/lib/data/settings";
import "../globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#1a1a2e",
};

const FALLBACK_TITLE = "Lullaby Sky Villa | Luxury Hotel in Ha Long Bay";
const FALLBACK_DESCRIPTION =
  "Experience luxury amidst Ha Long Bay's natural wonder. Lullaby Sky Villa offers premium rooms, stunning views, and world-class service.";

/**
 * Title and description come from /admin/settings (SEO section) so staff can
 * change them without a deploy; the constants above are the fallback when
 * those fields are left blank.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  const title = settings.seo.metaTitle || FALLBACK_TITLE;
  const description = settings.seo.metaDescription || FALLBACK_DESCRIPTION;
  const siteName = settings.hotelName || "Lullaby Sky Villa";

  return {
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description,
    keywords: [
      siteName,
      "Ha Long Bay hotel",
      "luxury hotel Vietnam",
      "khách sạn Hạ Long",
      "khách sạn sang trọng",
    ],
    openGraph: {
      title,
      description,
      siteName,
      ...(settings.seo.ogImage ? { images: [settings.seo.ogImage] } : {}),
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: siteName,
    },
  };
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as "vi" | "en")) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} className="scroll-smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Lullaby" />
        {/* Apple touch icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144.png" />
        <link rel="apple-touch-icon" sizes="128x128" href="/icons/icon-128.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/icons/icon-72.png" />
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-[100dvh] flex flex-col antialiased overflow-x-hidden">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <LiveChat />
          <RegisterSW />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
