import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

export async function copyUriToCacheIfNeeded(uri: string, prefix: string): Promise<string> {
  if (Platform.OS === 'web') {
    return uri;
  }

  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) {
    return uri;
  }

  const needsCopy =
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('assets-library://');

  if (!needsCopy) {
    return uri;
  }

  const destination = `${cacheDir}${prefix}-${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: uri, to: destination });
  return destination;
}

export async function ensureUploadFileUri(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    return uri;
  }

  const localUri = await copyUriToCacheIfNeeded(uri, 'upload');
  const withScheme = localUri.startsWith('file://') ? localUri : `file://${localUri}`;
  const info = await FileSystem.getInfoAsync(withScheme);

  if (!info.exists) {
    throw new Error('Plik do wysłania nie istnieje lub jest niedostępny.');
  }

  return withScheme;
}
