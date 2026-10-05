import { CommonActions, NavigationProp, ParamListBase } from '@react-navigation/native';
import { Platform } from 'react-native';

type HouseholdDetailParams = {
  householdId: string;
  section?: 'products' | 'settings';
};

const isNativeMobile = Platform.OS === 'ios' || Platform.OS === 'android';

export function resetToHouseholdDetail(
  navigation: NavigationProp<ParamListBase>,
  params: HouseholdDetailParams,
): void {
  navigation.dispatch(
    CommonActions.reset({
      index: 1,
      routes: [
        { name: isNativeMobile ? 'HouseholdList' : 'Households' },
        { name: 'HouseholdDetail', params },
      ],
    }),
  );
}

export function navigateToHouseholdList(
  navigation: NavigationProp<ParamListBase>,
  params?: { inviteCode?: string },
): void {
  if (isNativeMobile) {
    navigation.navigate('HouseholdList', params);
    return;
  }

  navigation.navigate('Households', params);
}
