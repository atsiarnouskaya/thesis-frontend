import { API_URL } from '../config/env';
import { ApiError, throwApiErrorFromResponse } from './client';
import { getToken } from '../auth/tokenStorage';
import { uploadMultipart } from './multipartUpload';
import { UserProfile } from '../profile/profileTypes';
import { normalizeBinaryBase64 } from '../utils/binaryPayload';

export type CurrentUserProfile = {
  username: string;
  email: string;
  profilePicture: string | null;
};

type MeResponseRaw = {
  username?: unknown;
  email?: unknown;
  profilePicture?: unknown;
};

export function normalizeProfilePicture(raw: unknown): string | null {
  return normalizeBinaryBase64(raw);
}

export function mapMeResponseToUserProfile(raw: MeResponseRaw): CurrentUserProfile {
  if (typeof raw.email !== 'string' || !raw.email.trim()) {
    throw new ApiError('Nieprawidłowa odpowiedź /me (brak email)', 502);
  }

  const email = raw.email.trim().toLowerCase();
  const username =
    typeof raw.username === 'string' && raw.username.trim()
      ? raw.username.trim()
      : email.split('@')[0] ?? email;

  return {
    email,
    username,
    profilePicture: normalizeProfilePicture(raw.profilePicture),
  };
}

export function toStoredUserProfile(me: CurrentUserProfile, cachedAvatar?: string): UserProfile {
  return {
    email: me.email,
    username: me.username,
    avatarBase64: me.profilePicture ?? cachedAvatar,
  };
}

export async function fetchCurrentUserProfile(): Promise<CurrentUserProfile> {
  const token = await getToken();
  if (!token) {
    throwApiErrorFromResponse(401, 'Brak tokenu', { sessionProtected: true });
  }

  const response = await fetch(`${API_URL}/me`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throwApiErrorFromResponse(response.status, text, { sessionProtected: true });
  }

  let parsed: MeResponseRaw;
  try {
    parsed = JSON.parse(text) as MeResponseRaw;
  } catch {
    throw new ApiError('Nieprawidłowa odpowiedź /me (JSON)', 502);
  }

  return mapMeResponseToUserProfile(parsed);
}

export async function uploadProfilePicture(
  uri: string,
  fileName: string,
  mimeType: string,
): Promise<void> {
  await uploadMultipart('/uploadProfilePicture', uri, fileName, mimeType);
}
