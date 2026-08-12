import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppChrome } from '../components/AppChrome';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { ScreenShell } from '../components/ScreenShell';
import { useAuth } from '../auth/AuthContext';
import { useProfile } from '../profile/ProfileContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { AppStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { formStyles, webPointer } from '../theme/forms';

type Props = NativeStackScreenProps<AppStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { signOut } = useAuth();
  const { profile, isLoading } = useProfile();
  const { isWideWeb } = useResponsiveLayout();
  const [loading, setLoading] = useState(false);

  const onLogout = async () => {
    setLoading(true);
    try {
      await signOut();
    } finally {
      setLoading(false);
    }
  };

  const username = profile?.username ?? 'Użytkowniku';

  return (
    <AppChrome navigation={navigation} activeRoute="Home">
      <ScreenShell variant="app" card>
        <Text style={formStyles.brand}>Fridge</Text>
        <Text style={styles.title}>Cześć, {username}!</Text>
        <Text style={styles.subtitle}>
          Zarządzaj wspólnymi lodówkami i swoim profilem — na telefonie i w przeglądarce.
        </Text>

        <Pressable
          style={[formStyles.primaryButton, styles.ctaPrimary, webPointer]}
          onPress={() => navigation.navigate('Households')}
        >
          <Text style={formStyles.primaryButtonText}>Moje lodówki</Text>
        </Pressable>

        <View style={[styles.profilePreview, isWideWeb && styles.profilePreviewWide]}>
          <ProfileAvatar
            username={profile?.username ?? username}
            avatarBase64={profile?.avatarBase64}
            size={isWideWeb ? 88 : 72}
          />
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{profile?.username ?? '—'}</Text>
            <Text style={styles.profileEmail}>
              {profile?.email ?? (isLoading ? 'Ładowanie…' : '—')}
            </Text>
          </View>
        </View>

        {!isWideWeb ? (
          <>
            <Pressable
              style={[formStyles.secondaryButton, styles.cta, webPointer]}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={formStyles.secondaryButtonText}>Mój profil</Text>
            </Pressable>

            <Pressable
              style={[styles.logoutButton, loading && formStyles.buttonDisabled, webPointer]}
              onPress={onLogout}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={formStyles.primaryButtonText}>Wyloguj</Text>
              )}
            </Pressable>
          </>
        ) : (
          <Pressable
            style={[formStyles.secondaryButton, styles.ctaWide, webPointer]}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={formStyles.secondaryButtonText}>Ustawienia profilu →</Text>
          </Pressable>
        )}
      </ScreenShell>
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  subtitle: {
    marginTop: 10,
    marginBottom: 24,
    color: colors.textMuted,
    lineHeight: 22,
    maxWidth: 520,
  },
  profilePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F0F7F4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  profilePreviewWide: {
    padding: 20,
    marginBottom: 28,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  profileEmail: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 14,
  },
  ctaPrimary: {
    marginBottom: 20,
  },
  cta: {
    marginBottom: 10,
  },
  ctaWide: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
  },
  logoutButton: {
    backgroundColor: colors.error,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
});
