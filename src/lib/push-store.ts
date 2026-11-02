import fs from "node:fs/promises";
import path from "node:path";
import webpush from "web-push";
import {
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
  VAPID_SUBJECT,
} from "./push-config";

// Initialize web-push with VAPID details
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export interface PushSubscriptionItem {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt?: string;
  userAgent?: string;
}

const DATA_DIR = path.resolve(process.cwd(), "src/data");
const SUBS_FILE = path.join(DATA_DIR, "push-subscriptions.json");

// In-memory cache of subscriptions
let memorySubs: PushSubscriptionItem[] | null = null;

function getKvCredentials() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function loadSubscriptions(): Promise<PushSubscriptionItem[]> {
  if (memorySubs !== null) return memorySubs;

  // 1. Try Cloud KV / Upstash Redis if configured on Vercel
  const kv = getKvCredentials();
  if (kv) {
    try {
      const res = await fetch(`${kv.url}/get/otuken_push_subs`, {
        headers: { Authorization: `Bearer ${kv.token}` },
        cache: "no-store",
      });
      const data = await res.json();
      if (data && data.result) {
        memorySubs = typeof data.result === "string" ? JSON.parse(data.result) : data.result;
        return memorySubs || [];
      }
    } catch (err) {
      console.warn("KV load error, falling back to local file:", err);
    }
  }

  // 2. Fallback to local JSON file (Localhost development)
  try {
    const raw = await fs.readFile(SUBS_FILE, "utf8");
    memorySubs = JSON.parse(raw);
    return memorySubs || [];
  } catch {
    memorySubs = [];
    return memorySubs;
  }
}

async function persistSubscriptions(subs: PushSubscriptionItem[]): Promise<void> {
  memorySubs = subs;

  // 1. Save to Cloud KV / Upstash Redis if on Vercel
  const kv = getKvCredentials();
  if (kv) {
    try {
      await fetch(`${kv.url}/set/otuken_push_subs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${kv.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subs),
      });
      return;
    } catch (err) {
      console.error("KV persist error:", err);
    }
  }

  // 2. Fallback to local JSON file
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(SUBS_FILE, JSON.stringify(subs, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to persist push subscriptions to disk:", err);
  }
}

export async function addSubscription(sub: PushSubscriptionItem): Promise<{ added: boolean; total: number }> {
  if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return { added: false, total: 0 };
  }
  const subs = await loadSubscriptions();
  const index = subs.findIndex((s) => s.endpoint === sub.endpoint);
  if (index >= 0) {
    subs[index] = { ...subs[index], ...sub, createdAt: subs[index].createdAt || new Date().toISOString() };
  } else {
    subs.push({
      ...sub,
      createdAt: new Date().toISOString(),
    });
  }
  await persistSubscriptions(subs);
  return { added: true, total: subs.length };
}

export async function removeSubscription(endpoint: string): Promise<{ removed: boolean; total: number }> {
  const subs = await loadSubscriptions();
  const filtered = subs.filter((s) => s.endpoint !== endpoint);
  await persistSubscriptions(filtered);
  return { removed: filtered.length < subs.length, total: filtered.length };
}

export async function getSubscriptionCount(): Promise<number> {
  const subs = await loadSubscriptions();
  return subs.length;
}

export interface BroadcastNotificationResult {
  total: number;
  sent: number;
  failed: number;
  pruned: number;
}

export async function broadcastNotification(payload: {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
}): Promise<BroadcastNotificationResult> {
  const subs = await loadSubscriptions();
  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/uy",
    icon: payload.icon || "/icons/icon-192x192.png",
    badge: payload.badge || "/icons/icon-192x192.png",
  });

  let sent = 0;
  let failed = 0;
  const deadEndpoints: string[] = [];

  const pushOptions = {
    TTL: 60 * 60 * 24, // 24 hours
    urgency: "high" as const, // High priority to wake sleeping iOS & Android devices immediately
  };

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        notificationPayload,
        pushOptions
      );
      sent++;
    } catch (error: any) {
      failed++;
      // If endpoint is 404 or 410 (unregistered / expired), mark for pruning
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        deadEndpoints.push(sub.endpoint);
      }
    }
  }

  let pruned = 0;
  if (deadEndpoints.length > 0) {
    const alive = subs.filter((s) => !deadEndpoints.includes(s.endpoint));
    await persistSubscriptions(alive);
    pruned = deadEndpoints.length;
  }

  return {
    total: subs.length,
    sent,
    failed,
    pruned,
  };
}

