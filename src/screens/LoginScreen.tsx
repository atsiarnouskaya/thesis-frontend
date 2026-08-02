import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthSplitLayout } from '../components/AuthSplitLayout';
import { FormTextInput } from '../components/FormTextInput';
import { useAuth } from '../auth/AuthContext';
import { useProfile } from '../profile/ProfileContext';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { formStyles, webPointer } from '../theme/forms';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const { refreshProfile } = useProfile();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);

    if (!email.trim() || !password) {
      setError('Podaj email i hasło');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logowanie nie powiodło się');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout>
      <Text style={formStyles.brand}>Fridge</Text>
      <Text style={formStyles.title}>Zaloguj się</Text>
      <Text style={formStyles.subtitle}>Konto z backendu Fridge — ten sam login na webie i mobile.</Text>

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
          <Text style={formStyles.primaryButtonText}>Zaloguj</Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('Register')}
        style={[styles.linkWrap, webPointer]}
      >
        <Text style={formStyles.link}>Nie masz konta? Zarejestruj się</Text>
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
