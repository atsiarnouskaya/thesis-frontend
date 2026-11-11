import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/auth/AuthContext';
import { I18nProvider } from './src/i18n/I18nContext';
import { ProfileProvider } from './src/profile/ProfileContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AvatarCropHost } from './src/components/AvatarCropHost';
import { applyWebGlobalStyles } from './src/theme/applyWebGlobalStyles';

export default function App() {
  useEffect(() => {
    applyWebGlobalStyles();
  }, []);

  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AuthProvider>
          <ProfileProvider>
            <AvatarCropHost />
            <StatusBar style="dark" />
            <RootNavigator />
          </ProfileProvider>
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
