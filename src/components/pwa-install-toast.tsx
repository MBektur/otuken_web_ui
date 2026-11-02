"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, Share, X, Sparkles, Smartphone, BellRing, CheckCircle2 } from "lucide-react";
import {
  determinePwaUserState,
  PwaUserState,
  PWA_INSTALLED_KEY,
  PWA_DISMISSED_KEY,
  PWA_LAST_STANDALONE_KEY,
  syncRealAppInstallationState,
} from "@/lib/pwa-utils";

export function PwaInstallToast() {
  const pathname = usePathname();
  const isUg = pathname?.startsWith("/ug");

  const [visible, setVisible] = useState(false);
  const [userState, setUserState] = useState<PwaUserState>("NOT_INSTALLED");
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
        localStorage.setItem(PWA_LAST_STANDALONE_KEY, String(Date.now()));
      } catch { }
    }

    // 2. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isAppleDevice);

    const evaluateState = () => {
      const isInstalledRecorded = localStorage.getItem(PWA_INSTALLED_KEY) === "true";
      const dismissedAtStr = localStorage.getItem(PWA_DISMISSED_KEY);
      const dismissedAtTimestamp = dismissedAtStr ? Number(dismissedAtStr) : null;
      const lastStandaloneStr = localStorage.getItem(PWA_LAST_STANDALONE_KEY);
      const lastStandaloneTimestamp = lastStandaloneStr ? Number(lastStandaloneStr) : null;
      const notificationPermission =
        "Notification" in window ? (Notification.permission as any) : "default";

      const state = determinePwaUserState({
        isStandalone,
        isInstalledRecorded,
        lastStandaloneTimestamp,
        notificationPermission,
        dismissedAtTimestamp,
        isIOS: isAppleDevice,
      });

      setUserState(state);
      return state;
    };

    const currentState = evaluateState();

    // Only show if user has not installed, OR if they installed but haven't enabled notifications while visiting via browser
    if (currentState !== "NOT_INSTALLED" && currentState !== "INSTALLED_NO_NOTIFICATIONS_BROWSER") {
      return;
    }

    // Check if beforeinstallprompt is ready
    if (window.deferredPwaInstallPrompt) {
      setCanPrompt(true);
    }

    const onInstallReady = () => {
      // If browser fires beforeinstallprompt, app is NOT currently installed (or was uninstalled)
      try {
        localStorage.removeItem(PWA_INSTALLED_KEY);
      } catch { }
      evaluateState();
      setCanPrompt(true);
    };
    window.addEventListener("pwa-install-ready", onInstallReady);

    // Android/Chrome appinstalled event listener
    const onAppInstalled = () => {
      try {
        localStorage.setItem(PWA_INSTALLED_KEY, "true");
      } catch { }
      setVisible(false);
    };
    window.addEventListener("appinstalled", onAppInstalled);

    // Sync real OS installation state (Chrome/Android getInstalledRelatedApps)
    syncRealAppInstallationState().then((installed) => {
      if (installed === false) {
        // App was uninstalled from the device!
        evaluateState();
      }
    });

    // Show after slight delay for polite user experience
    const timer = setTimeout(() => {
      const finalState = evaluateState();
      if (finalState === "NOT_INSTALLED" || finalState === "INSTALLED_NO_NOTIFICATIONS_BROWSER") {
        setVisible(true);
      }
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
          } catch { }
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
    } catch { }
  };

  if (!visible) return null;

  const installHref = isUg ? "/ug/install" : "/uy/install";
  const isInstalledNoNotification = userState === "INSTALLED_NO_NOTIFICATIONS_BROWSER";

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
          <div style={{ position: "relative" }}>
            <img
              src="/icons/icon-192x192.png"
              alt="Ötüken Logo"
              className="pwa-toast-avatar"
              width={48}
              height={48}
            />
            {isInstalledNoNotification && (
              <span
                style={{
                  position: "absolute",
                  bottom: "-4px",
                  insetInlineEnd: "-4px",
                  background: "var(--wine)",
                  color: "#ffffff",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                }}
              >
                <BellRing size={11} />
              </span>
            )}
          </div>

          <div className="pwa-toast-text">
            <div className="pwa-toast-title">
              <strong>
                {isInstalledNoNotification
                  ? isUg
                    ? "Өтүкән Әпи вә Уқтуруш"
                    : "ئۆتۈكەن ئەپى ۋە ئۇقتۇرۇش"
                  : isUg
                    ? "Өтүкән Әпини Қачилаң"
                    : "ئۆتۈكەن ئەپىنى قاچىلاڭ"}
              </strong>
              <span className="pwa-toast-badge">
                {isInstalledNoNotification ? (isUg ? "Уқтуруш" : "ئۇقتۇرۇش") : "PWA"}
              </span>
            </div>
            <p className="pwa-toast-desc">
              {isInstalledNoNotification
                ? isUg
                  ? "Өтүкәن әпини қачилиғансиз, амма уқтуруш қозғитилмиған. Йеңи язмилардин хәвәрдар болуш үчүн баш экрандики әпкә кирип уқтурушни ечиң."
                  : "ئۆتۈكەن ئەپىنى قاچىلىدىڭىز، ئەمما ئۇقتۇرۇش قوزغىتىلمىغان. يېڭى يازمىلاردىن خەۋەردار بولۇش ئۈچۈن باش ئېكراندىكى ئەپلەر تىزىملىكىدىن ئەپكە كىرىپ ئۇقتۇرۇشنى ئېچىڭ."
                : isIOS
                  ? isUg
                    ? "Сафарида [Һәмбәһирләш] түгүсини бесиپ, «Баш экранға қошуш»ни таллаң."
                    : "سافارىدا «ھەمبەھىرلەش» سىنبەلگىسىنى بېسىپ، «باش ئېكرانغا قوشۇش»نى تاللاڭ."
                  : isUg
                    ? "Тез йүклиниш, торсиз оқуш вә йеңи язмиلارдин дәрһал хәвәрдар болуш үчүн."
                    : "تېز يۈكلىنىش، تورسىزمۇ ئوقۇش ۋە يېڭى يازمىلاردىن دەرھال خەۋەردار بولۇش ئۈچۈن."}
            </p>
          </div>
        </div>

        <div className="pwa-toast-actions">
          {isInstalledNoNotification ? (
            <button
              type="button"
              className="pwa-toast-btn primary"
              onClick={handleDismiss}
            >
              <CheckCircle2 size={14} />
              <span>{isUg ? "Чүшәндим" : "چۈشەندىم"}</span>
            </button>
          ) : canPrompt ? (
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
              <span>{isUg ? "Қолلانма" : "قاچىلاش قوللانمىسى"}</span>
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
