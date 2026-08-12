import { Platform } from 'react-native';

const JOIN_PATH = '/join';

function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase();
}

/** Public URL opened when someone scans the household QR code (web app join flow). */
export function buildHouseholdJoinUrl(inviteCode: string): string {
  const code = encodeURIComponent(normalizeInviteCode(inviteCode));
  const query = `inviteCode=${code}`;

  const configuredBase = process.env.EXPO_PUBLIC_APP_LINK_URL?.replace(/\/$/, '');
  if (configuredBase) {
    return `${configuredBase}${JOIN_PATH}?${query}`;
  }

  if (Platform.OS === 'web' && typeof globalThis.location !== 'undefined') {
    return `${globalThis.location.origin}${JOIN_PATH}?${query}`;
  }

  return `fridge://${JOIN_PATH.replace(/^\//, '')}?${query}`;
}

export function parseInviteCodeFromUrl(url: string): string | null {
  if (!url.trim()) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const fromQuery =
      parsed.searchParams.get('inviteCode') ?? parsed.searchParams.get('code');
    if (fromQuery?.trim()) {
      return normalizeInviteCode(fromQuery);
    }

    const pathMatch = parsed.pathname.match(/\/join\/?([^/?#]+)?/i);
    const fromPath = pathMatch?.[1];
    if (fromPath?.trim()) {
      return normalizeInviteCode(decodeURIComponent(fromPath));
    }
  } catch {
    const queryMatch = url.match(/[?&](?:inviteCode|code)=([^&]+)/i);
    if (queryMatch?.[1]) {
      return normalizeInviteCode(decodeURIComponent(queryMatch[1]));
    }
  }

  return null;
}
