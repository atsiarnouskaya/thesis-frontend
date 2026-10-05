import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MOBILE_PAGE_EXTRA_TOP = 16;

export function useMobilePageInsets() {
  const insets = useSafeAreaInsets();
  const isNativeMobile = Platform.OS === 'ios' || Platform.OS === 'android';

  return {
    isNativeMobile,
    pagePaddingTop: isNativeMobile ? insets.top + MOBILE_PAGE_EXTRA_TOP : 8,
  };
}
