import { Platform } from 'react-native';
import { LinkingOptions } from '@react-navigation/native';
import { AppStackParamList, RootNavigationParamList } from './types';

const isNativeMobile = Platform.OS === 'ios' || Platform.OS === 'android';

export function getLinkingPrefixes(): string[] {
  const prefixes: string[] = ['fridge://'];

  const configured = process.env.EXPO_PUBLIC_APP_LINK_URL?.replace(/\/$/, '');
  if (configured) {
    prefixes.push(configured);
  }

  if (typeof globalThis.location !== 'undefined') {
    prefixes.push(globalThis.location.origin);
  }

  return [...new Set(prefixes)];
}

export function createAppLinking(): LinkingOptions<RootNavigationParamList> {
  if (isNativeMobile) {
    return {
      prefixes: getLinkingPrefixes(),
      config: {
        screens: {
          HouseholdsTab: {
            screens: {
              HouseholdList: {
                path: 'join',
                parse: {
                  inviteCode: (value: string) => decodeURIComponent(value).trim().toUpperCase(),
                },
              },
              HouseholdDetail: 'household/:householdId',
              IngredientList: 'household/:householdId/ingredients',
              IngredientDetail: 'household/:householdId/ingredients/:ingredientId',
              IngredientForm: 'household/:householdId/ingredients/form',
              BarcodeScan: 'household/:householdId/ingredients/barcode/scan',
              BarcodeSearch: 'household/:householdId/ingredients/barcode',
              ReceiptScan: 'household/:householdId/ingredients/receipt/scan',
              ReceiptProducts: 'household/:householdId/ingredients/receipt/products',
              StatisticsList: 'household/:householdId/statistics',
              StatisticsChart: 'household/:householdId/statistics/:ingredientName',
              ShoppingLists: 'household/:householdId/shopping-lists',
              ShoppingListForm: 'household/:householdId/shopping-lists/form',
              ShoppingListDetail: 'household/:householdId/shopping-lists/:shoppingListId',
            },
          },
          ProfileTab: 'profile',
        },
      },
    };
  }

  return {
    prefixes: getLinkingPrefixes(),
    config: {
      screens: {
        Households: {
          path: 'join',
          parse: {
            inviteCode: (value: string) => decodeURIComponent(value).trim().toUpperCase(),
          },
        },
        HouseholdDetail: 'household/:householdId',
        IngredientList: 'household/:householdId/ingredients',
        IngredientDetail: 'household/:householdId/ingredients/:ingredientId',
        IngredientForm: 'household/:householdId/ingredients/form',
        BarcodeScan: 'household/:householdId/ingredients/barcode/scan',
        BarcodeSearch: 'household/:householdId/ingredients/barcode',
        ReceiptScan: 'household/:householdId/ingredients/receipt/scan',
        ReceiptProducts: 'household/:householdId/ingredients/receipt/products',
        StatisticsList: 'household/:householdId/statistics',
        StatisticsChart: 'household/:householdId/statistics/:ingredientName',
        ShoppingLists: 'household/:householdId/shopping-lists',
        ShoppingListForm: 'household/:householdId/shopping-lists/form',
        ShoppingListDetail: 'household/:householdId/shopping-lists/:shoppingListId',
        Profile: 'profile',
      },
    },
  } satisfies LinkingOptions<AppStackParamList>;
}
