"use client";

import { useEffect, useState } from "react";

export function RegisterSW() {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");

        // Check for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New content available, show update prompt
              setShowUpdate(true);
            }
          });
        });

        // Handle controller change (when new SW activates)
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          // Auto-reload when new SW takes over
          window.location.reload();
        });
      } catch (err) {
        console.log("SW registration failed:", err);
      }
    };

    registerSW();
  }, []);

  const handleUpdate = () => {
    setShowUpdate(false);
    // Tell waiting SW to skip waiting
    navigator.serviceWorker.ready.then((registration) => {
      registration.waiting?.postMessage({ type: "SKIP_WAITING" });
    });
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-4 sm:w-80 z-[200] safe-bottom">
      <div className="bg-white border border-[var(--color-border)] rounded-xl shadow-[var(--shadow-elevated)] p-4 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--color-text)]">
            Phiên bản mới có sẵn
          </p>
          <p className="text-xs text-[var(--color-text-light)] mt-0.5">
            Cập nhật để có trải nghiệm tốt nhất
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            className="text-xs text-[var(--color-text-light)] py-2 px-3 min-h-[44px] flex items-center"
          >
            Bỏ qua
          </button>
          <button
            onClick={handleUpdate}
            className="text-xs font-medium bg-[var(--color-accent)] text-[var(--color-primary-dark)] py-2 px-4 rounded-lg min-h-[44px] flex items-center"
          >
            Cập nhật
          </button>
        </div>
      </div>
    </div>
  );
}
