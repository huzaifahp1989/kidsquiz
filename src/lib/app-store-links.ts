export const APP_STORE_LINKS = {
  ios:
    process.env.NEXT_PUBLIC_IOS_APP_URL ||
    'https://apps.apple.com/gb/app/islam-media-central-quran/id6754959416',
  android:
    process.env.NEXT_PUBLIC_ANDROID_APP_URL ||
    'https://play.google.com/store/apps/details?id=com.wnapp.id1761553570260&hl=en_GB',
};

export function hasConfiguredStoreLinks() {
  return Boolean(process.env.NEXT_PUBLIC_IOS_APP_URL || process.env.NEXT_PUBLIC_ANDROID_APP_URL);
}

export type StorePlatform = 'ios' | 'android';

function extractIosAppIdFromUrl(url: string): string | null {
  const match = url.match(/\/id(\d+)/i);
  return match?.[1] ?? null;
}

function extractAndroidPackageFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('id');
  } catch {
    return null;
  }
}

export function getStoreReviewLink(platform: StorePlatform): string {
  if (platform === 'ios') {
    const configuredId = process.env.NEXT_PUBLIC_IOS_APP_ID;
    const appId = configuredId || extractIosAppIdFromUrl(APP_STORE_LINKS.ios);
    if (!appId) return APP_STORE_LINKS.ios;
    return `https://apps.apple.com/app/id${appId}?action=write-review`;
  }

  const configuredPackage = process.env.NEXT_PUBLIC_ANDROID_PACKAGE_NAME;
  const packageName = configuredPackage || extractAndroidPackageFromUrl(APP_STORE_LINKS.android);
  if (!packageName) return APP_STORE_LINKS.android;
  return `https://play.google.com/store/apps/details?id=${packageName}&showAllReviews=true`;
}
