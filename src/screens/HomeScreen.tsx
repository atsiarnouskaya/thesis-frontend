import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { useAuth } from '../auth/AuthContext';
import { useProfile } from '../profile/ProfileContext';
import { AppStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<AppStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { signOut } = useAuth();
  const { profile, isLoading } = useProfile();
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
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.brand}>Fridge</Text>
        <Text style={styles.title}>Cześć, {username}!</Text>
        <Text style={styles.subtitle}>Zarządzaj lodówką i swoim profilem w jednym miejscu.</Text>

        <View style={styles.profilePreview}>
          <ProfileAvatar
            username={profile?.username ?? username}
            avatarBase64={profile?.avatarBase64}
            size={72}
          />
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{profile?.username ?? '—'}</Text>
            <Text style={styles.profileEmail}>{profile?.email ?? (isLoading ? 'Ładowanie…' : '—')}</Text>
          </View>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.primaryButtonText}>Mój profil</Text>
        </Pressable>

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={onLogout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Wyloguj</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brand: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    color: colors.textMuted,
    lineHeight: 20,
  },
  profilePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F0F7F4',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  profileEmail: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.error,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
