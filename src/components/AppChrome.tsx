import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { AppStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { formStyles, webPointer } from '../theme/forms';

type RouteName = keyof AppStackParamList;

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
  activeRoute: RouteName;
  children: React.ReactNode;
  scroll?: boolean;
};

export function AppChrome({ navigation, activeRoute, children, scroll = false }: Props) {
  const { signOut } = useAuth();
  const { isWideWeb } = useResponsiveLayout();

  if (!isWideWeb) {
    return scroll ? (
      <ScrollView contentContainerStyle={styles.mobileScroll} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    ) : (
      <View style={styles.mobileRoot}>{children}</View>
    );
  }

  const navItem = (route: RouteName, label: string) => {
    const active = activeRoute === route;
    return (
      <Pressable
        key={route}
        onPress={() => navigation.navigate(route)}
        style={[styles.navItem, active && styles.navItemActive, webPointer]}
      >
        <Text style={[styles.navItemText, active && styles.navItemTextActive]}>{label}</Text>
      </Pressable>
    );
  };

  const main = scroll ? (
    <ScrollView contentContainerStyle={styles.mainScroll} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={styles.main}>{children}</View>
  );

  return (
    <View style={styles.shell}>
      <View style={styles.sidebar}>
        <Text style={styles.sidebarBrand}>Fridge</Text>
        <Text style={styles.sidebarTagline}>Panel użytkownika</Text>
        <View style={styles.nav}>
          {navItem('Home', 'Start')}
          {navItem('Profile', 'Mój profil')}
        </View>
        <Pressable
          onPress={() => void signOut()}
          style={[styles.logout, webPointer]}
        >
          <Text style={styles.logoutText}>Wyloguj</Text>
        </Pressable>
      </View>
      <View style={styles.contentArea}>{main}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  mobileRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mobileScroll: {
    flexGrow: 1,
    backgroundColor: colors.background,
  },
  shell: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
    minHeight: '100%' as unknown as number,
  },
  sidebar: {
    width: 260,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'flex-start',
  },
  sidebarBrand: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
  },
  sidebarTagline: {
    marginTop: 4,
    marginBottom: 28,
    color: colors.textMuted,
    fontSize: 13,
  },
  nav: {
    gap: 8,
    flex: 1,
  },
  navItem: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  navItemActive: {
    backgroundColor: '#E8F5EE',
  },
  navItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
  },
  navItemTextActive: {
    color: colors.primary,
  },
  logout: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutText: {
    color: colors.error,
    fontWeight: '700',
  },
  contentArea: {
    flex: 1,
  },
  main: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
  },
  mainScroll: {
    flexGrow: 1,
    padding: 40,
    alignItems: 'center',
  },
});
