import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { colors } from '../theme/colors';
import { useI18n } from '../i18n/I18nContext';
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
  const { t } = useI18n();
  const { isWideWeb } = useResponsiveLayout();
  const isVertical = variant === 'vertical' || (variant == null && isWideWeb);

  const tabs: TabItem[] = [
    {
      id: 'products',
      label: t('nav.tabProducts'),
      shortLabel: t('nav.tabProducts'),
    },
    {
      id: 'statistics',
      label: t('nav.tabStatistics'),
      shortLabel: t('nav.tabStatisticsShort'),
    },
    {
      id: 'shoppingLists',
      label: t('nav.tabShoppingLists'),
      shortLabel: t('nav.tabShoppingListsShort'),
    },
    {
      id: 'settings',
      label: t('nav.tabSettings'),
      shortLabel: t('nav.tabSettings'),
    },
  ];

  if (!isVertical) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.barScrollContent,
          isNativeMobile && styles.barScrollContentMobile,
        ]}
        style={[styles.barScroll, isNativeMobile && styles.barScrollMobile]}
      >
        {tabs.map((tab) => {
          const selected = activeTab === tab.id;
          const label = isNativeMobile ? (tab.shortLabel ?? tab.label) : tab.label;

          return (
            <Pressable
              key={tab.id}
              onPress={() => onChange(tab.id)}
              style={[
                styles.tab,
                styles.tabPill,
                isNativeMobile && styles.tabPillMobile,
                selected && styles.tabActive,
                webPointer,
              ]}
            >
              <Text style={[styles.tabLabel, selected && styles.tabLabelActive]}>{label}</Text>
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

  return (
    <View style={[styles.bar, styles.barVertical]}>
      <Text style={styles.sidebarHeading}>{t('nav.sections')}</Text>
      {tabs.map((tab) => {
        const selected = activeTab === tab.id;

        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[
              styles.tab,
              styles.tabVertical,
              selected && styles.tabActive,
              selected && styles.tabActiveVertical,
              webPointer,
            ]}
          >
            <Text
              style={[styles.tabLabel, selected && styles.tabLabelActive]}
              numberOfLines={2}
            >
              {tab.label}
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
}

const styles = StyleSheet.create({
  bar: {
    gap: 8,
  },
  barScroll: {
    marginBottom: 20,
    flexGrow: 0,
  },
  barScrollMobile: {
    marginBottom: 16,
    marginHorizontal: -2,
  },
  barScrollContent: {
    gap: 8,
    paddingRight: 4,
  },
  barScrollContentMobile: {
    paddingHorizontal: 2,
    gap: 10,
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
  tabPillMobile: {
    paddingHorizontal: 14,
    paddingVertical: 10,
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
