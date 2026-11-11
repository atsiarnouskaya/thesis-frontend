import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { AppStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useI18n } from '../i18n/I18nContext';
import { formStyles, webPointer } from '../theme/forms';
import { LanguageToggle } from './LanguageToggle';

type RouteName = keyof AppStackParamList;
type NavigationRoute = 'Households' | 'Profile';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
  activeRoute: RouteName;
  children: React.ReactNode;
  scroll?: boolean;
};

export function AppChrome({ navigation, activeRoute, children, scroll = false }: Props) {
  const { t } = useI18n();
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

  const navItem = (route: NavigationRoute, label: string) => {
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
        <Text style={styles.sidebarTagline}>{t('nav.userPanel')}</Text>
        <View style={styles.nav}>
          {navItem('Households', t('nav.households'))}
          {navItem('Profile', t('nav.myProfile'))}
        </View>
        <View style={styles.langWrap}>
          <LanguageToggle />
        </View>
        <Pressable
          onPress={() => void signOut()}
          style={[styles.logout, webPointer]}
        >
          <Text style={styles.logoutText}>{t('nav.signOut')}</Text>
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
  langWrap: {
    marginTop: 8,
    marginBottom: 8,
  },
  logout: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
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
    padding: 32,
    alignItems: 'center',
  },
  mainScroll: {
    flexGrow: 1,
    padding: 32,
    alignItems: 'center',
  },
});
