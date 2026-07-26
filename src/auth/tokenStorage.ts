import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'fridge_jwt';

function isWeb(): boolean {
  return Platform.OS === 'web';
}

function getWebStorage(): Storage | null {
  if (typeof globalThis.localStorage === 'undefined') {
    return null;
  }
  return globalThis.localStorage;
}

export async function getToken(): Promise<string | null> {
  if (isWeb()) {
    return getWebStorage()?.getItem(TOKEN_KEY) ?? null;
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function saveToken(token: string): Promise<void> {
  if (isWeb()) {
    getWebStorage()?.setItem(TOKEN_KEY, token);
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  if (isWeb()) {
    getWebStorage()?.removeItem(TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
