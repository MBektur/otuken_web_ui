"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    deferredPwaInstallPrompt?: any;
  }
}

export function PwaProvider() {
  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            // Check for updates
            reg.addEventListener("updatefound", () => {
              const installingWorker = reg.installing;
              if (installingWorker) {
                installingWorker.addEventListener("statechange", () => {
                  if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                    console.log("New content available; will update on reload.");
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.warn("ServiceWorker registration failed:", err);
          });
      });
    }

    // 2. Capture beforeinstallprompt for PWA installation
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      window.deferredPwaInstallPrompt = e;
      window.dispatchEvent(new CustomEvent("pwa-install-ready"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 3. Fix Finger Zoom / iOS pinch zoom disruption
    const handleGestureStart = (e: Event) => {
      e.preventDefault();
    };

    // Prevent double-tap zoom delay on sensitive elements
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        // Prevent accidental double tap zoom on interactive elements
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === "BUTTON" || target.tagName === "A" || target.closest("button") || target.closest("a"))) {
          // let normal click occur
        }
      }
      lastTouchEnd = now;
    };

    document.addEventListener("gesturestart", handleGestureStart, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      document.removeEventListener("gesturestart", handleGestureStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return null;
}

