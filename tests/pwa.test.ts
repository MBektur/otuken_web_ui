import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import manifestConfig from "../src/app/manifest";
import { addSubscription, getSubscriptionCount, removeSubscription } from "../src/lib/push-store";

test("PWA manifest contains valid metadata and icons", () => {
  const m = manifestConfig();
  assert.equal(m.display, "standalone");
  assert.ok(m.icons && m.icons.length >= 3, "Manifest should have multiple icon sizes");
  assert.ok(m.icons?.some((i) => i.src === "/icons/icon-192x192.png"));
  assert.ok(m.icons?.some((i) => i.src === "/icons/icon-512x512.png"));
  assert.ok(m.icons?.some((i) => i.purpose === "maskable"));
});

test("PWA icon and favicon files exist in public directory", () => {
  const publicDir = path.resolve(process.cwd(), "public");
  assert.ok(fs.existsSync(path.join(publicDir, "favicon.ico")), "favicon.ico must exist");
  assert.ok(fs.existsSync(path.join(publicDir, "apple-touch-icon.png")), "apple-touch-icon must exist");
  assert.ok(fs.existsSync(path.join(publicDir, "icons/icon-192x192.png")), "icon-192x192 must exist");
  assert.ok(fs.existsSync(path.join(publicDir, "icons/icon-512x512.png")), "icon-512x512 must exist");
  assert.ok(fs.existsSync(path.join(publicDir, "icons/icon-maskable-512x512.png")), "maskable icon must exist");
  assert.ok(fs.existsSync(path.join(publicDir, "sw.js")), "Service worker must exist");
});

test("Service worker contains push and notificationclick event listeners", () => {
  const swPath = path.resolve(process.cwd(), "public/sw.js");
  const swContent = fs.readFileSync(swPath, "utf8");
  assert.ok(swContent.includes("addEventListener('push'"), "SW must have push handler");
  assert.ok(swContent.includes("addEventListener('notificationclick'"), "SW must have notificationclick handler");
});

test("Push subscription store handles add, count, and remove operations", async () => {
  const testEndpoint = "https://fcm.googleapis.com/fcm/send/test-unit-token-" + Date.now();
  const testSub = {
    endpoint: testEndpoint,
    keys: {
      p256dh: "BM123fakeKeyp256dhForUnitTestOnlyValueMustBeStoredCorrectly",
      auth: "fakeAuth12345678",
    },
  };

  const initialCount = await getSubscriptionCount();
  const addResult = await addSubscription(testSub);
  assert.equal(addResult.added, true);
  assert.equal(await getSubscriptionCount(), initialCount + 1);

  // Remove test subscription
  const removeResult = await removeSubscription(testEndpoint);
  assert.equal(removeResult.removed, true);
  assert.equal(await getSubscriptionCount(), initialCount);
});

