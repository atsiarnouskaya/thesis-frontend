import { Platform, useWindowDimensions } from 'react-native';
import { BREAKPOINTS, MAX_WIDTH } from '../theme/layout';

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isWideWeb = isWeb && width >= BREAKPOINTS.wide;
  const isAuthSplit = isWeb && width >= BREAKPOINTS.authSplit;

  return {
    width,
    height,
    isWeb,
    isWideWeb,
    isAuthSplit,
    contentMaxWidth: isWideWeb ? MAX_WIDTH.appShell : MAX_WIDTH.content,
    authCardMaxWidth: MAX_WIDTH.authCard,
    profileMaxWidth: MAX_WIDTH.profile,
  };
}
