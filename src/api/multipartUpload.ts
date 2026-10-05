import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { API_URL } from '../config/env';
import { ApiError, throwApiErrorFromResponse } from './client';
import { getToken } from '../auth/tokenStorage';
import { ensureUploadFileUri } from '../utils/ensureLocalFileUri';

type ReactNativeFile = {
  uri: string;
  name: string;
  type: string;
};

function normalizeFileName(fileName: string): string {
  if (/\.(jpe?g|png|webp)$/i.test(fileName)) {
    return fileName;
  }
  return `${fileName}.jpg`;
}

export type MultipartFilePart = {
  uri: string;
  fileName: string;
  mimeType: string;
  fieldName?: string;
};

export async function buildMultipartFormData(
  uri: string,
  fileName: string,
  mimeType: string,
  extraFields?: Record<string, string>,
  fileFieldName = 'file',
): Promise<FormData> {
  return buildMultipartFormDataWithFields(extraFields ?? {}, {
    uri,
    fileName,
    mimeType,
    fieldName: fileFieldName,
  });
}

export async function buildMultipartFormDataWithFields(
  fields: Record<string, string | null | undefined>,
  file?: MultipartFilePart,
): Promise<FormData> {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (value != null) {
      formData.append(key, value);
    }
  }

  if (!file) {
    return formData;
  }

  const safeName = normalizeFileName(file.fileName);
  const resolvedUri = await ensureUploadFileUri(file.uri);
  const fieldName = file.fieldName ?? 'file';

  if (Platform.OS === 'web') {
    const fileResponse = await fetch(resolvedUri);
    const blob = await fileResponse.blob();
    formData.append(fieldName, blob, safeName);
    return formData;
  }

  const filePart: ReactNativeFile = {
    uri: resolvedUri,
    name: safeName,
    type: file.mimeType || 'image/jpeg',
  };

  formData.append(fieldName, filePart as unknown as Blob);
  return formData;
}

function buildNativeUploadParameters(
  fields: Record<string, string | null | undefined>,
): Record<string, string> {
  const parameters: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value != null) {
      parameters[key] = value;
    }
  }
  return parameters;
}

async function uploadWithNativeFileSystem(
  path: string,
  method: 'POST' | 'PUT',
  token: string,
  fields: Record<string, string | null | undefined>,
  file: MultipartFilePart,
): Promise<string> {
  const resolvedUri = await ensureUploadFileUri(file.uri);
  const parameters = buildNativeUploadParameters(fields);

  const result = await FileSystem.uploadAsync(`${API_URL}${path}`, resolvedUri, {
    httpMethod: method,
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: file.fieldName ?? 'file',
    mimeType: file.mimeType || 'image/jpeg',
    parameters: Object.keys(parameters).length > 0 ? parameters : undefined,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (result.status < 200 || result.status >= 300) {
    throwApiErrorFromResponse(result.status, result.body || `Upload failed (${result.status})`, {
      sessionProtected: true,
    });
  }

  return result.body;
}

export async function uploadMultipart(
  path: string,
  uri: string,
  fileName: string,
  mimeType: string,
  extraFields?: Record<string, string>,
): Promise<void> {
  const token = await getToken();
  if (!token) {
    throwApiErrorFromResponse(401, 'Brak tokenu', { sessionProtected: true });
  }

  if (Platform.OS !== 'web') {
    await uploadWithNativeFileSystem(
      path,
      'POST',
      token,
      extraFields ?? {},
      { uri, fileName, mimeType },
    );
    return;
  }

  const formData = await buildMultipartFormData(uri, fileName, mimeType, extraFields);

  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throwApiErrorFromResponse(response.status, message || `Upload failed (${response.status})`, {
      sessionProtected: true,
    });
  }
}

export async function uploadMultipartJson<T>(
  path: string,
  uri: string,
  fileName: string,
  mimeType: string,
  extraFields?: Record<string, string>,
): Promise<T> {
  return submitMultipartJson<T>(
    path,
    'POST',
    extraFields ?? {},
    { uri, fileName, mimeType },
  );
}

export async function submitMultipartJson<T>(
  path: string,
  method: 'POST' | 'PUT',
  fields: Record<string, string | null | undefined>,
  file?: MultipartFilePart,
): Promise<T> {
  const token = await getToken();
  if (!token) {
    throwApiErrorFromResponse(401, 'Brak tokenu', { sessionProtected: true });
  }

  if (Platform.OS !== 'web' && file) {
    const body = await uploadWithNativeFileSystem(path, method, token, fields, file);
    try {
      return JSON.parse(body) as T;
    } catch {
      throw new ApiError('Nieprawidłowa odpowiedź serwera (JSON)', 502);
    }
  }

  const formData = await buildMultipartFormDataWithFields(fields, file);

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: formData,
  });

  const text = await response.text();
  if (!response.ok) {
    throwApiErrorFromResponse(response.status, text || `Upload failed (${response.status})`, {
      sessionProtected: true,
    });
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError('Nieprawidłowa odpowiedź serwera (JSON)', 502);
  }
}
