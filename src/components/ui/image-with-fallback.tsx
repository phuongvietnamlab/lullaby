"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type Props = ImageProps & {
  /** Text shown inside the placeholder when the image is missing or fails to load. */
  fallbackLabel?: string;
};

/**
 * next/image wrapper that renders a branded placeholder instead of a broken
 * <img> when the source is empty or fails to load (e.g. a dead Unsplash URL or a
 * room with no images). Client component: uses onError, so it can be dropped into
 * server components (hero, galleries, cards) wherever a remote image may 404.
 */
export function ImageWithFallback({
  alt,
  className,
  fallbackLabel,
  fill,
  ...props
}: Props) {
  const [errored, setErrored] = useState(false);
  const hasSrc = typeof props.src === "string" ? props.src.length > 0 : Boolean(props.src);

  if (errored || !hasSrc) {
    return (
      <div
        role="img"
        aria-label={typeof alt === "string" ? alt : undefined}
        className={`flex items-center justify-center bg-[var(--color-surface-dim)] ${
          fill ? "absolute inset-0" : className ?? ""
        }`}
      >
        <span className="px-3 text-center text-[10px] sm:text-xs uppercase tracking-widest text-[var(--color-text-light)]">
          {fallbackLabel ?? "Lullaby Sky Villa"}
        </span>
      </div>
    );
  }

  return (
    <Image
      alt={alt}
      className={className}
      fill={fill}
      onError={() => setErrored(true)}
      {...props}
    />
  );
}
