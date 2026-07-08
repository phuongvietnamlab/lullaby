import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { galleryImages } from "@/lib/data/rooms";
import { getGalleryFromDB } from "@/lib/data/rooms-db";
import type { Metadata } from "next";
import { GalleryGrid } from "./gallery-grid";
import type { GalleryImage, GalleryCategory } from "@/lib/data/rooms";

// ISR: revalidate every 5 minutes
export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "vi" ? "Thư Viện Ảnh" : "Photo Gallery",
    description:
      locale === "vi"
        ? "Khám phá vẻ đẹp của Lullaby Sky Villa qua bộ sưu tập ảnh phòng nghỉ, cảnh biển, nhà hàng và tiện ích"
        : "Discover the beauty of Lullaby Sky Villa through our photo collection of rooms, ocean views, dining and facilities",
    openGraph: {
      title: locale === "vi" ? "Thư Viện Ảnh | Lullaby Sky Villa" : "Photo Gallery | Lullaby Sky Villa",
      images: [galleryImages[0].src],
    },
  };
}

// Placeholder blur data URL
const BLUR_PLACEHOLDER =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGBkaGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5vX2teleA8CkKyMzNJkj+o+pSlAVapKz//Z";

export default async function GalleryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Fetch gallery images from DB
  const dbImages = await getGalleryFromDB();

  // Map DB images to GalleryImage format, fall back to static if DB is empty
  let images: GalleryImage[];
  if (dbImages && dbImages.length > 0) {
    images = dbImages.map((img) => ({
      src: img.url,
      alt: img.alt || "Gallery image",
      category: (img.category || "rooms") as GalleryCategory,
      blurDataURL: BLUR_PLACEHOLDER,
    }));
  } else {
    images = galleryImages;
  }

  return <GalleryContent images={images} />;
}

function GalleryContent({ images }: { images: GalleryImage[] }) {
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
          <GalleryGrid images={images} />
        </div>
      </section>
    </>
  );
}
