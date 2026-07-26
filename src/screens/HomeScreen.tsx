import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { colors } from '../theme/colors';

export function HomeScreen() {
  const { signOut, token } = useAuth();
  const [loading, setLoading] = useState(false);

  const onLogout = async () => {
    setLoading(true);
    try {
      await signOut();
    } finally {
      setLoading(false);
    }
  };

  const preview = token ? `${token.slice(0, 18)}…` : '—';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.brand}>Fridge</Text>
        <Text style={styles.title}>Jesteś zalogowany</Text>
        <Text style={styles.subtitle}>
          Token JWT jest zapisany w SecureStore. Stąd rozbudujesz ekrany lodówki.
        </Text>

        <View style={styles.tokenBox}>
          <Text style={styles.tokenLabel}>JWT (skrót)</Text>
          <Text style={styles.tokenValue}>{preview}</Text>
        </View>

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
  tokenBox: {
    backgroundColor: '#F0F7F4',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  tokenLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
    fontWeight: '600',
  },
  tokenValue: {
    color: colors.text,
    fontFamily: 'monospace',
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
