"use client";

import Script from "next/script";

/**
 * Tawk.to Live Chat Widget
 * Loads lazily after the page is idle for optimal performance.
 * Replace the property ID and chat ID with your Tawk.to account details.
 */
export function LiveChat() {
  // Using a placeholder Tawk.to ID — replace with actual account
  const tawkPropertyId = "PLACEHOLDER_PROPERTY_ID";
  const tawkWidgetId = "default";

  return (
    <Script
      id="tawk-to-script"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{
        __html: `
          var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
          (function(){
            var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
            s1.async=true;
            s1.src='https://embed.tawk.to/${tawkPropertyId}/${tawkWidgetId}';
            s1.charset='UTF-8';
            s1.setAttribute('crossorigin','*');
            s0.parentNode.insertBefore(s1,s0);
          })();
        `,
      }}
    />
  );
}
