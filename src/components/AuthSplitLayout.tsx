import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { colors } from '../theme/colors';
import { cardElevation } from '../theme/forms';
import { ScreenShell } from './ScreenShell';

type Props = {
  children: React.ReactNode;
};

export function AuthSplitLayout({ children }: Props) {
  const { isAuthSplit } = useResponsiveLayout();

  if (!isAuthSplit) {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenShell variant="auth" scroll={Platform.OS === 'web'}>
          {children}
        </ScreenShell>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.splitRoot}>
      <View style={styles.hero}>
        <Text style={styles.heroBrand}>Fridge</Text>
        <Text style={styles.heroTitle}>Twoja lodówka pod kontrolą</Text>
        <Text style={styles.heroText}>
          Zarządzaj zapasami, profilem i gospodarstwem domowym - na telefonie i w przeglądarce.
        </Text>
        <View style={styles.heroPillRow}>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>Profil i avatar</Text>
          </View>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>Bezpieczne logowanie</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.formColumn}
        keyboardShouldPersistTaps="handled"
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.formCard, cardElevation]}>{children}</View>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  splitRoot: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
    minHeight: '100%' as unknown as number,
  },
  hero: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingHorizontal: 56,
    paddingVertical: 64,
    justifyContent: 'center',
    maxWidth: '46%',
  },
  heroBrand: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#D8F3DC',
    marginBottom: 12,
    lineHeight: 34,
  },
  heroText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#B7E4C7',
    maxWidth: 420,
  },
  heroPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 28,
  },
  heroPill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroPillText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  formColumn: {
    flexGrow: 1,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  formCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
