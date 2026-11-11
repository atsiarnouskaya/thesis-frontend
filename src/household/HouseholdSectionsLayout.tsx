import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import {
  HouseholdDetailTab,
  HouseholdDetailTabBar,
} from './HouseholdDetailTabBar';

type Props = {
  activeTab: HouseholdDetailTab;
  onChange: (tab: HouseholdDetailTab) => void;
  children: React.ReactNode;
};

const isNativeMobile = Platform.OS === 'ios' || Platform.OS === 'android';

export function HouseholdSectionsLayout({ activeTab, onChange, children }: Props) {
  const useSidebar = !isNativeMobile;

  return (
    <View style={[styles.layout, !useSidebar && styles.layoutMobile]}>
      <HouseholdDetailTabBar
        activeTab={activeTab}
        onChange={onChange}
        variant={useSidebar ? 'vertical' : 'horizontal'}
      />
      <View style={[styles.content, !useSidebar && styles.contentMobile]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
    width: '100%',
  },
  layoutMobile: {
    flexDirection: 'column',
  },
  content: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  contentMobile: {
    alignItems: 'stretch',
  },
});
