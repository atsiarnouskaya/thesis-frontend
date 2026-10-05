import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { colors } from '../theme/colors';
import { cardElevation } from '../theme/forms';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** Pełna wysokość panelu (np. detal lodówki na desktopie). */
  fill?: boolean;
};

export function AppPageFrame({ children, style, fill = false }: Props) {
  const { isWeb, isWideWeb } = useResponsiveLayout();

  if (isWeb) {
    return (
      <View
        style={[
          webStyles.frame,
          isWideWeb && webStyles.frameWide,
          fill && webStyles.frameFill,
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View style={[mobileStyles.card, cardElevation, style]}>
      {children}
    </View>
  );
}

const webStyles = StyleSheet.create({
  frame: {
    width: '100%',
    alignSelf: 'center',
  },
  frameWide: {
    gap: 0,
  },
  frameFill: {
    flex: 1,
    minHeight: 0,
  },
});

const mobileStyles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    ...(Platform.OS === 'web' ? {} : {}),
  },
});
