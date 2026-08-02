import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { API_URL } from '../config/env';
import { ApiError } from './client';
import { getToken } from '../auth/tokenStorage';
import { UserProfile } from '../profile/profileTypes';

type ReactNativeFile = {
  uri: string;
  name: string;
  type: string;
};

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

function bytesToBase64(bytes: number[]): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return globalThis.btoa(binary);
}

/** Jackson serializes `byte[]` as Base64 string; some clients may see a numeric array. */
export function normalizeProfilePicture(raw: unknown): string | null {
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
    throw new ApiError('Brak tokenu', 401);
  }

  const response = await fetch(`${API_URL}/me`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new ApiError(text || `Request failed (${response.status})`, response.status);
  }

  let parsed: MeResponseRaw;
  try {
    parsed = JSON.parse(text) as MeResponseRaw;
  } catch {
    throw new ApiError('Nieprawidłowa odpowiedź /me (JSON)', 502);
  }

  return mapMeResponseToUserProfile(parsed);
}

async function resolveUploadUri(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    return uri;
  }

  if (uri.startsWith('content://') && FileSystem.cacheDirectory) {
    const destination = `${FileSystem.cacheDirectory}profile-upload-${Date.now()}.jpg`;
    await FileSystem.copyAsync({ from: uri, to: destination });
    return destination;
  }

  return uri;
}

function normalizeFileName(fileName: string): string {
  if (/\.(jpe?g|png|webp)$/i.test(fileName)) {
    return fileName;
  }
  return `${fileName}.jpg`;
}

async function buildUploadFormData(
  uri: string,
  fileName: string,
  mimeType: string,
): Promise<FormData> {
  const formData = new FormData();
  const safeName = normalizeFileName(fileName);
  const resolvedUri = await resolveUploadUri(uri);

  if (Platform.OS === 'web') {
    const fileResponse = await fetch(resolvedUri);
    const blob = await fileResponse.blob();
    formData.append('file', blob, safeName);
    return formData;
  }

  const filePart: ReactNativeFile = {
    uri: resolvedUri,
    name: safeName,
    type: mimeType || 'image/jpeg',
  };

  formData.append('file', filePart as unknown as Blob);
  return formData;
}

export async function uploadProfilePicture(
  uri: string,
  fileName: string,
  mimeType: string,
): Promise<void> {
  const token = await getToken();
  if (!token) {
    throw new ApiError('Brak tokenu', 401);
  }

  const formData = await buildUploadFormData(uri, fileName, mimeType);

  const response = await fetch(`${API_URL}/uploadProfilePicture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: '*/*',
    },
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(message || `Upload failed (${response.status})`, response.status);
  }
}
