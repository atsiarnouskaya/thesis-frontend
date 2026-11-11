import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {
  fetchShoppingLists,
  ShoppingList,
} from '../api/shoppingList';
import { ApiError } from '../api/client';
import { AppChrome } from '../components/AppChrome';
import { AppPageFrame } from '../components/AppPageFrame';
import { ScreenShell } from '../components/ScreenShell';
import {
  HouseholdDetailTab,
} from '../household/HouseholdDetailTabBar';
import { HouseholdSectionsLayout } from '../household/HouseholdSectionsLayout';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useMobilePageInsets } from '../hooks/useMobilePageInsets';
import { resetToHouseholdDetail } from '../navigation/navigationHelpers';
import { AppStackParamList, HouseholdStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useI18n } from '../i18n/I18nContext';
import { formStyles, webPointer } from '../theme/forms';

const PAGE_SIZE = 20;

type Props =
  | NativeStackScreenProps<HouseholdStackParamList, 'ShoppingLists'>
  | NativeStackScreenProps<AppStackParamList, 'ShoppingLists'>;

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function ShoppingListsScreen({ navigation, route }: Props) {
  const { t } = useI18n();
  const { householdId, householdName } = route.params;
  const appNavigation = navigation as NativeStackNavigationProp<AppStackParamList>;
  const { isWideWeb } = useResponsiveLayout();
  const { pagePaddingTop } = useMobilePageInsets();
  const isNativeMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (targetPage: number, append: boolean) => {
      append ? setIsLoadingMore(true) : setIsLoading(true);
      setError(null);

      try {
        const result = await fetchShoppingLists(householdId, {
          page: targetPage,
          size: PAGE_SIZE,
        });
        setShoppingLists((current) =>
          append ? [...current, ...result.items] : result.items,
        );
        setPage(result.page);
        setHasNext(result.hasNext);
      } catch (err) {
        setError(errorMessage(err, t('shopping.listsFetchFailed')));
        if (!append) {
          setShoppingLists([]);
          setHasNext(false);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [householdId, t],
  );

  useFocusEffect(
    useCallback(() => {
      void loadPage(0, false);
    }, [loadPage]),
  );

  const onSectionChange = (tab: HouseholdDetailTab) => {
    if (tab === 'shoppingLists') {
      return;
    }
    if (tab === 'statistics') {
      appNavigation.navigate('StatisticsList', { householdId, householdName });
      return;
    }
    resetToHouseholdDetail(navigation, {
      householdId,
      section: tab === 'settings' ? 'settings' : 'products',
    });
  };

  return (
    <AppChrome navigation={appNavigation} activeRoute="Households" scroll>
      <ScreenShell
        variant="app"
        card={false}
        alignTop
        contentStyle={
          isWideWeb
            ? [styles.shell, styles.shellWide]
            : isNativeMobile
              ? [styles.shell, { paddingTop: pagePaddingTop }]
              : styles.shell
        }
      >
        <AppPageFrame>
          <HouseholdSectionsLayout activeTab="shoppingLists" onChange={onSectionChange}>
            <View style={styles.centeredContent}>
              <View style={[styles.header, isWideWeb && styles.headerWide]}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{t('shopping.listsTitle')}</Text>
              <Text style={styles.lead}>{t('shopping.listsLead', { name: householdName })}</Text>
            </View>
            <View style={styles.headerButtons}>
              <Pressable
                style={[formStyles.primaryButton, styles.createButton, webPointer]}
                onPress={() =>
                  appNavigation.navigate('ShoppingListForm', { householdId, householdName })
                }
              >
                <Text style={formStyles.primaryButtonText}>{t('shopping.newListButton')}</Text>
              </Pressable>
              <Pressable
                style={[formStyles.secondaryButton, styles.mlButton, webPointer]}
                onPress={() =>
                  appNavigation.navigate('ShoppingListForm', {
                    householdId,
                    householdName,
                    logisticRegressionGeneration: true,
                  })
                }
              >
                <Text style={formStyles.secondaryButtonText}>{t('shopping.createWithMl')}</Text>
              </Pressable>
            </View>
              </View>

              {error ? <Text style={formStyles.error}>{error}</Text> : null}

              {isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : shoppingLists.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{t('shopping.emptyTitle')}</Text>
              <Text style={styles.emptyText}>{t('shopping.emptyText')}</Text>
            </View>
          ) : (
            <View style={[styles.list, isWideWeb && styles.listWide]}>
              {shoppingLists.map((shoppingList) => (
                <Pressable
                  key={shoppingList.shoppingListId}
                  style={[styles.card, isWideWeb && styles.cardWide, webPointer]}
                  onPress={() =>
                    appNavigation.navigate('ShoppingListDetail', {
                      householdId,
                      householdName,
                      shoppingListId: shoppingList.shoppingListId,
                    })
                  }
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleGroup}>
                      <Text style={styles.cardTitle}>{shoppingList.shoppingListName}</Text>
                      <Text
                        style={[
                          styles.description,
                          !shoppingList.shoppingListDescription && styles.descriptionEmpty,
                        ]}
                      >
                        {shoppingList.shoppingListDescription || t('shopping.noDescription')}
                      </Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </View>
                </Pressable>
              ))}
            </View>
              )}

              {hasNext ? (
            <Pressable
              style={[formStyles.secondaryButton, styles.loadMoreButton, webPointer]}
              onPress={() => void loadPage(page + 1, true)}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={formStyles.secondaryButtonText}>{t('common.loadMore')}</Text>
              )}
            </Pressable>
              ) : null}
            </View>
          </HouseholdSectionsLayout>
        </AppPageFrame>
      </ScreenShell>

    </AppChrome>
  );
}

const styles = StyleSheet.create({
  shell: { width: '100%', maxWidth: 880 },
  shellWide: { maxWidth: 1120 },
  centeredContent: { alignSelf: 'center', maxWidth: 880, width: '100%' },
  header: { gap: 16, marginBottom: 24 },
  headerWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginBottom: 8 },
  lead: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  createButton: { alignSelf: 'stretch', paddingHorizontal: 20 },
  headerButtons: { alignSelf: 'stretch', gap: 10 },
  mlButton: { alignSelf: 'stretch', paddingHorizontal: 16 },
  loader: { marginVertical: 32 },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#FAFCFA',
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
  },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 8 },
  emptyText: { color: colors.textMuted, lineHeight: 22, textAlign: 'center' },
  list: { gap: 12, width: '100%' },
  listWide: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: {
    backgroundColor: '#FAFCFA',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  cardWide: { flexBasis: '100%', flexGrow: 0, flexShrink: 0, maxWidth: '100%', width: '100%' },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  cardTitleGroup: { flex: 1, minWidth: 0 },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  description: { color: colors.textMuted, lineHeight: 20, marginTop: 8 },
  descriptionEmpty: { fontStyle: 'italic' },
  chevron: { color: colors.primary, fontSize: 30, lineHeight: 32 },
  loadMoreButton: { marginTop: 16, width: '100%' },
});
