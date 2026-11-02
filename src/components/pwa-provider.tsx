"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, X, ArrowLeft, ExternalLink } from "lucide-react";
import { VAPID_PUBLIC_KEY, urlB64ToUint8Array } from "@/lib/push-config";
import { PWA_INSTALLED_KEY } from "@/lib/pwa-utils";

declare global {
  interface Window {
    deferredPwaInstallPrompt?: any;
  }
}

async function syncPushSubscriptionSilently(reg: ServiceWorkerRegistration) {
  try {
    if (typeof window === "undefined" || !("Notification" in window) || !("pushManager" in reg)) {
      return;
    }

    if (Notification.permission !== "granted") {
      return;
    }

    let sub = await reg.pushManager.getSubscription();

    // If permission is already granted but subscription was lost / rotated by OS, silently recreate it
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    if (sub) {
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
    }
  } catch (err) {
    console.debug("Silent push sync notice:", err);
  }
}

export function PwaProvider() {
  const [foregroundNotification, setForegroundNotification] = useState<{
    title: string;
    body: string;
    url: string;
  } | null>(null);

  const [canPromptPermission, setCanPromptPermission] = useState(false);
  const [permissionSubscribing, setPermissionSubscribing] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker & Listen for Foreground Pushes
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
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
            syncPushSubscriptionSilently(reg);
          })
          .catch((err) => {
            console.warn("ServiceWorker registration failed:", err);
          });
      });

      // Also trigger silent sync if SW is already active
      navigator.serviceWorker.ready.then((reg) => {
        syncPushSubscriptionSilently(reg);
      });

      // Listen for message from sw.js when push arrives in FOREGROUND!
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === "PUSH_NOTIFICATION_RECEIVED") {
          const { title, body, url } = event.data.payload || {};
          setForegroundNotification({
            title: title || "ئۆتۈكەن — يېڭى ماقالە",
            body: body || "",
            url: url || "/uy",
          });
        }
      };

      navigator.serviceWorker.addEventListener("message", handleMessage);

      // Mark installed if running in standalone mode
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      if (isStandalone) {
        try {
          localStorage.setItem(PWA_INSTALLED_KEY, "true");
        } catch {}
      }

      // Check if notification permission is not decided yet
      if ("Notification" in window && Notification.permission === "default") {
        setCanPromptPermission(true);
      }

      // Cleanup
      return () => {
        navigator.serviceWorker.removeEventListener("message", handleMessage);
      };
    }
  }, []);

  useEffect(() => {
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

    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
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

  const handleEnableNotifications = async () => {
    setPermissionSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setCanPromptPermission(false);
        const reg = await navigator.serviceWorker.ready;
        await syncPushSubscriptionSilently(reg);
      } else {
        setCanPromptPermission(false);
      }
    } catch (err) {
      console.warn("Notification permission error:", err);
    } finally {
      setPermissionSubscribing(false);
    }
  };

  return (
    <>
      {/* 1. FOREGROUND IN-APP PUSH NOTIFICATION BANNER */}
      {foregroundNotification && (
        <aside
          className="foreground-push-toast"
          style={{
            position: "fixed",
            top: "20px",
            left: "20px",
            right: "20px",
            maxWidth: "500px",
            margin: "0 auto",
            zIndex: 999999,
            background: "#ffffff",
            border: "2px solid var(--wine)",
            borderRadius: "14px",
            boxShadow: "0 14px 40px rgba(104, 21, 42, 0.22)",
            padding: "16px 20px",
            animation: "pwa-slide-down 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
          dir="rtl"
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "var(--wine)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Bell size={20} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                <strong style={{ fontSize: "16px", color: "var(--ink)", lineHeight: 1.3 }}>
                  {foregroundNotification.title}
                </strong>
                <button
                  type="button"
                  onClick={() => setForegroundNotification(null)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)" }}
                  title="تاقاش"
                >
                  <X size={18} />
                </button>
              </div>

              {foregroundNotification.body && (
                <p style={{ margin: "4px 0 10px 0", fontSize: "14px", color: "var(--muted)", lineHeight: 1.45 }}>
                  {foregroundNotification.body}
                </p>
              )}

              <Link
                href={foregroundNotification.url}
                className="btn-submit"
                onClick={() => setForegroundNotification(null)}
                style={{ padding: "6px 14px", fontSize: "13px", display: "inline-flex", gap: "6px" }}
              >
                <span>ئوقۇش</span>
                <ArrowLeft size={14} />
              </Link>
            </div>
          </div>
        </aside>
      )}

      {/* 2. PROMPT TO ENABLE NOTIFICATIONS (If user hasn't chosen yet) */}
      {canPromptPermission && (
        <div
          className="push-permission-pill"
          style={{
            position: "fixed",
            bottom: "80px",
            insetInlineEnd: "20px",
            zIndex: 99998,
            background: "var(--wine)",
            color: "#ffffff",
            padding: "10px 16px",
            borderRadius: "30px",
            boxShadow: "0 6px 20px rgba(104, 21, 42, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13.5px",
            cursor: "pointer",
            fontWeight: "700",
          }}
          onClick={handleEnableNotifications}
          dir="rtl"
        >
          <Bell size={16} />
          <span>{permissionSubscribing ? "ئېچىلىۋاتىدۇ..." : "يېڭى يازما ئۇقتۇرۇشىنى قوزغىتىش"}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCanPromptPermission(false);
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              padding: "2px",
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
}
