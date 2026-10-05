import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { colors } from '../theme/colors';
import { cardElevation } from '../theme/forms';

type Variant = 'auth' | 'app' | 'profile';

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  scroll?: boolean;
  card?: boolean;
  alignTop?: boolean;
  contentStyle?: ViewStyle | ViewStyle[];
};

export function ScreenShell({
  children,
  variant = 'app',
  scroll = false,
  card = true,
  alignTop = false,
  contentStyle,
}: Props) {
  const { isWeb, authCardMaxWidth, contentMaxWidth, profileMaxWidth } = useResponsiveLayout();

  const maxWidth =
    variant === 'auth' ? authCardMaxWidth : variant === 'profile' ? profileMaxWidth : contentMaxWidth;

  const showCard = card && !isWeb;

  const inner = (
    <View
      style={[
        styles.inner,
        isWeb && styles.innerWeb,
        { maxWidth },
        showCard && styles.card,
        showCard && cardElevation,
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, isWeb && styles.scrollContentWeb]}
      keyboardShouldPersistTaps="handled"
    >
      {inner}
    </ScrollView>
  ) : (
    <View style={[styles.centered, isWeb && styles.centeredWeb, alignTop && styles.alignTop]}>
      {inner}
    </View>
  );

  return <View style={styles.root}>{body}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  centeredWeb: {
    padding: 0,
    alignItems: 'center',
  },
  alignTop: {
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
  },
  scrollContentWeb: {
    flexGrow: 1,
    padding: 0,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
  },
  innerWeb: {
    alignSelf: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    ...(Platform.OS === 'web' ? { alignSelf: 'center' } : {}),
  },
});
