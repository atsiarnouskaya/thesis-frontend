import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_JOIN_KEY = 'fridge_pending_join_code';

export async function savePendingJoinCode(code: string): Promise<void> {
  await AsyncStorage.setItem(PENDING_JOIN_KEY, code.trim().toUpperCase());
}

export async function consumePendingJoinCode(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(PENDING_JOIN_KEY);
  if (!raw) {
    return null;
  }
  await AsyncStorage.removeItem(PENDING_JOIN_KEY);
  return raw;
}
