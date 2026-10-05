import { NavigatorScreenParams } from '@react-navigation/native';
import { IngredientStatusFilter } from '../ingredient/ingredientFormat';
import type { ShoppingList } from '../api/shoppingList';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type HouseholdStackParamList = {
  HouseholdList: { inviteCode?: string } | undefined;
  HouseholdDetail: {
    householdId: string;
    ingredientStatusFilter?: IngredientStatusFilter;
    section?: 'products' | 'settings';
  };
  IngredientList: {
    householdId: string;
    householdName: string;
    ingredientStatusFilter?: IngredientStatusFilter;
  };
  IngredientDetail: {
    householdId: string;
    householdName: string;
    ingredientId: string;
    returnTo?: 'HouseholdDetail' | 'IngredientList';
    allowStatusChange?: boolean;
    ingredientStatusFilter?: IngredientStatusFilter;
  };
  IngredientForm: {
    householdId: string;
    householdName: string;
    ingredientId?: string;
    prefill?: {
      name?: string;
      barcode?: string;
      notes?: string | null;
    };
  };
  BarcodeSearch: {
    householdId: string;
    householdName: string;
  };
  BarcodeScan: {
    householdId: string;
    householdName: string;
  };
  StatisticsList: { householdId: string; householdName: string };
  ShoppingLists: { householdId: string; householdName: string };
  ShoppingListDetail: {
    householdId: string;
    householdName: string;
    shoppingListId: string;
    modelTrainedNotice?: boolean;
  };
  ShoppingListForm: {
    householdId: string;
    householdName: string;
    shoppingList?: ShoppingList;
    /** Pierwszy krok: nazwa/opis, potem generowanie regresją logistyczną. */
    logisticRegressionGeneration?: boolean;
    /** Drugi krok: edycja propozycji ML i wysłanie acceptGeneratedList (uczenie modelu). */
    mlDraft?: {
      draftId: string;
      shoppingListId: string;
    };
  };
  StatisticsChart: {
    householdId: string;
    householdName: string;
    ingredientName: string;
    granularity: 'MONTH' | 'YEAR';
    useFullRange?: boolean;
    startTime?: string;
    endTime?: string;
  };
};

export type MobileTabParamList = {
  HouseholdsTab: NavigatorScreenParams<HouseholdStackParamList> | undefined;
  ProfileTab: undefined;
};

export type AppStackParamList = {
  Profile: undefined;
  Households: { inviteCode?: string } | undefined;
  HouseholdDetail: {
    householdId: string;
    ingredientStatusFilter?: IngredientStatusFilter;
    section?: 'products' | 'settings';
  };
  IngredientList: {
    householdId: string;
    householdName: string;
    ingredientStatusFilter?: IngredientStatusFilter;
  };
  IngredientDetail: {
    householdId: string;
    householdName: string;
    ingredientId: string;
    returnTo?: 'HouseholdDetail' | 'IngredientList';
    allowStatusChange?: boolean;
    ingredientStatusFilter?: IngredientStatusFilter;
  };
  IngredientForm: {
    householdId: string;
    householdName: string;
    ingredientId?: string;
    prefill?: {
      name?: string;
      barcode?: string;
      notes?: string | null;
    };
  };
  BarcodeSearch: {
    householdId: string;
    householdName: string;
  };
  BarcodeScan: {
    householdId: string;
    householdName: string;
  };
  StatisticsList: { householdId: string; householdName: string };
  ShoppingLists: { householdId: string; householdName: string };
  ShoppingListDetail: {
    householdId: string;
    householdName: string;
    shoppingListId: string;
    modelTrainedNotice?: boolean;
  };
  ShoppingListForm: {
    householdId: string;
    householdName: string;
    shoppingList?: ShoppingList;
    /** Pierwszy krok: nazwa/opis, potem generowanie regresją logistyczną. */
    logisticRegressionGeneration?: boolean;
    /** Drugi krok: edycja propozycji ML i wysłanie acceptGeneratedList (uczenie modelu). */
    mlDraft?: {
      draftId: string;
      shoppingListId: string;
    };
  };
  StatisticsChart: {
    householdId: string;
    householdName: string;
    ingredientName: string;
    granularity: 'MONTH' | 'YEAR';
    useFullRange?: boolean;
    startTime?: string;
    endTime?: string;
  };
};

export type RootNavigationParamList = AppStackParamList & MobileTabParamList & HouseholdStackParamList;
