"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import type { GalleryImage, GalleryCategory } from "@/lib/data/rooms";

type GalleryGridProps = {
  images: GalleryImage[];
};

const categories: GalleryCategory[] = ["rooms", "views", "dining", "spa", "facilities"];

export function GalleryGrid({ images }: GalleryGridProps) {
  const [activeCategory, setActiveCategory] = useState<GalleryCategory | "all">("all");
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const t = useTranslations("gallery");

  const filteredImages =
    activeCategory === "all"
      ? images
      : images.filter((img) => img.category === activeCategory);
  const selectedIndex = selectedImage ? filteredImages.indexOf(selectedImage) : -1;

  return (
    <>
      {/* Category Filter - horizontal scrollable on mobile */}
      <div className="mb-8 sm:mb-12 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex sm:flex-wrap sm:justify-center gap-2 sm:gap-3 overflow-x-auto scroll-touch pb-2 sm:pb-0">
          <button
            onClick={() => setActiveCategory("all")}
            className={`flex-shrink-0 px-4 sm:px-5 py-2.5 text-xs uppercase tracking-widest transition-all duration-[var(--duration-normal)] min-h-[44px] flex items-center ${
              activeCategory === "all"
                ? "bg-[var(--color-primary)] text-white"
                : "border border-[var(--color-border)] text-[var(--color-text-light)] hover:border-[var(--color-primary)]"
            }`}
          >
            {t("all")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 sm:px-5 py-2.5 text-xs uppercase tracking-widest transition-all duration-[var(--duration-normal)] min-h-[44px] flex items-center ${
                activeCategory === cat
                  ? "bg-[var(--color-primary)] text-white"
                  : "border border-[var(--color-border)] text-[var(--color-text-light)] hover:border-[var(--color-primary)]"
              }`}
            >
              {t(`categories.${cat}` as never)}
            </button>
          ))}
        </div>
      </div>

      {/* Image Grid - 1 col mobile, 2 tablet, 3-4 desktop */}
      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <AnimatePresence mode="popLayout">
          {filteredImages.map((image, idx) => (
            <motion.div
              key={image.src}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: idx * 0.03 }}
              className={`relative cursor-pointer overflow-hidden rounded-sm ${
                idx % 5 === 0 ? "sm:col-span-2 sm:row-span-2" : ""
              }`}
            >
              <button
                onClick={() => setSelectedImage(image)}
                className="relative w-full aspect-square group"
                aria-label={image.alt}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes={idx % 5 === 0 ? "(max-width: 640px) 100vw, (max-width: 768px) 100vw, 50vw" : "(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"}
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  placeholder="blur"
                  blurDataURL={image.blurDataURL}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                  </svg>
                </div>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-5 sm:px-8 sm:py-8"
            onClick={() => setSelectedImage(null)}
            role="dialog"
            aria-modal="true"
            aria-label={selectedImage.alt}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.22_0.02_260_/_0.94),oklch(0.08_0.01_260_/_0.98)_58%,black)] backdrop-blur-xl"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/35" />

            {/* Top bar */}
            <div className="absolute inset-x-4 top-4 z-20 flex items-center justify-between gap-4 sm:inset-x-8 sm:top-6">
              <div className="min-w-0 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white/80 shadow-2xl backdrop-blur-md">
                <p className="truncate text-xs font-medium tracking-[0.14em]">
                  {selectedIndex + 1} / {filteredImages.length}
                  {selectedImage.alt && selectedImage.alt !== "Gallery image" ? (
                    <span className="ml-3 hidden text-white/55 sm:inline">
                      {selectedImage.alt}
                    </span>
                  ) : null}
                </p>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/75 shadow-2xl backdrop-blur-md transition-all duration-[var(--duration-normal)] hover:bg-white/15 hover:text-white"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation arrows */}
            {selectedIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(filteredImages[selectedIndex - 1]);
                }}
                className="absolute left-3 top-1/2 z-20 flex min-h-[46px] min-w-[46px] -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/70 shadow-2xl backdrop-blur-md transition-all duration-[var(--duration-normal)] hover:bg-white/15 hover:text-white sm:left-8"
                aria-label="Previous"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {selectedIndex < filteredImages.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(filteredImages[selectedIndex + 1]);
                }}
                className="absolute right-3 top-1/2 z-20 flex min-h-[46px] min-w-[46px] -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/70 shadow-2xl backdrop-blur-md transition-all duration-[var(--duration-normal)] hover:bg-white/15 hover:text-white sm:right-8"
                aria-label="Next"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Main image */}
            <motion.div
              key={selectedImage.src}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
              className="relative h-full max-h-[78vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-2 shadow-[0_28px_90px_oklch(0_0_0_/_0.45)] sm:p-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-full w-full overflow-hidden rounded-xl bg-black/20">
                <Image
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority
                />
              </div>
            </motion.div>

            {/* Mobile caption */}
            {selectedImage.alt && selectedImage.alt !== "Gallery image" && (
              <div className="absolute bottom-4 left-1/2 z-20 w-[calc(100%-2rem)] -translate-x-1/2 sm:hidden">
                <p className="truncate rounded-full border border-white/10 bg-white/10 px-4 py-2 text-center text-xs text-white/75 backdrop-blur-md">
                  {selectedImage.alt}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
