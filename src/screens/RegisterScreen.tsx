import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { useAuth } from '../auth/AuthContext';
import { useProfile } from '../profile/ProfileContext';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { pickAndCropProfileImage } from '../utils/pickProfileImage';
import * as FileSystem from 'expo-file-system/legacy';
import { saveProfile } from '../profile/profileStorage';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const PASSWORD_REGEX = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;

async function readUriAsBase64(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

export function RegisterScreen({ navigation }: Props) {
  const { signUp, signIn } = useAuth();
  const { upsertUsername, uploadPhotoFromUri, refreshProfile } = useProfile();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoPreviewBase64, setPhotoPreviewBase64] = useState<string | undefined>();
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState('image/jpeg');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onPickPhoto = async () => {
    setError(null);
    try {
      const picked = await pickAndCropProfileImage();
      if (!picked) {
        return;
      }

      setPhotoUri(picked.uri);
      setPhotoFileName(picked.fileName);
      setPhotoMimeType(picked.mimeType);
      setPhotoPreviewBase64(await readUriAsBase64(picked.uri));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się wybrać zdjęcia');
    }
  };

  const onSubmit = async () => {
    setError(null);

    if (!username.trim() || !email.trim() || !password) {
      setError('Uzupełnij wszystkie pola');
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setError(
        'Hasło: min. 8 znaków, wielka i mała litera, cyfra oraz znak specjalny (#?!@$%^&*-)',
      );
      return;
    }

    setLoading(true);
    try {
      const trimmedEmail = email.trim();
      const trimmedUsername = username.trim();

      await signUp({ username: trimmedUsername, email: trimmedEmail, password });
      await signIn(trimmedEmail, password);
      await upsertUsername(trimmedUsername, trimmedEmail);

      if (photoUri && photoFileName) {
        try {
          await uploadPhotoFromUri(photoUri, photoFileName, photoMimeType);
        } catch {
          if (photoPreviewBase64) {
            await saveProfile({
              email: trimmedEmail.toLowerCase(),
              username: trimmedUsername,
              avatarBase64: photoPreviewBase64,
            });
            await refreshProfile();
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rejestracja nie powiodła się');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.brand}>Fridge</Text>
          <Text style={styles.title}>Załóż konto</Text>
          <Text style={styles.subtitle}>Opcjonalnie dodaj zdjęcie — przytniesz je do kwadratu</Text>

          <View style={styles.avatarRow}>
            <ProfileAvatar
              username={username || 'U'}
              avatarBase64={photoPreviewBase64}
              size={96}
              editable
              onPress={loading ? undefined : onPickPhoto}
            />
            <Pressable onPress={onPickPhoto} disabled={loading}>
              <Text style={styles.photoLink}>{photoUri ? 'Przytnij ponownie' : 'Wybierz i przytnij'}</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Nazwa użytkownika</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            placeholder="np. ania"
            placeholderTextColor={colors.textMuted}
            value={username}
            onChangeText={setUsername}
            editable={!loading}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="ty@email.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          <Text style={styles.label}>Hasło</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="SilneHaslo1!"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Zarejestruj</Text>
            )}
          </Pressable>

          <Pressable onPress={() => navigation.navigate('Login')} style={styles.linkWrap}>
            <Text style={styles.link}>Masz już konto? Zaloguj się</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
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
    marginTop: 4,
    marginBottom: 16,
    color: colors.textMuted,
  },
  avatarRow: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  photoLink: {
    color: colors.primaryMuted,
    fontWeight: '600',
  },
  label: {
    marginBottom: 6,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    color: colors.text,
    backgroundColor: '#FAFCFA',
  },
  error: {
    color: colors.error,
    marginBottom: 12,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  linkWrap: {
    marginTop: 18,
    alignItems: 'center',
  },
  link: {
    color: colors.primaryMuted,
    fontWeight: '600',
  },
});
