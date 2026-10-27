import { Linking, Platform } from 'react-native';

// The original booklet (public/Carols.pdf). On the web it opens in a new tab at the right page.
// On a phone it opens the published website's copy. Set EXPO_PUBLIC_SITE_URL if the site address changes.
const base = process.env.EXPO_PUBLIC_BASE_URL || '';
const site = process.env.EXPO_PUBLIC_SITE_URL || 'https://roosewelt-nacth.github.io/carols';

export function openBooklet(page?: number) {
  const path = `/Carols.pdf${page ? `#page=${page}` : ''}`;
  if (Platform.OS === 'web' && typeof window !== 'undefined') window.open(`${base}${path}`, '_blank');
  else Linking.openURL(`${site}${path}`);
}
