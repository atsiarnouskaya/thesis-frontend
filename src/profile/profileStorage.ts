import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from './profileTypes';

function storageKey(email: string): string {
  return `profile:${email.trim().toLowerCase()}`;
}

export async function loadProfile(email: string): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(storageKey(email));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(storageKey(profile.email), JSON.stringify(profile));
}

export async function clearProfile(email: string): Promise<void> {
  await AsyncStorage.removeItem(storageKey(email));
}
