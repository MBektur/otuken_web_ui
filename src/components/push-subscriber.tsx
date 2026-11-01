"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Check, Loader2 } from "lucide-react";
import { VAPID_PUBLIC_KEY } from "@/lib/push-config";

function urlB64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushSubscriber({ isUg = false }: { isUg?: boolean }) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    ) {
      setIsSupported(true);
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) {
            setIsSubscribed(true);
          }
        });
      });
    }
  }, []);

  const handleToggle = async () => {
    if (!isSupported) return;
    setLoading(true);
    setStatusText("");

    try {
      const reg = await navigator.serviceWorker.ready;

      if (isSubscribed) {
        // Unsubscribe
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "unsubscribe", endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
        setIsSubscribed(false);
        setStatusText(
          isUg
            ? "Уқтурушлар тақалди."
            : "ئۇقتۇرۇشلار تاقالدى."
        );
      } else {
        // Request permission & subscribe
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setStatusText(
            isUg
              ? "Уқтуруш рухсити берилмиди."
              : "ئۇقتۇرۇش رۇخسىتى بېرىلمىدى."
          );
          setLoading(false);
          return;
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        const subJson = sub.toJSON();

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: subJson }),
        });

        setIsSubscribed(true);
        setStatusText(
          isUg
            ? "Уқтуруш мувәппәқийәтлик қозғитилди!"
            : "يېڭى يازما ئۇقتۇرۇشى مۇۋەپپەقىيەتلىك قوزغىتىلدى!"
        );
      }
    } catch (err: any) {
      console.error("Push subscribe error:", err);
      setStatusText(
        isUg
          ? "Хаталиқ көрۈلدی. Қайта синап беқиң."
          : "خاتالىق كۆرۈلدى. قايتا سىناپ بېقىڭ."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) return null;

  return (
    <div className="push-subscriber-card" style={{ marginTop: "16px" }}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`pwa-toast-btn ${isSubscribed ? "secondary" : "primary"}`}
        style={{ width: "100%", justifyContent: "center", padding: "12px 18px" }}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : isSubscribed ? (
          <BellOff size={16} />
        ) : (
          <Bell size={16} />
        )}
        <span>
          {isSubscribed
            ? isUg
              ? "Уқтурушни Тақаش"
              : "ئۇقتۇرۇشنى تاقاش"
            : isUg
            ? "Йеңи Мақалә Уқтурушлирини Қозғитиش"
            : "يېڭى يازما ئۇقتۇرۇشلىرىنى قوزغىتىش"}
        </span>
      </button>

      {statusText && (
        <p
          style={{
            fontSize: "13px",
            color: isSubscribed ? "#166534" : "var(--muted)",
            marginTop: "8px",
            textAlign: "center",
          }}
        >
          {statusText}
        </p>
      )}
    </div>
  );
}

