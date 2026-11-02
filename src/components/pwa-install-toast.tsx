"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, Share, X, Sparkles, Smartphone } from "lucide-react";
import {
  shouldShowInstallToast,
  PWA_INSTALLED_KEY,
  PWA_DISMISSED_KEY,
} from "@/lib/pwa-utils";

export function PwaInstallToast() {
  const pathname = usePathname();
  const isUg = pathname?.startsWith("/ug");

  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);

  useEffect(() => {
    // 1. Detect standalone (homescreen) mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      try {
        localStorage.setItem(PWA_INSTALLED_KEY, "true");
      } catch {}
    }

    // 2. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isAppleDevice);

    // 3. Check installation record, dismissal time, and notification permission
    const isInstalledRecorded = localStorage.getItem(PWA_INSTALLED_KEY) === "true";
    const dismissedAtStr = localStorage.getItem(PWA_DISMISSED_KEY);
    const dismissedAtTimestamp = dismissedAtStr ? Number(dismissedAtStr) : null;
    const notificationPermission =
      "Notification" in window ? (Notification.permission as any) : "default";

    const isEligible = shouldShowInstallToast({
      isStandalone,
      isInstalledRecorded,
      notificationPermission,
      dismissedAtTimestamp,
      isIOS: isAppleDevice,
    });

    if (!isEligible) {
      return;
    }

    if (window.deferredPwaInstallPrompt) {
      setCanPrompt(true);
    }

    const onInstallReady = () => {
      setCanPrompt(true);
    };
    window.addEventListener("pwa-install-ready", onInstallReady);

    // 4. Android/Chrome appinstalled event listener
    const onAppInstalled = () => {
      try {
        localStorage.setItem(PWA_INSTALLED_KEY, "true");
      } catch {}
      setVisible(false);
    };
    window.addEventListener("appinstalled", onAppInstalled);

    // Show after slight delay for polite user experience
    const timer = setTimeout(() => {
      setVisible(true);
    }, 2500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("pwa-install-ready", onInstallReady);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (window.deferredPwaInstallPrompt) {
      try {
        await window.deferredPwaInstallPrompt.prompt();
        const choice = await window.deferredPwaInstallPrompt.userChoice;
        if (choice.outcome === "accepted") {
          try {
            localStorage.setItem(PWA_INSTALLED_KEY, "true");
          } catch {}
          setVisible(false);
        }
        window.deferredPwaInstallPrompt = null;
        setCanPrompt(false);
      } catch (err) {
        console.warn("Install prompt error:", err);
      }
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(PWA_DISMISSED_KEY, String(Date.now()));
    } catch {}
  };

  if (!visible) return null;

  const installHref = isUg ? "/ug/install" : "/uy/install";

  return (
    <aside
      className="pwa-install-toast"
      aria-label={isUg ? "Қачила Bildirgisi" : "قاچىلاش ئۇقتۇرۇشى"}
      dir={isUg ? "ltr" : "rtl"}
    >
      <div className="pwa-toast-inner">
        <button
          type="button"
          className="pwa-toast-close"
          onClick={handleDismiss}
          aria-label={isUg ? "Йепиш" : "تاقاش"}
          title={isUg ? "Йепиш" : "تاقاش"}
        >
          <X size={15} />
        </button>

        <div className="pwa-toast-content">
          <img
            src="/icons/icon-192x192.png"
            alt="Ötüken Logo"
            className="pwa-toast-avatar"
            width={48}
            height={48}
          />
          <div className="pwa-toast-text">
            <div className="pwa-toast-title">
              <strong>{isUg ? "Өтүкән Әпини Қачилаң" : "ئۆتۈكەن ئەپىنى قاچىلاڭ"}</strong>
              <span className="pwa-toast-badge">PWA</span>
            </div>
            <p className="pwa-toast-desc">
              {isIOS
                ? isUg
                  ? "Сафарида [Һәмбәһирләш] түгүсини бесип, «Баш экранға қошуш»ни таллаң."
                  : "سافارىدا «ھەمبەھىرلەش» سىنبەلگىسىنى بېسىپ، «باش ئېكرانغا قوشۇش»نى تاللاڭ."
                : isUg
                ? "Тез йүклиниш, торсиз оқуш вә йеңи язмилардин дәрһал хәвәрдар болуш үчүн."
                : "تېز يۈكلىنىش، تورسىزمۇ ئوقۇش ۋە يېڭى يازمىلاردىن دەرھال خەۋەردار بولۇش ئۈچۈن."}
            </p>
          </div>
        </div>

        <div className="pwa-toast-actions">
          {canPrompt ? (
            <button
              type="button"
              className="pwa-toast-btn primary"
              onClick={handleInstallClick}
            >
              <Download size={14} />
              <span>{isUg ? "Қачилаش" : "قاچىلاش"}</span>
            </button>
          ) : (
            <Link
              href={installHref}
              className="pwa-toast-btn primary"
              onClick={() => setVisible(false)}
            >
              {isIOS ? <Share size={14} /> : <Smartphone size={14} />}
              <span>{isUg ? "Қолланма" : "قاچىلاش قوللانمىسى"}</span>
            </Link>
          )}

          <button
            type="button"
            className="pwa-toast-btn secondary"
            onClick={handleDismiss}
          >
            <span>{isUg ? "Кейин" : "كېيىن"}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

