import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors } from '../theme/colors';
import { HouseholdStack } from './HouseholdStack';
import { MobileTabBarIcon } from './MobileTabBarIcon';
import { useI18n } from '../i18n/I18nContext';
import { MobileTabParamList } from './types';

const Tab = createBottomTabNavigator<MobileTabParamList>();

const tabBarBaseStyle = {
  backgroundColor: colors.surface,
  borderTopColor: colors.border,
  borderTopWidth: 1,
  paddingTop: 6,
  height: Platform.OS === 'ios' ? 84 : 68,
} as const;

export function MobileTabNavigator() {
  const { t } = useI18n();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: tabBarBaseStyle,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: Platform.OS === 'ios' ? 2 : 8,
        },
      }}
    >
      <Tab.Screen
        name="HouseholdsTab"
        component={HouseholdStack}
        options={{
          title: t('nav.households'),
          tabBarLabel: t('nav.households'),
          tabBarIcon: ({ color, focused }) => (
            <MobileTabBarIcon name="fridge" color={color} focused={focused} />
          ),
        }}
        listeners={({ navigation, route }) => ({
          tabPress: (event) => {
            const routeName = getFocusedRouteNameFromRoute(route) ?? 'HouseholdList';
            if (routeName !== 'HouseholdList') {
              event.preventDefault();
              navigation.navigate('HouseholdsTab', { screen: 'HouseholdList' });
            }
          },
        })}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: t('nav.profile'),
          tabBarLabel: t('nav.profile'),
          tabBarIcon: ({ color, focused }) => (
            <MobileTabBarIcon name="profile" color={color} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
