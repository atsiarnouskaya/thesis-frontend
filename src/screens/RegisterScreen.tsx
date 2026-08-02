import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthSplitLayout } from '../components/AuthSplitLayout';
import { FormTextInput } from '../components/FormTextInput';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { useAuth } from '../auth/AuthContext';
import { useProfile } from '../profile/ProfileContext';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { formStyles, webPointer } from '../theme/forms';
import { pickAndCropProfileImage } from '../utils/pickProfileImage';
import { readUriAsBase64 } from '../utils/readUriAsBase64';
import { PASSWORD_HINT, PASSWORD_REGEX } from '../utils/passwordPolicy';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { signUp, signIn } = useAuth();
  const { uploadPhotoFromUri, refreshProfile } = useProfile();
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
      setError(PASSWORD_HINT);
      return;
    }

    setLoading(true);
    try {
      const trimmedEmail = email.trim();
      const trimmedUsername = username.trim();

      await signUp({ username: trimmedUsername, email: trimmedEmail, password });
      await signIn(trimmedEmail, password);
      await refreshProfile();

      if (photoUri && photoFileName) {
        await uploadPhotoFromUri(photoUri, photoFileName, photoMimeType);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rejestracja nie powiodła się');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout>
      <Text style={formStyles.brand}>Fridge</Text>
      <Text style={formStyles.title}>Załóż konto</Text>
      <Text style={formStyles.subtitle}>Opcjonalnie dodaj zdjęcie — przytniesz je do kwadratu.</Text>

      <View style={styles.avatarRow}>
        <ProfileAvatar
          username={username || 'U'}
          avatarBase64={photoPreviewBase64}
          size={96}
          editable
          onPress={loading ? undefined : onPickPhoto}
        />
        <Pressable onPress={onPickPhoto} disabled={loading} style={webPointer}>
          <Text style={styles.photoLink}>{photoUri ? 'Przytnij ponownie' : 'Wybierz i przytnij'}</Text>
        </Pressable>
      </View>

      <Text style={formStyles.label}>Nazwa użytkownika</Text>
      <FormTextInput
        autoCapitalize="none"
        placeholder="np. ania"
        placeholderTextColor={colors.textMuted}
        value={username}
        onChangeText={setUsername}
        editable={!loading}
      />

      <Text style={formStyles.label}>Email</Text>
      <FormTextInput
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="ty@email.com"
        placeholderTextColor={colors.textMuted}
        value={email}
        onChangeText={setEmail}
        editable={!loading}
      />

      <Text style={formStyles.label}>Hasło</Text>
      <FormTextInput
        secureTextEntry
        placeholder="SilneHaslo1!"
        placeholderTextColor={colors.textMuted}
        value={password}
        onChangeText={setPassword}
        editable={!loading}
      />

      {error ? <Text style={formStyles.error}>{error}</Text> : null}

      <Pressable
        style={[formStyles.primaryButton, loading && formStyles.buttonDisabled, webPointer]}
        onPress={onSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={formStyles.primaryButtonText}>Zarejestruj</Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('Login')}
        style={[styles.linkWrap, webPointer]}
      >
        <Text style={formStyles.link}>Masz już konto? Zaloguj się</Text>
      </Pressable>
    </AuthSplitLayout>
  );
}

const styles = StyleSheet.create({
  avatarRow: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  photoLink: {
    color: colors.primaryMuted,
    fontWeight: '600',
  },
  linkWrap: {
    marginTop: 18,
    alignItems: 'center',
  },
});
