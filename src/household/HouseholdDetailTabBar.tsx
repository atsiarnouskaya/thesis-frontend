import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { colors } from '../theme/colors';
import { webPointer } from '../theme/forms';

export type HouseholdDetailTab = 'products' | 'statistics' | 'shoppingLists' | 'settings';

type TabItem = {
  id: HouseholdDetailTab;
  label: string;
  shortLabel?: string;
  badge?: number;
};

type Props = {
  activeTab: HouseholdDetailTab;
  onChange: (tab: HouseholdDetailTab) => void;
  variant?: 'horizontal' | 'vertical';
};

const isNativeMobile = Platform.OS === 'ios' || Platform.OS === 'android';

export function HouseholdDetailTabBar({
  activeTab,
  onChange,
  variant,
}: Props) {
  const { isWideWeb } = useResponsiveLayout();
  const isVertical = variant === 'vertical' || (variant == null && isWideWeb);
  const isMobileGrid = !isVertical && isNativeMobile;

  const tabs: TabItem[] = [
    { id: 'products', label: 'Produkty', shortLabel: 'Produkty' },
    { id: 'statistics', label: 'Statystyki zakupów', shortLabel: 'Statystyki' },
    { id: 'shoppingLists', label: 'Listy zakupów', shortLabel: 'Listy' },
    { id: 'settings', label: 'Ustawienia', shortLabel: 'Ustawienia' },
  ];

  const bar = (
    <View
      style={[
        styles.bar,
        isVertical && styles.barVertical,
        isVertical && isNativeMobile && styles.barVerticalMobile,
        isMobileGrid && styles.barMobileGrid,
        !isVertical && !isMobileGrid && styles.barHorizontal,
      ]}
    >
      {isVertical ? <Text style={styles.sidebarHeading}>Sekcje</Text> : null}
      {tabs.map((tab) => {
        const selected = activeTab === tab.id;
        const label = isMobileGrid ? (tab.shortLabel ?? tab.label) : tab.label;

        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[
              styles.tab,
              isVertical && styles.tabVertical,
              isMobileGrid && styles.tabMobileGrid,
              !isVertical && !isMobileGrid && styles.tabHorizontal,
              selected && styles.tabActive,
              isVertical && selected && styles.tabActiveVertical,
              webPointer,
            ]}
          >
            <Text
              style={[
                styles.tabLabel,
                isMobileGrid && styles.tabLabelMobile,
                selected && styles.tabLabelActive,
              ]}
              numberOfLines={isVertical ? 2 : 1}
            >
              {label}
            </Text>
            {tab.badge != null ? (
              <View style={[styles.badge, selected && styles.badgeActive]}>
                <Text style={[styles.badgeText, selected && styles.badgeTextActive]}>
                  {tab.badge}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );

  if (isMobileGrid) {
    return bar;
  }

  if (!isVertical && !isWideWeb) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.barScrollContent}
        style={styles.barScroll}
      >
        {tabs.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onChange(tab.id)}
              style={[styles.tab, styles.tabPill, selected && styles.tabActive, webPointer]}
            >
              <Text style={[styles.tabLabel, selected && styles.tabLabelActive]}>{tab.label}</Text>
              {tab.badge != null ? (
                <View style={[styles.badge, selected && styles.badgeActive]}>
                  <Text style={[styles.badgeText, selected && styles.badgeTextActive]}>
                    {tab.badge}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    );
  }

  return bar;
}

const styles = StyleSheet.create({
  bar: {
    gap: 8,
  },
  barScroll: {
    marginBottom: 20,
    flexGrow: 0,
  },
  barScrollContent: {
    gap: 8,
    paddingRight: 4,
  },
  barHorizontal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  barMobileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  barVertical: {
    width: 220,
    flexShrink: 0,
    flexDirection: 'column',
    marginBottom: 0,
    marginRight: 32,
    paddingRight: 24,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  barVerticalMobile: {
    width: 142,
    marginRight: 16,
    paddingRight: 12,
  },
  sidebarHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FAFCFA',
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
  },
  tabHorizontal: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  tabMobileGrid: {
    flexGrow: 1,
    flexBasis: '47%',
    maxWidth: '48%',
    minHeight: 54,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
  },
  tabVertical: {
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabActiveVertical: {
    shadowColor: '#081C15',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tabLabelMobile: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
  },
  tabLabelActive: {
    color: '#fff',
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5EE',
  },
  badgeActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  badgeTextActive: {
    color: '#fff',
  },
});
