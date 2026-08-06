"use client";

import Script from "next/script";

/**
 * Tawk.to Live Chat Widget
 * Loads lazily after the page is idle for optimal performance.
 *
 * Renders nothing until a real property ID is configured. It previously shipped
 * a literal "PLACEHOLDER_PROPERTY_ID", so every page load fetched
 * embed.tawk.to/PLACEHOLDER_PROPERTY_ID/default, got an HTML error page back,
 * and threw "Uncaught SyntaxError: Unexpected token '<'" in the console — while
 * still pinging a third party on every visit.
 *
 * Set NEXT_PUBLIC_TAWK_PROPERTY_ID (and optionally NEXT_PUBLIC_TAWK_WIDGET_ID)
 * to enable it.
 */
export function LiveChat() {
  const tawkPropertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID;
  const tawkWidgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID || "default";

  // Guard against both an unset value and the old placeholder being carried
  // over into an environment file.
  if (!tawkPropertyId || tawkPropertyId.startsWith("PLACEHOLDER")) {
    return null;
  }

  // Tawk ids are alphanumeric; refuse anything else rather than interpolating
  // unvalidated config into a script URL.
  if (
    !/^[A-Za-z0-9]+$/.test(tawkPropertyId) ||
    !/^[A-Za-z0-9]+$/.test(tawkWidgetId)
  ) {
    return null;
  }

  return (
    <Script
      id="tawk-to-script"
      strategy="lazyOnload"
      src={`https://embed.tawk.to/${tawkPropertyId}/${tawkWidgetId}`}
      crossOrigin="anonymous"
    />
  );
}
