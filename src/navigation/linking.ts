import { LinkingOptions } from '@react-navigation/native';
import { AppStackParamList } from './types';

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

export function createAppLinking(): LinkingOptions<AppStackParamList> {
  return {
    prefixes: getLinkingPrefixes(),
    config: {
      screens: {
        Home: '',
        Households: {
          path: 'join',
          parse: {
            inviteCode: (value: string) => decodeURIComponent(value).trim().toUpperCase(),
          },
        },
        HouseholdDetail: 'household/:householdId',
        Profile: 'profile',
      },
    },
  };
}
