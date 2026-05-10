import { Capacitor } from '@capacitor/core';
import { InAppReview } from '@capacitor-community/in-app-review';
import { APP_STORE_LINKS, StorePlatform, getStoreReviewLink } from '@/lib/app-store-links';

export type ReviewResult =
  | { status: 'requested'; platform: StorePlatform }
  | { status: 'cooldown'; platform: StorePlatform }
  | { status: 'fallback_opened'; platform: StorePlatform }
  | { status: 'unavailable'; platform: StorePlatform }
  | { status: 'error'; platform: StorePlatform; message: string };

const REVIEW_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 30;
const REVIEW_COOLDOWN_KEY = 'iklp_review_last_requested_at';

export function isNativeCapacitorRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  return Capacitor.isNativePlatform();
}

function isCooldownActive(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = window.localStorage.getItem(REVIEW_COOLDOWN_KEY);
  const lastRequestedAt = Number(raw || '0');
  if (!lastRequestedAt) return false;
  return Date.now() - lastRequestedAt < REVIEW_COOLDOWN_MS;
}

function markReviewRequestedNow() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(REVIEW_COOLDOWN_KEY, String(Date.now()));
}

async function requestNativeReview(): Promise<boolean> {
  try {
    await InAppReview.requestReview();
    return true;
  } catch {
    return false;
  }
}

function buildAndroidMarketIntentUrl(): string | null {
  const reviewUrl = getStoreReviewLink('android');
  try {
    const parsed = new URL(reviewUrl);
    const packageName = parsed.searchParams.get('id');
    if (!packageName) return null;
    return `market://details?id=${packageName}`;
  } catch {
    return null;
  }
}

export function openStoreReview(platform: StorePlatform) {
  const reviewUrl = getStoreReviewLink(platform);

  if (typeof window === 'undefined') return;

  if (platform === 'android') {
    const marketIntent = buildAndroidMarketIntentUrl();
    if (marketIntent) {
      window.location.href = marketIntent;
      return;
    }
  }

  window.open(reviewUrl, '_blank', 'noopener,noreferrer');
}

export async function requestInAppReviewWithFallback(platform: StorePlatform): Promise<ReviewResult> {
  try {
    if (isCooldownActive()) {
      return { status: 'cooldown', platform };
    }

    if (!isNativeCapacitorRuntime()) {
      openStoreReview(platform);
      markReviewRequestedNow();
      return { status: 'fallback_opened', platform };
    }

    const nativePlatform = Capacitor.getPlatform();
    if (nativePlatform !== platform) {
      openStoreReview(platform);
      markReviewRequestedNow();
      return { status: 'fallback_opened', platform };
    }

    const requested = await requestNativeReview();
    if (requested) {
      markReviewRequestedNow();
      return { status: 'requested', platform };
    }

    openStoreReview(platform);
    markReviewRequestedNow();
    return { status: 'fallback_opened', platform };
  } catch (error) {
    return {
      status: 'error',
      platform,
      message: error instanceof Error ? error.message : 'Unexpected review error.',
    };
  }
}

export function getStoreLink(platform: StorePlatform): string {
  return platform === 'ios' ? APP_STORE_LINKS.ios : APP_STORE_LINKS.android;
}
