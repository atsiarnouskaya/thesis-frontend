import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthSplitLayout } from '../components/AuthSplitLayout';
import { FormTextInput } from '../components/FormTextInput';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { useProfile } from '../profile/ProfileContext';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { formStyles, webPointer } from '../theme/forms';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { signIn } = useAuth();
  const { refreshProfile } = useProfile();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);

    if (!email.trim() || !password) {
      setError(t('auth.loginMissing'));
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout>
      <Text style={formStyles.brand}>Fridge</Text>
      <Text style={formStyles.title}>{t('auth.loginTitle')}</Text>
      <Text style={formStyles.subtitle}>{t('auth.loginSubtitle')}</Text>

      <Text style={formStyles.label}>{t('common.email')}</Text>
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

      <Text style={formStyles.label}>{t('common.password')}</Text>
      <FormTextInput
        secureTextEntry
        placeholder="••••••••"
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
          <Text style={formStyles.primaryButtonText}>{t('auth.loginButton')}</Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('Register')}
        style={[styles.linkWrap, webPointer]}
      >
        <Text style={formStyles.link}>{t('auth.noAccount')}</Text>
      </Pressable>
    </AuthSplitLayout>
  );
}

const styles = StyleSheet.create({
  linkWrap: {
    marginTop: 18,
    alignItems: 'center',
  },
});
