export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BKtNZBLK3SktKj9OCEzNAyPvuEjKVJlmHYRJVNN3QEynCXYmSFkm7_l4egF6Klo4kVBVyc6f7NgRmcxOxtuXIgE";

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  "d6Xuelue4PST-l2_CK46UelG3r7bqNiQHx7BLgZBP1U";

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:info@orhunpolicycenter.com";

export const PUSH_ADMIN_SECRET =
  process.env.PUSH_ADMIN_SECRET || "otuken-push-secret-2026";

export function urlB64ToUint8Array(base64String: string): any {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = typeof window !== "undefined" ? window.atob(base64) : Buffer.from(base64, "base64").toString("binary");
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

