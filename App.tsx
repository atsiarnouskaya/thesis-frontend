import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/auth/AuthContext';
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
      <AuthProvider>
        <ProfileProvider>
          <AvatarCropHost />
          <StatusBar style="dark" />
          <RootNavigator />
        </ProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
