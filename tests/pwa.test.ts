import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import manifestConfig from "../src/app/manifest";
import { addSubscription, getSubscriptionCount, removeSubscription } from "../src/lib/push-store";
import {
  shouldShowInstallToast,
  determinePwaUserState,
  PWA_SNOOZE_DURATION_MS,
  PWA_IOS_EXPIRATION_MS,
} from "../src/lib/pwa-utils";

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

test("shouldShowInstallToast: correctly enforces snooze, standalone, and installed notification state", () => {
  const now = 1762100000000;

  // Case 1: Fresh user, never installed, never dismissed -> SHOW
  assert.equal(
    shouldShowInstallToast({
      isStandalone: false,
      isInstalledRecorded: false,
      notificationPermission: "default",
      dismissedAtTimestamp: null,
      currentTime: now,
    }),
    true,
    "Fresh visitor should be offered install toast"
  );

  // Case 2: In standalone mode (homescreen app) -> NEVER SHOW
  assert.equal(
    shouldShowInstallToast({
      isStandalone: true,
      isInstalledRecorded: false,
      notificationPermission: "default",
      currentTime: now,
    }),
    false,
    "Running in standalone mode should never show install toast"
  );

  // Case 3: Installed recorded AND notification permission granted -> NEVER SHOW
  assert.equal(
    shouldShowInstallToast({
      isStandalone: false,
      isInstalledRecorded: true,
      notificationPermission: "granted",
      currentTime: now,
    }),
    false,
    "Installed with notifications granted should never show install toast"
  );

  // Case 4: iOS with notification permission granted -> NEVER SHOW (only possible if installed on iOS)
  assert.equal(
    shouldShowInstallToast({
      isStandalone: false,
      isInstalledRecorded: false,
      notificationPermission: "granted",
      isIOS: true,
      currentTime: now,
    }),
    false,
    "iOS device with granted notification permission implies homescreen installation"
  );

  // Case 5: User clicked 'Later' 2 hours ago -> DO NOT SHOW (snooze active)
  assert.equal(
    shouldShowInstallToast({
      isStandalone: false,
      isInstalledRecorded: false,
      notificationPermission: "default",
      dismissedAtTimestamp: now - 2 * 60 * 60 * 1000,
      currentTime: now,
    }),
    false,
    "Dismissed within 24 hours should remain hidden"
  );

  // Case 6: User clicked 'Later' 25 hours ago -> SHOW AGAIN (snooze expired)
  assert.equal(
    shouldShowInstallToast({
      isStandalone: false,
      isInstalledRecorded: false,
      notificationPermission: "default",
      dismissedAtTimestamp: now - (PWA_SNOOZE_DURATION_MS + 60 * 1000),
      currentTime: now,
    }),
    true,
    "Dismissed over 24 hours ago should re-prompt installation"
  );
});

test("determinePwaUserState: handles all 5 lifecycle states and uninstallation recovery", () => {
  const now = 1762100000000;

  // 1. Not installed
  assert.equal(
    determinePwaUserState({
      isStandalone: false,
      isInstalledRecorded: false,
      notificationPermission: "default",
      currentTime: now,
    }),
    "NOT_INSTALLED"
  );

  // 2. Installed, but inside regular browser and notifications not active yet
  assert.equal(
    determinePwaUserState({
      isStandalone: false,
      isInstalledRecorded: true,
      lastStandaloneTimestamp: now - 1000,
      notificationPermission: "default",
      currentTime: now,
    }),
    "INSTALLED_NO_NOTIFICATIONS_BROWSER"
  );

  // 3. Inside standalone app, but notifications not active yet
  assert.equal(
    determinePwaUserState({
      isStandalone: true,
      isInstalledRecorded: true,
      notificationPermission: "default",
      currentTime: now,
    }),
    "INSTALLED_NO_NOTIFICATIONS_STANDALONE"
  );

  // 4. Installed and notifications granted
  assert.equal(
    determinePwaUserState({
      isStandalone: true,
      isInstalledRecorded: true,
      notificationPermission: "granted",
      currentTime: now,
    }),
    "INSTALLED_AND_SUBSCRIBED"
  );

  // 5. User dismissed with 'Later' within 24h
  assert.equal(
    determinePwaUserState({
      isStandalone: false,
      isInstalledRecorded: false,
      notificationPermission: "default",
      dismissedAtTimestamp: now - 3600 * 1000,
      currentTime: now,
    }),
    "SNOOZED"
  );

  // 6. Uninstallation on iOS: was marked installed, but standalone hasn't been launched in > 14 days
  assert.equal(
    determinePwaUserState({
      isStandalone: false,
      isInstalledRecorded: true,
      lastStandaloneTimestamp: now - (PWA_IOS_EXPIRATION_MS + 100000),
      isIOS: true,
      notificationPermission: "default",
      currentTime: now,
    }),
    "NOT_INSTALLED",
    "Expired standalone launch indicates app uninstalled on iOS"
  );
});



