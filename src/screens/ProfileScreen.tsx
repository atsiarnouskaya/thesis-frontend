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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { deleteAccount, updateEmail, updatePassword, updateUsername } from '../api/account';
import { ApiError } from '../api/client';
import { AppChrome } from '../components/AppChrome';
import { FormTextInput } from '../components/FormTextInput';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { ScreenShell } from '../components/ScreenShell';
import { useAuth } from '../auth/AuthContext';
import { useProfile } from '../profile/ProfileContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { clearProfile } from '../profile/profileStorage';
import { AppStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { cardElevation, formStyles, webPointer } from '../theme/forms';
import { PASSWORD_HINT, PASSWORD_REGEX } from '../utils/passwordPolicy';

type Props = NativeStackScreenProps<AppStackParamList, 'Profile'>;

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function ProfileScreen({ navigation }: Props) {
  const { applySessionToken, signOut } = useAuth();
  const { profile, isLoading, changeProfilePhoto, refreshProfile } = useProfile();
  const { isWideWeb } = useResponsiveLayout();

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

  const username = profile?.username ?? '—';
  const email = profile?.email ?? '—';

  const clearFeedback = () => {
    setError(null);
    setSuccess(null);
  };

  const onChangePhoto = async () => {
    clearFeedback();
    setUploading(true);
    try {
      await changeProfilePhoto();
      setSuccess('Zdjęcie profilowe zostało zaktualizowane.');
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

  return (
    <AppChrome navigation={navigation} activeRoute="Profile" scroll>
      <ScreenShell variant="profile" card={false} alignTop contentStyle={styles.shellContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Mój profil</Text>

          <View style={[styles.topRow, isWideWeb && styles.topRowWide]}>
            <View style={styles.avatarSection}>
              <ProfileAvatar
                username={username}
                avatarBase64={profile?.avatarBase64}
                size={isWideWeb ? 140 : 120}
                editable
                onPress={uploading ? undefined : onChangePhoto}
              />
              <Pressable
                style={[
                  formStyles.secondaryButton,
                  styles.changePhotoButton,
                  uploading && formStyles.buttonDisabled,
                  webPointer,
                ]}
                onPress={onChangePhoto}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Text style={formStyles.secondaryButtonText}>Zmień zdjęcie</Text>
                )}
              </Pressable>
            </View>

            <View style={styles.formsColumn}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nazwa użytkownika</Text>
                <Text style={styles.currentValue}>{username}</Text>
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

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Email</Text>
                <Text style={styles.currentValue}>{email}</Text>
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
            </View>
          </View>

          <View style={[styles.sectionGrid, isWideWeb && styles.sectionGridWide]}>
            <View style={[styles.section, styles.sectionInGrid]}>
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

            <View style={[styles.section, styles.sectionInGrid, styles.dangerSection]}>
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

          {!isWideWeb ? (
            <Pressable style={[styles.linkButton, webPointer]} onPress={() => navigation.goBack()}>
              <Text style={formStyles.link}>Wróć</Text>
            </Pressable>
          ) : null}
        </View>
      </ScreenShell>
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
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardElevation,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },
  topRow: {
    gap: 20,
  },
  topRowWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarSection: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  changePhotoButton: {
    minWidth: 180,
  },
  formsColumn: {
    flex: 1,
    minWidth: 0,
  },
  sectionGrid: {
    gap: 0,
  },
  sectionGridWide: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  section: {
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionInGrid: {
    flex: 1,
    minWidth: 0,
  },
  dangerSection: {
    backgroundColor: colors.dangerBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopColor: '#F5D0D0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  currentValue: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: 10,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 10,
    lineHeight: 16,
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
    marginTop: 4,
    alignItems: 'center',
  },
});
