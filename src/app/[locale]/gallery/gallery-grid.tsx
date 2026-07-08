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

      {/* Lightbox - Modern Design */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            onClick={() => setSelectedImage(null)}
            role="dialog"
            aria-modal="true"
            aria-label={selectedImage.alt}
          >
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />

            {/* Close button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 text-white/60 hover:text-white transition-colors p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-white/10"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image counter */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 text-white/60 text-sm font-medium">
              {filteredImages.indexOf(selectedImage) + 1} / {filteredImages.length}
            </div>

            {/* Navigation arrows */}
            {filteredImages.indexOf(selectedImage) > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const idx = filteredImages.indexOf(selectedImage);
                  setSelectedImage(filteredImages[idx - 1]);
                }}
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-10 text-white/60 hover:text-white transition-colors p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-white/10"
                aria-label="Previous"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {filteredImages.indexOf(selectedImage) < filteredImages.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const idx = filteredImages.indexOf(selectedImage);
                  setSelectedImage(filteredImages[idx + 1]);
                }}
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-10 text-white/60 hover:text-white transition-colors p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-white/10"
                aria-label="Next"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
              className="relative w-full h-full max-w-6xl max-h-[80vh] mx-4 sm:mx-8"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={selectedImage.src}
                alt={selectedImage.alt}
                fill
                sizes="100vw"
                className="object-contain rounded-lg"
                priority
              />
            </motion.div>

            {/* Caption */}
            {selectedImage.alt && selectedImage.alt !== "Gallery image" && (
              <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-10">
                <p className="text-white/70 text-sm bg-black/40 backdrop-blur-md px-4 py-2 rounded-full">
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
