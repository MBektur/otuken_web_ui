/**
 * PWA & Web Push Lifecycle & State Machine Utilities
 *
 * Handles detection of:
 * 1. App installation status (Standalone mode, appinstalled event, getInstalledRelatedApps)
 * 2. Uninstallation detection (beforeinstallprompt re-firing, empty getInstalledRelatedApps, iOS standalone freshness)
 * 3. Notification permission status ('granted', 'default', 'denied')
 * 4. Snooze / "Later" duration enforcement (24 hours)
 */

export const PWA_INSTALLED_KEY = "otuken_pwa_installed";
export const PWA_DISMISSED_KEY = "otuken_pwa_toast_dismissed";
export const PWA_LAST_STANDALONE_KEY = "otuken_pwa_last_standalone";
export const PWA_SNOOZE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours snooze for "Later"
export const PWA_IOS_EXPIRATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days without opening standalone on iOS

export type PwaUserState =
  | "NOT_INSTALLED" // User hasn't installed the app -> Offer install
  | "INSTALLED_NO_NOTIFICATIONS_STANDALONE" // User is inside installed app, notifications disabled -> In-app enable prompt
  | "INSTALLED_NO_NOTIFICATIONS_BROWSER" // User is in browser, app is installed, notifications disabled -> Prompt to open app & enable
  | "INSTALLED_AND_SUBSCRIBED" // App installed & notifications enabled -> Show nothing (clean)
  | "SNOOZED"; // Dismissed with "Later" within 24h -> Hidden until snooze expires

export interface PwaStateParams {
  isStandalone: boolean;
  isInstalledRecorded: boolean;
  lastStandaloneTimestamp?: number | null;
  notificationPermission?: "default" | "granted" | "denied";
  dismissedAtTimestamp?: number | null;
  isIOS?: boolean;
  currentTime?: number;
}

/**
 * Pure state machine evaluating exact user lifecycle state.
 */
export function determinePwaUserState(params: PwaStateParams): PwaUserState {
  const {
    isStandalone,
    isInstalledRecorded,
    lastStandaloneTimestamp,
    notificationPermission = "default",
    dismissedAtTimestamp,
    isIOS = false,
    currentTime = Date.now(),
  } = params;

  // Determine if install record is still active or considered uninstalled
  let isCurrentlyInstalled = isStandalone || isInstalledRecorded;

  // On iOS, Web Push permission can ONLY be granted if installed to the homescreen.
  if (isIOS && notificationPermission === "granted") {
    isCurrentlyInstalled = true;
  }

  // On iOS Safari browser: if marked as installed in the past, but standalone app was never
  // opened or not opened within the last 14 days, user likely cancelled or removed the WebClip.
  if (!isStandalone && isIOS && isInstalledRecorded && notificationPermission !== "granted") {
    if (!lastStandaloneTimestamp || (currentTime - lastStandaloneTimestamp > PWA_IOS_EXPIRATION_MS)) {
      isCurrentlyInstalled = false;
    }
  }

  // 1. Check snooze (dismissed with "Later")
  if (dismissedAtTimestamp && Number.isFinite(dismissedAtTimestamp)) {
    const elapsed = currentTime - dismissedAtTimestamp;
    if (elapsed < PWA_SNOOZE_DURATION_MS) {
      return "SNOOZED";
    }
  }

  // 2. Both installed AND notifications granted -> Completely clean
  if (isCurrentlyInstalled && notificationPermission === "granted") {
    return "INSTALLED_AND_SUBSCRIBED";
  }

  // 3. Running inside standalone app, but notification permission is not granted
  if (isStandalone && notificationPermission !== "granted") {
    return "INSTALLED_NO_NOTIFICATIONS_STANDALONE";
  }

  // 4. In regular browser, app was installed, but notifications are not granted
  if (isCurrentlyInstalled && notificationPermission !== "granted") {
    return "INSTALLED_NO_NOTIFICATIONS_BROWSER";
  }

  // 5. Not installed (or uninstalled) -> Offer installation
  return "NOT_INSTALLED";
}

/**
 * Helper to determine if an install/reminder toast should be shown to the user.
 */
export function shouldShowInstallToast(params: PwaStateParams): boolean {
  const state = determinePwaUserState(params);
  return state === "NOT_INSTALLED" || state === "INSTALLED_NO_NOTIFICATIONS_BROWSER";
}

/**
 * Asynchronously queries the operating system (Chrome/Android) to detect if the PWA is currently installed or was uninstalled.
 */
export async function syncRealAppInstallationState(): Promise<boolean | null> {
  if (typeof window === "undefined" || !("navigator" in window)) {
    return null;
  }

  // If in standalone mode, it is 100% installed
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true;

  if (isStandalone) {
    try {
      localStorage.setItem(PWA_INSTALLED_KEY, "true");
      localStorage.setItem(PWA_LAST_STANDALONE_KEY, String(Date.now()));
    } catch {}
    return true;
  }

  // If navigator.getInstalledRelatedApps is supported (Chromium/Android)
  if ("getInstalledRelatedApps" in navigator && typeof (navigator as any).getInstalledRelatedApps === "function") {
    try {
      const related = await (navigator as any).getInstalledRelatedApps();
      const isInstalled = Array.isArray(related) && related.length > 0;
      if (!isInstalled) {
        // App was uninstalled!
        localStorage.removeItem(PWA_INSTALLED_KEY);
      } else {
        localStorage.setItem(PWA_INSTALLED_KEY, "true");
      }
      return isInstalled;
    } catch {
      // Fallback
    }
  }

  return null;
}
