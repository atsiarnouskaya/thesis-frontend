import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** Pełna wysokość panelu (np. detal lodówki na desktopie). */
  fill?: boolean;
};

const isNativeMobile = Platform.OS === 'ios' || Platform.OS === 'android';

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

  return <View style={[nativeStyles.frame, style]}>{children}</View>;
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

const nativeStyles = StyleSheet.create({
  frame: {
    width: '100%',
    alignSelf: 'stretch',
  },
});
