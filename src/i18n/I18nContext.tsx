import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import { loadStoredLocale, saveStoredLocale } from './localeStorage';
import { intlLocaleForApp, resolveTranslation } from './resolveTranslation';
import { pl } from './translations/pl';
import { ru } from './translations/ru';
import { AppLocale, TranslationValues } from './types';

type TranslateFn = (key: string, values?: TranslationValues) => string;

type I18nContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: TranslateFn;
  intlLocale: string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const trees: Record<AppLocale, typeof pl> = { pl, ru };

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>('pl');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const stored = await loadStoredLocale();
      if (stored) {
        setLocaleState(stored);
      }
      setIsReady(true);
    })();
  }, []);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    void saveStoredLocale(next);
  }, []);

  const t = useCallback<TranslateFn>(
    (key, values) => resolveTranslation(trees[locale], key, values),
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      intlLocale: intlLocaleForApp(locale),
    }),
    [locale, setLocale, t],
  );

  if (!isReady) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
