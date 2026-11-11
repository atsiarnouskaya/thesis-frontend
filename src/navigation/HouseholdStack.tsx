import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HouseholdDetailScreen } from '../screens/HouseholdDetailScreen';
import { HouseholdListScreen } from '../screens/HouseholdListScreen';
import { IngredientDetailScreen } from '../screens/IngredientDetailScreen';
import { IngredientFormScreen } from '../screens/IngredientFormScreen';
import { IngredientListScreen } from '../screens/IngredientListScreen';
import { BarcodeSearchScreen } from '../screens/BarcodeSearchScreen';
import { BarcodeScanScreen } from '../screens/BarcodeScanScreen';
import { ReceiptProductsScreen } from '../screens/ReceiptProductsScreen';
import { ReceiptScanScreen } from '../screens/ReceiptScanScreen';
import { StatisticsChartScreen } from '../screens/StatisticsChartScreen';
import { StatisticsListScreen } from '../screens/StatisticsListScreen';
import { ShoppingListFormScreen } from '../screens/ShoppingListFormScreen';
import { ShoppingListDetailScreen } from '../screens/ShoppingListDetailScreen';
import { ShoppingListsScreen } from '../screens/ShoppingListsScreen';
import { colors } from '../theme/colors';
import { HouseholdStackParamList } from './types';

const Stack = createNativeStackNavigator<HouseholdStackParamList>();

export function HouseholdStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerTintColor: colors.primary,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="HouseholdList" component={HouseholdListScreen} />
      <Stack.Screen name="HouseholdDetail" component={HouseholdDetailScreen} />
      <Stack.Screen name="IngredientList" component={IngredientListScreen} />
      <Stack.Screen name="IngredientDetail" component={IngredientDetailScreen} />
      <Stack.Screen
        name="IngredientForm"
        component={IngredientFormScreen}
      />
      <Stack.Screen name="BarcodeScan" component={BarcodeScanScreen} />
      <Stack.Screen name="BarcodeSearch" component={BarcodeSearchScreen} />
      <Stack.Screen name="ReceiptScan" component={ReceiptScanScreen} />
      <Stack.Screen name="ReceiptProducts" component={ReceiptProductsScreen} />
      <Stack.Screen name="StatisticsList" component={StatisticsListScreen} />
      <Stack.Screen name="StatisticsChart" component={StatisticsChartScreen} />
      <Stack.Screen name="ShoppingLists" component={ShoppingListsScreen} />
      <Stack.Screen name="ShoppingListDetail" component={ShoppingListDetailScreen} />
      <Stack.Screen name="ShoppingListForm" component={ShoppingListFormScreen} />
    </Stack.Navigator>
  );
}
