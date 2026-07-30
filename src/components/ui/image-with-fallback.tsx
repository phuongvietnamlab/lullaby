"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/**
 * Verified-alive luxury hotel-room photo used whenever a real image is missing
 * or fails to load. Guarantees the UI shows a pleasant room image instead of a
 * broken <img> or an empty grey box (dead Unsplash URL, or a room with no images
 * in the DB). Kept at a large width so it works for hero and gallery slots alike.
 */
const FALLBACK_SRC =
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80";

type Props = ImageProps & {
  /** Optional accessible label; falls back to `alt`. */
  fallbackLabel?: string;
};

/**
 * next/image wrapper that swaps to a real sample room photo (FALLBACK_SRC) when
 * the source is empty or fails to load. Client component: uses onError, so it can
 * be dropped into server components (hero, galleries, cards) wherever a remote
 * image may 404. The fallback is a plain <img> so it can load any host without a
 * next.config image-domain entry and cannot re-enter the next/image error path.
 */
export function ImageWithFallback({
  alt,
  className,
  fallbackLabel,
  fill,
  ...props
}: Props) {
  const [errored, setErrored] = useState(false);
  const hasSrc =
    typeof props.src === "string" ? props.src.length > 0 : Boolean(props.src);

  if (errored || !hasSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={FALLBACK_SRC}
        alt={
          typeof alt === "string"
            ? alt
            : fallbackLabel ?? "Lullaby Sky Villa"
        }
        className={
          fill
            ? "absolute inset-0 h-full w-full object-cover"
            : className
        }
      />
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
