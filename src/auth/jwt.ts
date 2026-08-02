type JwtPayload = {
  sub?: string;
  email?: string;
  username?: string;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) {
      return null;
    }

    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return JSON.parse(globalThis.atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

export function getEmailFromJwt(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return null;
  }

  return payload.sub ?? payload.email ?? null;
}

export function getUsernameFromJwt(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload?.username?.trim()) {
    return null;
  }

  return payload.username.trim();
}
