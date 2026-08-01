import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { useProfile } from '../profile/ProfileContext';
import { AppStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<AppStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { profile, isLoading, changeProfilePhoto } = useProfile();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChangePhoto = async () => {
    setError(null);
    setUploading(true);
    try {
      await changeProfilePhoto();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zmienić zdjęcia');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading && !profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const username = profile?.username ?? '—';
  const email = profile?.email ?? '—';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Mój profil</Text>

        <View style={styles.avatarSection}>
          <ProfileAvatar
            username={username}
            avatarBase64={profile?.avatarBase64}
            size={120}
            editable
            onPress={uploading ? undefined : onChangePhoto}
          />
          <Text style={styles.cropHint}>
            Wybierz zdjęcie i przytnij kwadrat — ten fragment trafi na avatar i do Minio (także w przeglądarce).
          </Text>
          <Pressable
            style={[styles.secondaryButton, uploading && styles.buttonDisabled]}
            onPress={onChangePhoto}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.secondaryButtonText}>Wybierz i przytnij zdjęcie</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Nazwa użytkownika</Text>
          <Text style={styles.value}>{username}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{email}</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.linkButton} onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Wróć</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  cropHint: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 220,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  error: {
    color: colors.error,
    marginTop: 8,
  },
  linkButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  linkText: {
    color: colors.primaryMuted,
    fontWeight: '600',
  },
});
