import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { ApiError } from '../api/client';
import {
  deleteShoppingList,
  fetchShoppingList,
  ShoppingList,
  toggleShoppingListItemChecked,
} from '../api/shoppingList';
import { AppChrome } from '../components/AppChrome';
import { AppPageFrame } from '../components/AppPageFrame';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ScreenBackButton } from '../components/ScreenBackButton';
import { ScreenShell } from '../components/ScreenShell';
import { HouseholdDetailTab } from '../household/HouseholdDetailTabBar';
import { HouseholdSectionsLayout } from '../household/HouseholdSectionsLayout';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useMobilePageInsets } from '../hooks/useMobilePageInsets';
import { resetToHouseholdDetail } from '../navigation/navigationHelpers';
import { AppStackParamList, HouseholdStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useI18n } from '../i18n/I18nContext';
import { formStyles, webPointer } from '../theme/forms';

type Props =
  | NativeStackScreenProps<HouseholdStackParamList, 'ShoppingListDetail'>
  | NativeStackScreenProps<AppStackParamList, 'ShoppingListDetail'>;

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function ShoppingListDetailScreen({ navigation, route }: Props) {
  const { t } = useI18n();
  const { householdId, householdName, shoppingListId, modelTrainedNotice } =
    route.params;
  const appNavigation = navigation as NativeStackNavigationProp<AppStackParamList>;
  const { isWideWeb } = useResponsiveLayout();
  const { pagePaddingTop } = useMobilePageInsets();
  const isNativeMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trainedNoticeVisible, setTrainedNoticeVisible] = useState(
    modelTrainedNotice === true,
  );
  const [togglingItemIndex, setTogglingItemIndex] = useState<number | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setShoppingList(await fetchShoppingList(householdId, shoppingListId));
    } catch (err) {
      setError(errorMessage(err, t('shopping.detailFailed')));
      setShoppingList(null);
    } finally {
      setIsLoading(false);
    }
  }, [householdId, shoppingListId, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onSectionChange = (tab: HouseholdDetailTab) => {
    if (tab === 'shoppingLists') {
      appNavigation.navigate('ShoppingLists', { householdId, householdName });
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

  const onToggleItemChecked = async (itemIndex: number) => {
    if (!shoppingList || togglingItemIndex != null) {
      return;
    }

    const previousList = shoppingList;
    const optimisticItems = previousList.items.map((item, index) =>
      index === itemIndex ? { ...item, checked: !item.checked } : item,
    );
    setShoppingList({ ...previousList, items: optimisticItems });
    setTogglingItemIndex(itemIndex);
    setError(null);

    try {
      const updated = await toggleShoppingListItemChecked(
        householdId,
        previousList,
        itemIndex,
      );
      setShoppingList(updated);
    } catch (err) {
      setShoppingList(previousList);
      setError(errorMessage(err, t('shopping.updateItemFailed')));
    } finally {
      setTogglingItemIndex(null);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteShoppingList(householdId, shoppingListId);
      setShowDeleteConfirm(false);
      appNavigation.navigate('ShoppingLists', { householdId, householdName });
    } catch (err) {
      setError(errorMessage(err, t('shopping.deleteFailed')));
    } finally {
      setIsDeleting(false);
    }
  };

  const goBackToLists = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    appNavigation.navigate('ShoppingLists', { householdId, householdName });
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
          <ScreenBackButton
            onPress={goBackToLists}
            disabled={isDeleting || togglingItemIndex != null}
          />
          <HouseholdSectionsLayout activeTab="shoppingLists" onChange={onSectionChange}>
            <View style={styles.content}>
              {trainedNoticeVisible ? (
                <View style={styles.trainedBanner}>
                  <Text style={styles.trainedBannerText}>{t('shopping.trainedNotice')}</Text>
                  <Pressable
                    onPress={() => setTrainedNoticeVisible(false)}
                    style={webPointer}
                    accessibilityLabel={t('shopping.dismissNotice')}
                  >
                    <Text style={styles.trainedBannerDismiss}>×</Text>
                  </Pressable>
                </View>
              ) : null}
              {error ? <Text style={formStyles.error}>{error}</Text> : null}
              {isLoading ? (
                <ActivityIndicator color={colors.primary} style={styles.loader} />
              ) : shoppingList ? (
                <>
                  <View style={[styles.header, isWideWeb && styles.headerWide]}>
                    <View style={styles.headerText}>
                      <Text style={styles.title}>{shoppingList.shoppingListName}</Text>
                      {shoppingList.shoppingListDescription ? (
                        <Text style={styles.description}>
                          {shoppingList.shoppingListDescription}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.actions}>
                      <Pressable
                        style={[formStyles.secondaryButton, styles.actionButton, webPointer]}
                        onPress={() => {
                          const mlDraft =
                            shoppingList.draftId != null
                              ? {
                                  draftId: shoppingList.draftId,
                                  shoppingListId: shoppingList.shoppingListId,
                                }
                              : undefined;
                          appNavigation.navigate('ShoppingListForm', {
                            householdId,
                            householdName,
                            shoppingList,
                            mlDraft,
                          });
                        }}
                      >
                        <Text style={formStyles.secondaryButtonText}>
                          {shoppingList.draftId ? t('shopping.editMl') : t('shopping.edit')}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[styles.deleteButton, webPointer]}
                        onPress={() => setShowDeleteConfirm(true)}
                      >
                        <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.items}>
                    {shoppingList.items.map((item, index) => (
                      <View key={`${item.name}-${index}`} style={styles.itemRow}>
                        <Pressable
                          style={[
                            styles.status,
                            item.checked && styles.statusChecked,
                            togglingItemIndex === index && styles.statusDisabled,
                            webPointer,
                          ]}
                          onPress={() => void onToggleItemChecked(index)}
                          disabled={togglingItemIndex != null}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: item.checked, disabled: togglingItemIndex != null }}
                          accessibilityLabel={
                            item.checked
                              ? t('shopping.unmarkBought', { name: item.name })
                              : t('shopping.markBought', { name: item.name })
                          }
                        >
                          <Text style={[styles.statusText, item.checked && styles.statusTextChecked]}>
                            {item.checked ? '✓' : ''}
                          </Text>
                        </Pressable>
                        <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>
                          {item.name}
                        </Text>
                        <Text style={styles.quantity}>× {item.quantity}</Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}
            </View>
          </HouseholdSectionsLayout>
        </AppPageFrame>
      </ScreenShell>

      <ConfirmDialog
        visible={showDeleteConfirm}
        title={t('shopping.deleteTitle')}
        message={t('shopping.deleteMessage', {
          name: shoppingList?.shoppingListName ?? '',
        })}
        confirmLabel={t('common.delete')}
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!isDeleting) {
            setShowDeleteConfirm(false);
          }
        }}
      />
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  shell: { maxWidth: 880, width: '100%' },
  shellWide: { maxWidth: 1120 },
  content: { alignSelf: 'center', maxWidth: 880, width: '100%' },
  trainedBanner: {
    alignItems: 'center',
    backgroundColor: '#E8F4EF',
    borderColor: colors.primary,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  trainedBannerText: { color: colors.text, flex: 1, fontSize: 14, lineHeight: 20 },
  trainedBannerDismiss: {
    color: colors.textMuted,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
  loader: { marginVertical: 32 },
  header: { gap: 16, marginBottom: 24 },
  headerWide: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerText: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  description: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: 8 },
  actions: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  actionButton: { minWidth: 110 },
  deleteButton: { paddingHorizontal: 14, paddingVertical: 12 },
  deleteButtonText: { color: colors.error, fontWeight: '700' },
  items: { borderColor: colors.border, borderRadius: 12, borderWidth: 1 },
  itemRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  status: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: 10,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  statusChecked: { backgroundColor: colors.primary },
  statusDisabled: { opacity: 0.6 },
  statusText: { color: colors.primary, fontWeight: '800' },
  statusTextChecked: { color: '#fff' },
  itemName: { color: colors.text, flex: 1, fontSize: 16 },
  itemNameChecked: { color: colors.textMuted, textDecorationLine: 'line-through' },
  quantity: { color: colors.textMuted, fontWeight: '700' },
});
