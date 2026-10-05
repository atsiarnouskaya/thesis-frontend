import React from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { HouseholdDetailScreen } from '../screens/HouseholdDetailScreen';
import { HouseholdListScreen } from '../screens/HouseholdListScreen';
import { IngredientDetailScreen } from '../screens/IngredientDetailScreen';
import { IngredientFormScreen } from '../screens/IngredientFormScreen';
import { IngredientListScreen } from '../screens/IngredientListScreen';
import { BarcodeSearchScreen } from '../screens/BarcodeSearchScreen';
import { BarcodeScanScreen } from '../screens/BarcodeScanScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { StatisticsChartScreen } from '../screens/StatisticsChartScreen';
import { StatisticsListScreen } from '../screens/StatisticsListScreen';
import { ShoppingListFormScreen } from '../screens/ShoppingListFormScreen';
import { ShoppingListDetailScreen } from '../screens/ShoppingListDetailScreen';
import { ShoppingListsScreen } from '../screens/ShoppingListsScreen';
import { colors } from '../theme/colors';
import { AppStackParamList, AuthStackParamList } from './types';
import { createAppLinking } from './linking';
import { JoinInviteLinkHandler, navigationRef } from './joinInviteNavigation';
import { MobileTabNavigator } from './MobileTabNavigator';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

const isNativeMobile = Platform.OS === 'ios' || Platform.OS === 'android';

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function WebAppNavigator() {
  return (
    <AppStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <AppStack.Screen name="Households" component={HouseholdListScreen} options={{ title: 'Lodówki' }} />
      <AppStack.Screen
        name="HouseholdDetail"
        component={HouseholdDetailScreen}
        options={{ title: 'Lodówka' }}
      />
      <AppStack.Screen
        name="IngredientList"
        component={IngredientListScreen}
        options={{ title: 'Produkty' }}
      />
      <AppStack.Screen
        name="IngredientDetail"
        component={IngredientDetailScreen}
        options={{ title: 'Produkt' }}
      />
      <AppStack.Screen
        name="IngredientForm"
        component={IngredientFormScreen}
        options={{ title: 'Produkt' }}
      />
      <AppStack.Screen
        name="BarcodeScan"
        component={BarcodeScanScreen}
        options={{ title: 'Skanuj kod' }}
      />
      <AppStack.Screen
        name="BarcodeSearch"
        component={BarcodeSearchScreen}
        options={{ title: 'Kod kreskowy' }}
      />
      <AppStack.Screen
        name="StatisticsList"
        component={StatisticsListScreen}
        options={{ title: 'Statystyki' }}
      />
      <AppStack.Screen
        name="StatisticsChart"
        component={StatisticsChartScreen}
        options={{ title: 'Wykres zakupów' }}
      />
      <AppStack.Screen
        name="ShoppingLists"
        component={ShoppingListsScreen}
        options={{ title: 'Listy zakupów' }}
      />
      <AppStack.Screen
        name="ShoppingListForm"
        component={ShoppingListFormScreen}
        options={{ title: 'Nowa lista zakupów' }}
      />
      <AppStack.Screen
        name="ShoppingListDetail"
        component={ShoppingListDetailScreen}
        options={{ title: 'Lista zakupów' }}
      />
      <AppStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    </AppStack.Navigator>
  );
}

function AppNavigator() {
  if (isNativeMobile) {
    return <MobileTabNavigator />;
  }

  return <WebAppNavigator />;
}

export function RootNavigator() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <JoinInviteLinkHandler isAuthenticated={isAuthenticated} />
      <NavigationContainer
        ref={navigationRef}
        linking={isAuthenticated ? createAppLinking() : undefined}
      >
        {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </>
  );
}
