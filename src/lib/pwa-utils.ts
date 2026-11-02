/**
 * PWA & Web Push Eligibility Utilities
 * Standardized logic for checking homescreen installation state,
 * notification permissions, and polite re-prompting timing.
 */

export const PWA_INSTALLED_KEY = "otuken_pwa_installed";
export const PWA_DISMISSED_KEY = "otuken_pwa_toast_dismissed";
export const PWA_SNOOZE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours snooze for "Later"

export interface PwaEligibilityCheckParams {
  isStandalone: boolean;
  isInstalledRecorded: boolean;
  notificationPermission?: "default" | "granted" | "denied";
  dismissedAtTimestamp?: number | null;
  isIOS?: boolean;
  currentTime?: number;
}

/**
 * Determines whether the PWA Install Toast / Offer should be presented to the user.
 *
 * Rules:
 * 1. If user is currently running in standalone mode (homescreen app), NEVER show.
 * 2. If user already installed AND granted notification permission, NEVER show again.
 * 3. On iOS, Web Push is only supported for homescreen apps. If permission is granted on iOS, NEVER show.
 * 4. If user chose "Later" (dismissed), suppress for 24 hours. Once 24 hours have passed, offer again.
 */
export function shouldShowInstallToast(params: PwaEligibilityCheckParams): boolean {
  const {
    isStandalone,
    isInstalledRecorded,
    notificationPermission = "default",
    dismissedAtTimestamp,
    isIOS = false,
    currentTime = Date.now(),
  } = params;

  // 1. If currently running in standalone / homescreen mode, user already installed!
  if (isStandalone) {
    return false;
  }

  // 2. If already recorded as installed AND notification permission is granted, NEVER show!
  if (isInstalledRecorded && notificationPermission === "granted") {
    return false;
  }

  // 3. On iOS, Web Push is only supported if installed to homescreen.
  // If notification permission is granted on iOS, it is 100% installed.
  if (isIOS && notificationPermission === "granted") {
    return false;
  }

  // 4. If user dismissed ("Later"), check if 24 hours have passed
  if (dismissedAtTimestamp && Number.isFinite(dismissedAtTimestamp)) {
    const elapsed = currentTime - dismissedAtTimestamp;
    if (elapsed < PWA_SNOOZE_DURATION_MS) {
      return false; // Still in cool-off period
    }
  }

  return true;
}
