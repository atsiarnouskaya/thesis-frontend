import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { AppLocale } from '../i18n/types';
import { colors } from '../theme/colors';
import { webPointer } from '../theme/forms';

type Props = {
  compact?: boolean;
  floating?: boolean;
};

export function LanguageToggle({ compact = false, floating = false }: Props) {
  const { locale, setLocale, t } = useI18n();

  const option = (code: AppLocale, label: string) => {
    const active = locale === code;
    return (
      <Pressable
        key={code}
        onPress={() => setLocale(code)}
        style={[styles.chip, active && styles.chipActive, webPointer]}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, floating && styles.floating]}>
      {!compact ? <Text style={styles.label}>{t('common.language')}</Text> : null}
      <View style={styles.row}>
        {option('pl', t('common.langPl'))}
        {option('ru', t('common.langRu'))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  wrapCompact: {
    gap: 6,
  },
  floating: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    ...(Platform.select({
      web: { boxShadow: '0 8px 24px rgba(8, 28, 21, 0.08)' },
      default: {
        shadowColor: '#081C15',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 3,
      },
    }) as ViewStyle),
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    minWidth: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FAFCFA',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
  },
  chipTextActive: {
    color: '#fff',
  },
});
