import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { deleteAccount, updateEmail, updatePassword, updateUsername } from '../api/account';
import { ApiError } from '../api/client';
import { AppChrome } from '../components/AppChrome';
import { FormTextInput } from '../components/FormTextInput';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { ScreenShell } from '../components/ScreenShell';
import { useAuth } from '../auth/AuthContext';
import { useProfile } from '../profile/ProfileContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useMobilePageInsets } from '../hooks/useMobilePageInsets';
import { clearProfile } from '../profile/profileStorage';
import { AppStackParamList, MobileTabParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { formStyles, webPointer } from '../theme/forms';
import { PASSWORD_HINT, PASSWORD_REGEX } from '../utils/passwordPolicy';

type Props =
  | NativeStackScreenProps<AppStackParamList, 'Profile'>
  | BottomTabScreenProps<MobileTabParamList, 'ProfileTab'>;

const isNativeMobile = Platform.OS === 'ios' || Platform.OS === 'android';

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function ProfileScreen({ navigation }: Props) {
  const appNavigation =
    navigation as unknown as NativeStackNavigationProp<AppStackParamList>;
  const { applySessionToken, signOut } = useAuth();
  const { profile, isLoading, changeProfilePhoto, refreshProfile } = useProfile();
  const { isWideWeb } = useResponsiveLayout();
  const { pagePaddingTop } = useMobilePageInsets();

  const [uploading, setUploading] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const username = profile?.username ?? '-';
  const email = profile?.email ?? '-';

  const clearFeedback = () => {
    setError(null);
    setSuccess(null);
  };

  const onChangePhoto = async (source: 'library' | 'camera') => {
    clearFeedback();
    setUploading(true);
    try {
      const uploaded = await changeProfilePhoto(source);
      if (uploaded) {
        setSuccess('Zdjęcie profilowe zostało zaktualizowane.');
      }
    } catch (err) {
      setError(errorMessage(err, 'Nie udało się zmienić zdjęcia'));
    } finally {
      setUploading(false);
    }
  };

  const onSaveUsername = async () => {
    clearFeedback();
    const next = usernameDraft.trim();
    if (!next) {
      setError('Podaj nazwę użytkownika');
      return;
    }

    setBusyAction('username');
    try {
      const token = await updateUsername(next);
      await applySessionToken(token);
      await refreshProfile();
      setUsernameDraft('');
      setSuccess('Nazwa użytkownika została zmieniona.');
    } catch (err) {
      setError(errorMessage(err, 'Nie udało się zmienić nazwy użytkownika'));
    } finally {
      setBusyAction(null);
    }
  };

  const onSaveEmail = async () => {
    clearFeedback();
    const nextEmail = emailDraft.trim();
    if (!nextEmail || !emailPassword) {
      setError('Podaj nowy email i obecne hasło');
      return;
    }

    const previousEmail = profile?.email;
    setBusyAction('email');
    try {
      const token = await updateEmail(nextEmail, emailPassword);
      if (previousEmail) {
        await clearProfile(previousEmail);
      }
      await applySessionToken(token);
      await refreshProfile();
      setEmailDraft('');
      setEmailPassword('');
      setSuccess('Adres email został zmieniony.');
    } catch (err) {
      setError(errorMessage(err, 'Nie udało się zmienić emaila'));
    } finally {
      setBusyAction(null);
    }
  };

  const onSavePassword = async () => {
    clearFeedback();
    if (!currentPassword || !newPassword) {
      setError('Podaj obecne i nowe hasło');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Nowe hasła nie są identyczne');
      return;
    }
    if (!PASSWORD_REGEX.test(newPassword)) {
      setError(PASSWORD_HINT);
      return;
    }

    setBusyAction('password');
    try {
      const token = await updatePassword(currentPassword, newPassword);
      await applySessionToken(token);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Hasło zostało zmienione.');
    } catch (err) {
      setError(errorMessage(err, 'Nie udało się zmienić hasła'));
    } finally {
      setBusyAction(null);
    }
  };

  const performDeleteAccount = async () => {
    if (!deletePassword) {
      setError('Podaj hasło, aby usunąć konto');
      return;
    }

    const emailToClear = profile?.email;
    setBusyAction('delete');
    try {
      await deleteAccount(deletePassword);
      if (emailToClear) {
        await clearProfile(emailToClear);
      }
      await signOut();
    } catch (err) {
      setError(errorMessage(err, 'Nie udało się usunąć konta'));
      setBusyAction(null);
    }
  };

  const onDeleteAccount = () => {
    clearFeedback();
    const message = 'Tej operacji nie można cofnąć. Wszystkie dane konta zostaną usunięte.';

    if (Platform.OS === 'web') {
      if (globalThis.confirm(message)) {
        void performDeleteAccount();
      }
      return;
    }

    Alert.alert('Usuń konto', message, [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: () => void performDeleteAccount() },
    ]);
  };

  if (isLoading && !profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const page = (
    <View style={[styles.page, isWideWeb && styles.pageWide, { paddingTop: isNativeMobile ? pagePaddingTop : 0 }]}>
      <Text style={styles.pageTitle}>Mój profil</Text>

      <View style={[styles.hero, isWideWeb && styles.heroWide]}>
        <ProfileAvatar
          username={username}
          avatarBase64={profile?.avatarBase64}
          size={isWideWeb ? 120 : 96}
          onPress={uploading ? undefined : () => void onChangePhoto('library')}
        />
        <Text style={styles.heroName}>{username}</Text>
        <Text style={styles.heroEmail}>{email}</Text>

        <View style={styles.photoActions}>
          <Pressable
            style={[
              formStyles.secondaryButton,
              styles.photoActionButton,
              uploading && formStyles.buttonDisabled,
              webPointer,
            ]}
            onPress={() => void onChangePhoto('library')}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={formStyles.secondaryButtonText}>Galeria</Text>
            )}
          </Pressable>
          {Platform.OS !== 'web' ? (
            <Pressable
              style={[
                formStyles.secondaryButton,
                styles.photoActionButton,
                uploading && formStyles.buttonDisabled,
                webPointer,
              ]}
              onPress={() => void onChangePhoto('camera')}
              disabled={uploading}
            >
              <Text style={formStyles.secondaryButtonText}>Aparat</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.photoHint}>Po wyborze zdjęcia przytnij je do kwadratu.</Text>
      </View>

      <View style={[styles.sections, isWideWeb && styles.sectionsWide]}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Nazwa użytkownika</Text>
          <FormTextInput
            placeholder="Nowa nazwa"
            placeholderTextColor={colors.textMuted}
            value={usernameDraft}
            onChangeText={setUsernameDraft}
            autoCapitalize="none"
            editable={busyAction === null}
          />
          <Pressable
            style={[
              formStyles.primaryButton,
              busyAction === 'username' && formStyles.buttonDisabled,
              webPointer,
            ]}
            onPress={onSaveUsername}
            disabled={busyAction !== null}
          >
            {busyAction === 'username' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={formStyles.primaryButtonText}>Zapisz nazwę</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Email</Text>
          <FormTextInput
            placeholder="Nowy email"
            placeholderTextColor={colors.textMuted}
            value={emailDraft}
            onChangeText={setEmailDraft}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={busyAction === null}
          />
          <FormTextInput
            placeholder="Obecne hasło"
            placeholderTextColor={colors.textMuted}
            value={emailPassword}
            onChangeText={setEmailPassword}
            secureTextEntry
            editable={busyAction === null}
          />
          <Pressable
            style={[
              formStyles.primaryButton,
              busyAction === 'email' && formStyles.buttonDisabled,
              webPointer,
            ]}
            onPress={onSaveEmail}
            disabled={busyAction !== null}
          >
            {busyAction === 'email' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={formStyles.primaryButtonText}>Zapisz email</Text>
            )}
          </Pressable>
        </View>

        <View style={[styles.sectionCard, isWideWeb && styles.sectionCardHalf]}>
          <Text style={styles.sectionTitle}>Hasło</Text>
          <FormTextInput
            placeholder="Obecne hasło"
            placeholderTextColor={colors.textMuted}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            editable={busyAction === null}
          />
          <FormTextInput
            placeholder="Nowe hasło"
            placeholderTextColor={colors.textMuted}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            editable={busyAction === null}
          />
          <FormTextInput
            placeholder="Powtórz nowe hasło"
            placeholderTextColor={colors.textMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={busyAction === null}
          />
          <Text style={styles.hint}>{PASSWORD_HINT}</Text>
          <Pressable
            style={[
              formStyles.primaryButton,
              busyAction === 'password' && formStyles.buttonDisabled,
              webPointer,
            ]}
            onPress={onSavePassword}
            disabled={busyAction !== null}
          >
            {busyAction === 'password' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={formStyles.primaryButtonText}>Zapisz hasło</Text>
            )}
          </Pressable>
        </View>

        <View style={[styles.sectionCard, styles.dangerSection, isWideWeb && styles.sectionCardHalf]}>
          <Text style={styles.sectionTitle}>Usuń konto</Text>
          <Text style={styles.hint}>Operacja jest nieodwracalna. Wymagane jest obecne hasło.</Text>
          <FormTextInput
            placeholder="Hasło do potwierdzenia"
            placeholderTextColor={colors.textMuted}
            value={deletePassword}
            onChangeText={setDeletePassword}
            secureTextEntry
            editable={busyAction === null}
          />
          <Pressable
            style={[
              styles.dangerButton,
              busyAction === 'delete' && formStyles.buttonDisabled,
              webPointer,
            ]}
            onPress={onDeleteAccount}
            disabled={busyAction !== null}
          >
            {busyAction === 'delete' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.dangerButtonText}>Usuń konto</Text>
            )}
          </Pressable>
        </View>
      </View>

      {success ? <Text style={formStyles.success}>{success}</Text> : null}
      {error ? <Text style={formStyles.error}>{error}</Text> : null}

      {!isWideWeb && Platform.OS === 'web' ? (
        <Pressable style={[styles.linkButton, webPointer]} onPress={() => navigation.goBack()}>
          <Text style={formStyles.link}>Wróć</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <AppChrome navigation={appNavigation} activeRoute="Profile" scroll>
      {isNativeMobile ? (
        page
      ) : (
        <ScreenShell variant="profile" card={false} alignTop contentStyle={styles.shellContent}>
          {page}
        </ScreenShell>
      )}
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  shellContent: {
    width: '100%',
    maxWidth: 960,
  },
  page: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  pageWide: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 20,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heroWide: {
    marginBottom: 28,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  heroEmail: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 4,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    maxWidth: 360,
    marginTop: 8,
  },
  photoActionButton: {
    flex: 1,
    minWidth: 0,
  },
  photoHint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 300,
  },
  sections: {
    gap: 12,
  },
  sectionsWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'flex-start',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 0,
  },
  sectionCardHalf: {
    flex: 1,
    minWidth: 280,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 10,
    lineHeight: 16,
  },
  dangerSection: {
    backgroundColor: colors.dangerBg,
    borderColor: '#F5D0D0',
  },
  dangerButton: {
    backgroundColor: colors.error,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
});
