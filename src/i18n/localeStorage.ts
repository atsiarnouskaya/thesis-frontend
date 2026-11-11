import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppLocale } from './types';

const LOCALE_KEY = 'app_locale';

export async function loadStoredLocale(): Promise<AppLocale | null> {
  const raw = await AsyncStorage.getItem(LOCALE_KEY);
  if (raw === 'pl' || raw === 'ru') {
    return raw;
  }
  return null;
}

export async function saveStoredLocale(locale: AppLocale): Promise<void> {
  await AsyncStorage.setItem(LOCALE_KEY, locale);
}
