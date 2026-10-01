import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "../globals.css";
import "./admin-v2.css";

export const metadata: Metadata = {
  title: "Lullaby Admin Panel",
  description: "Hotel management dashboard",
};

// Next already defaults width/initialScale, so the two fields that earn this
// export are maximumScale (5, not 1 — pinch-zoom is how staff read dense tables,
// and capping it is an accessibility regression) and viewportFit ("cover", or the
// env(safe-area-inset-*) behind .safe-top in globals.css resolves to 0 on a notch).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

const headingFont = Cormorant_Garamond({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-heading",
  display: "swap",
});

const bodyFont = Manrope({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body className="bg-gray-50 text-gray-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
