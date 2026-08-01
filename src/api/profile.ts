import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { API_URL } from '../config/env';
import { ApiError } from './client';
import { getToken } from '../auth/tokenStorage';
import { arrayBufferToBase64 } from '../utils/base64';

type ReactNativeFile = {
  uri: string;
  name: string;
  type: string;
};

export async function fetchCurrentUserEmail(): Promise<string> {
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

  try {
    const parsed = JSON.parse(text) as unknown;
    if (typeof parsed === 'string') {
      return parsed;
    }
  } catch {
    // plain string without JSON quotes
  }

  return text.replace(/^"|"$/g, '');
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
): Promise<string> {
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

  const buffer = await response.arrayBuffer();
  return arrayBufferToBase64(buffer);
}
