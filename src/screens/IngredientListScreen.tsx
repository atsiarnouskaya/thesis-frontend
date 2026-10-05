import React from 'react';
import { StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppPageFrame } from '../components/AppPageFrame';
import { AppChrome } from '../components/AppChrome';
import { ScreenShell } from '../components/ScreenShell';
import { HouseholdIngredientsPanel } from '../household/HouseholdIngredientsPanel';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { AppStackParamList, HouseholdStackParamList } from '../navigation/types';

type Props =
  | NativeStackScreenProps<HouseholdStackParamList, 'IngredientList'>
  | NativeStackScreenProps<AppStackParamList, 'IngredientList'>;

export function IngredientListScreen({ navigation, route }: Props) {
  const { householdId, householdName, ingredientStatusFilter } = route.params;
  const { isWideWeb } = useResponsiveLayout();

  return (
    <AppChrome navigation={navigation} activeRoute="Households" scroll>
      <ScreenShell variant="app" card={false} alignTop contentStyle={[styles.shell, isWideWeb && styles.shellWide]}>
        <AppPageFrame style={isWideWeb ? styles.frameWide : undefined}>
          <HouseholdIngredientsPanel
            householdId={householdId}
            householdName={householdName}
            navigation={navigation}
            variant="standalone"
            initialStatusFilter={ingredientStatusFilter}
            onStatusFilterChange={(filter) => {
              navigation.setParams({ ingredientStatusFilter: filter });
            }}
          />
        </AppPageFrame>
      </ScreenShell>
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    maxWidth: 880,
  },
  shellWide: {
    maxWidth: 1120,
  },
  frameWide: {
    gap: 0,
  },
});
