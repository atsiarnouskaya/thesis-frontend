import React, { useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import { createNavigationContainerRef } from '@react-navigation/native';
import { parseInviteCodeFromUrl } from '../household/joinLink';
import { consumePendingJoinCode, savePendingJoinCode } from '../household/pendingJoinStorage';
import { RootNavigationParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootNavigationParamList>();

const isNativeMobile = Platform.OS === 'ios' || Platform.OS === 'android';

export function navigateToJoinInvite(inviteCode: string): void {
  if (!navigationRef.isReady()) {
    return;
  }

  if (isNativeMobile) {
    navigationRef.navigate('HouseholdsTab', {
      screen: 'HouseholdList',
      params: { inviteCode },
    });
    return;
  }

  navigationRef.navigate('Households', { inviteCode });
}

type Props = {
  isAuthenticated: boolean;
};

export function JoinInviteLinkHandler({ isAuthenticated }: Props) {
  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url) {
        return;
      }

      const inviteCode = parseInviteCodeFromUrl(url);
      if (!inviteCode) {
        return;
      }

      if (isAuthenticated) {
        navigateToJoinInvite(inviteCode);
        return;
      }

      await savePendingJoinCode(inviteCode);
    };

    void Linking.getInitialURL().then((url) => handleUrl(url));

    const subscription = Linking.addEventListener('url', (event) => {
      void handleUrl(event.url);
    });

    return () => subscription.remove();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    void (async () => {
      const pending = await consumePendingJoinCode();
      if (pending) {
        navigateToJoinInvite(pending);
      }
    })();
  }, [isAuthenticated]);

  return null;
}
