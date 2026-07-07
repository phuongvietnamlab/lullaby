import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Lullaby Admin Panel",
  description: "Hotel management dashboard",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
