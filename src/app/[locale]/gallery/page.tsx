import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { galleryImages } from "@/lib/data/rooms";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import type { Metadata } from "next";
import { GalleryGrid } from "./gallery-grid";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "vi" ? "Thư Viện Ảnh" : "Photo Gallery",
    description:
      locale === "vi"
        ? "Khám phá vẻ đẹp của HASANA Hotel qua bộ sưu tập ảnh phòng nghỉ, cảnh biển, nhà hàng và tiện ích"
        : "Discover the beauty of HASANA Hotel through our photo collection of rooms, ocean views, dining and facilities",
    openGraph: {
      title: locale === "vi" ? "Thư Viện Ảnh | HASANA Hotel" : "Photo Gallery | HASANA Hotel",
      images: [galleryImages[0].src],
    },
  };
}

export default async function GalleryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GalleryContent />;
}

function GalleryContent() {
  const t = useTranslations("gallery");

  return (
    <>
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[350px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-primary-dark)] via-[var(--color-primary)] to-[var(--color-primary-light)]" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="font-[family-name:var(--font-heading)] text-4xl md:text-6xl lg:text-7xl font-medium mb-4">
            {t("title")}
          </h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto">
            {t("subtitle")}
          </p>
          <div className="luxury-divider mx-auto mt-8" />
        </div>
      </section>

      {/* Gallery */}
      <section className="py-[var(--spacing-section)] px-4">
        <div className="max-w-7xl mx-auto">
          <GalleryGrid images={galleryImages} />
        </div>
      </section>
    </>
  );
}
