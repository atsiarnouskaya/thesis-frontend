import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  HouseholdDetailTab,
  HouseholdDetailTabBar,
} from './HouseholdDetailTabBar';

type Props = {
  activeTab: HouseholdDetailTab;
  onChange: (tab: HouseholdDetailTab) => void;
  children: React.ReactNode;
};

export function HouseholdSectionsLayout({ activeTab, onChange, children }: Props) {
  return (
    <View style={styles.layout}>
      <HouseholdDetailTabBar
        activeTab={activeTab}
        onChange={onChange}
        variant="vertical"
      />
      <View style={styles.content}>{children}</View>
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
  content: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
  },
});
