export function bytesToBase64(bytes: number[]): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return globalThis.btoa(binary);
}

/** Jackson serializes `byte[]` as Base64 string; some clients may see a numeric array. */
export function normalizeBinaryBase64(raw: unknown): string | null {
  if (raw == null) {
    return null;
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (Array.isArray(raw) && raw.length > 0 && raw.every((value) => typeof value === 'number')) {
    return bytesToBase64(raw);
  }

  return null;
}

export function parseIsoDateTime(raw: unknown): string | null {
  return parseTimestamp(raw);
}

/** Jackson może zwracać Instant/LocalDateTime jako ISO string, tablicę lub epoch. */
export function parseTimestamp(raw: unknown): string | null {
  if (raw == null) {
    return null;
  }

  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const ms = raw < 1e12 ? raw * 1000 : raw;
    return new Date(ms).toISOString();
  }

  if (Array.isArray(raw) && raw.length >= 2) {
    if (
      raw.length === 2 &&
      typeof raw[0] === 'number' &&
      typeof raw[1] === 'number' &&
      raw[0] > 1_000_000_000
    ) {
      const ms = raw[0] * 1000 + Math.floor(raw[1] / 1e6);
      return new Date(ms).toISOString();
    }

    if (raw.length >= 3 && typeof raw[0] === 'number' && typeof raw[1] === 'number') {
      const [year, month, day, hour = 0, minute = 0, second = 0, nano = 0] = raw;
      if (typeof day === 'number') {
        const fractionalMs =
          typeof nano === 'number' && nano > 0 ? Math.floor(nano / 1e6) : 0;
        return new Date(
          Date.UTC(year, month - 1, day, hour, minute, second, fractionalMs),
        ).toISOString();
      }
    }
  }

  if (typeof raw === 'object') {
    const value = raw as { epochSecond?: unknown; nano?: unknown };
    if (typeof value.epochSecond === 'number') {
      const nano = typeof value.nano === 'number' ? value.nano : 0;
      return new Date(value.epochSecond * 1000 + Math.floor(nano / 1e6)).toISOString();
    }
  }

  return null;
}
