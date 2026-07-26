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
import { useAuth } from '../auth/AuthContext';
import { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const PASSWORD_REGEX = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;

export function RegisterScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setSuccess(null);

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
      await signUp({ username, email, password });
      setSuccess('Konto utworzone. Możesz się zalogować.');
      setTimeout(() => navigation.navigate('Login'), 800);
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
          <Text style={styles.subtitle}>Rejestracja przez /auth/register</Text>

          <Text style={styles.label}>Nazwa użytkownika</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            placeholder="np. ania"
            placeholderTextColor={colors.textMuted}
            value={username}
            onChangeText={setUsername}
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
          />

          <Text style={styles.label}>Hasło</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="SilneHaslo1!"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}

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
    marginBottom: 20,
    color: colors.textMuted,
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
  success: {
    color: colors.accent,
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
