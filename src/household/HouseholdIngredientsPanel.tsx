import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  deleteIngredient,
  consumeIngredient,
  discardIngredient,
  fetchIngredientsFiltered,
  Ingredient,
  IngredientStatus,
} from '../api/ingredient';
import { ApiError } from '../api/client';
import { ConfirmDialog, ConfirmDialogVariant } from '../components/ConfirmDialog';
import { IngredientDeleteButton } from '../components/IngredientDeleteButton';
import { IngredientPhoto } from '../components/IngredientPhoto';
import { IngredientStatusButtons } from '../components/IngredientStatusButtons';
import {
  expiryStatusLabel,
  formatIngredientQuantity,
  formatLocalDate,
  getExpiryStatus,
  INGREDIENT_STATUS_FILTERS,
  ingredientStatusCountLabel,
  ingredientStatusFilterLabel,
  IngredientStatusFilter,
  shouldShowExpiryBadge,
  todayLocalDateString,
} from '../ingredient/ingredientFormat';
import { HouseholdStackParamList } from '../navigation/types';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { colors } from '../theme/colors';
import { formStyles, webPointer } from '../theme/forms';

const PAGE_SIZE = 20;

type Props = {
  householdId: string;
  householdName: string;
  navigation: NativeStackNavigationProp<HouseholdStackParamList>;
  variant?: 'embedded' | 'standalone';
  initialStatusFilter?: IngredientStatusFilter;
  onStatusFilterChange?: (filter: IngredientStatusFilter) => void;
};

type PendingAction = {
  ingredientId: string;
  type: 'consume' | 'discard' | 'delete';
};

type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel: string;
  variant: ConfirmDialogVariant;
  onConfirm: () => Promise<void>;
};

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

function DiscardInfoBanner() {
  return (
    <View style={styles.infoBanner}>
      <Text style={styles.infoBannerTitle}>Co oznacza „Wyrzucone”?</Text>
      <Text style={styles.infoBannerText}>
        Oznacza, że produkt nie został zjedzony. Ta informacja będzie wykorzystywana przy
        obliczaniu statystyk i generowaniu listy zakupów.
      </Text>
    </View>
  );
}

export function HouseholdIngredientsPanel({
  householdId,
  householdName,
  navigation,
  variant = 'embedded',
  initialStatusFilter,
  onStatusFilterChange,
}: Props) {
  const { isWideWeb } = useResponsiveLayout();
  const isStandalone = variant === 'standalone';

  const [statusFilter, setStatusFilter] = useState<IngredientStatusFilter>(
    initialStatusFilter ?? 'PURCHASED',
  );
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  useEffect(() => {
    if (initialStatusFilter == null) {
      return;
    }

    setStatusFilter((current) =>
      current === initialStatusFilter ? current : initialStatusFilter,
    );
  }, [initialStatusFilter]);

  const openConfirm = (request: ConfirmRequest) => {
    setConfirmRequest(request);
  };

  const closeConfirm = () => {
    if (!isConfirmLoading) {
      setConfirmRequest(null);
    }
  };

  const handleConfirm = async () => {
    if (!confirmRequest) {
      return;
    }

    setIsConfirmLoading(true);
    try {
      await confirmRequest.onConfirm();
      setConfirmRequest(null);
    } finally {
      setIsConfirmLoading(false);
    }
  };

  const loadPage = useCallback(
    async (targetPage: number, append: boolean, status: IngredientStatus) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setError(null);
        setIsLoading(true);
      }

      try {
        const result = await fetchIngredientsFiltered(householdId, {
          status,
          page: targetPage,
          size: PAGE_SIZE,
        });

        setIngredients((current) => (append ? [...current, ...result.items] : result.items));
        setTotalElements(result.totalElements);
        setHasNext(result.hasNext);
        setPage(result.page);
      } catch (err) {
        setError(errorMessage(err, 'Nie udało się pobrać produktów'));
        if (!append) {
          setIngredients([]);
          setTotalElements(0);
          setHasNext(false);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [householdId],
  );

  useFocusEffect(
    useCallback(() => {
      void loadPage(0, false, statusFilter);
    }, [loadPage, statusFilter]),
  );

  const onFilterChange = (nextStatus: IngredientStatusFilter) => {
    if (nextStatus === statusFilter) {
      return;
    }
    setStatusFilter(nextStatus);
    onStatusFilterChange?.(nextStatus);
    setIngredients([]);
    setPage(0);
    setHasNext(false);
    setTotalElements(0);
  };

  const openCreateForm = () => {
    navigation.navigate('IngredientForm', {
      householdId,
      householdName,
    });
  };

  const openBarcodeScan = () => {
    navigation.navigate('BarcodeScan', {
      householdId,
      householdName,
    });
  };

  const openBarcodeSearch = () => {
    navigation.navigate('BarcodeSearch', {
      householdId,
      householdName,
    });
  };

  const onDelete = (ingredient: Ingredient) => {
    openConfirm({
      title: 'Usuń produkt',
      message: `Czy na pewno chcesz usunąć „${ingredient.name}”? Tej operacji nie można cofnąć.`,
      confirmLabel: 'Usuń',
      variant: 'destructive',
      onConfirm: async () => {
        setError(null);
        setPendingAction({ ingredientId: ingredient.id, type: 'delete' });
        try {
          await deleteIngredient(householdId, ingredient.id);
          setIngredients((current) => current.filter((item) => item.id !== ingredient.id));
          setTotalElements((current) => Math.max(0, current - 1));
        } catch (err) {
          setError(errorMessage(err, 'Nie udało się usunąć produktu'));
        } finally {
          setPendingAction(null);
        }
      },
    });
  };

  const onConsume = (ingredient: Ingredient) => {
    openConfirm({
      title: 'Oznacz jako zjedzone',
      message: `Czy produkt „${ingredient.name}” został zjedzony?`,
      confirmLabel: 'Zjedzone',
      variant: 'default',
      onConfirm: async () => {
        setError(null);
        setPendingAction({ ingredientId: ingredient.id, type: 'consume' });
        try {
          await consumeIngredient(householdId, ingredient.id, todayLocalDateString());
          setIngredients((current) => current.filter((item) => item.id !== ingredient.id));
          setTotalElements((current) => Math.max(0, current - 1));
        } catch (err) {
          setError(errorMessage(err, 'Nie udało się oznaczyć produktu jako zjedzonego'));
        } finally {
          setPendingAction(null);
        }
      },
    });
  };

  const onDiscard = (ingredient: Ingredient) => {
    openConfirm({
      title: 'Oznacz jako wyrzucone',
      message: `Czy produkt „${ingredient.name}” został wyrzucony i nie został zjedzony?`,
      confirmLabel: 'Wyrzucone',
      variant: 'default',
      onConfirm: async () => {
        setError(null);
        setPendingAction({ ingredientId: ingredient.id, type: 'discard' });
        try {
          await discardIngredient(householdId, ingredient.id, todayLocalDateString());
          setIngredients((current) => current.filter((item) => item.id !== ingredient.id));
          setTotalElements((current) => Math.max(0, current - 1));
        } catch (err) {
          setError(errorMessage(err, 'Nie udało się oznaczyć produktu jako wyrzuconego'));
        } finally {
          setPendingAction(null);
        }
      },
    });
  };

  const isActionPending = (ingredientId: string, type?: PendingAction['type']) =>
    pendingAction?.ingredientId === ingredientId &&
    (type === undefined || pendingAction.type === type);

  const countLabel = isLoading
    ? 'Ładowanie listy produktów…'
    : ingredientStatusCountLabel(statusFilter, totalElements);

  const actionButtons = (
    <View style={[styles.actionButtons, isWideWeb && styles.actionButtonsWide]}>
      <Pressable
        style={[
          formStyles.secondaryButton,
          styles.actionButton,
          isWideWeb ? styles.actionButtonCompact : styles.actionButtonFull,
          webPointer,
        ]}
        onPress={openBarcodeScan}
      >
        <Text style={formStyles.secondaryButtonText}>Skanuj kod</Text>
      </Pressable>

      <Pressable
        style={[
          formStyles.secondaryButton,
          styles.actionButton,
          isWideWeb ? styles.actionButtonCompact : styles.actionButtonFull,
          webPointer,
        ]}
        onPress={openBarcodeSearch}
      >
        <Text style={formStyles.secondaryButtonText}>Wpisz kod</Text>
      </Pressable>

      <Pressable
        style={[
          formStyles.primaryButton,
          styles.actionButton,
          isWideWeb ? styles.actionButtonCompact : styles.actionButtonFull,
          webPointer,
        ]}
        onPress={openCreateForm}
      >
        <View style={styles.addButtonContent}>
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={formStyles.primaryButtonText}>Dodaj produkt</Text>
        </View>
      </Pressable>
    </View>
  );

  const filterTabs = (
    <View style={[styles.filterRow, isWideWeb && styles.filterRowWide]}>
      {INGREDIENT_STATUS_FILTERS.map((status) => {
        const isActive = statusFilter === status;
        return (
          <Pressable
            key={status}
            style={[styles.filterChip, isActive && styles.filterChipActive, webPointer]}
            onPress={() => onFilterChange(status)}
          >
            <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
              {ingredientStatusFilterLabel(status)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={styles.panel}>
      {isStandalone ? (
        <View style={[styles.header, isWideWeb && styles.headerWide]}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Produkty</Text>
            <Text style={styles.lead}>{countLabel}</Text>
            <View style={styles.householdBadge}>
              <Text style={styles.householdBadgeLabel}>Lodówka</Text>
              <Text style={styles.householdBadgeName}>{householdName}</Text>
            </View>
          </View>
          {isWideWeb ? actionButtons : null}
        </View>
      ) : (
        <View style={[styles.embeddedHeader, isWideWeb && styles.embeddedHeaderWide]}>
          <Text style={styles.embeddedLead}>{countLabel}</Text>
          {isWideWeb ? actionButtons : null}
        </View>
      )}

      {!isStandalone && !isWideWeb ? actionButtons : null}
      {isStandalone && !isWideWeb ? actionButtons : null}

      {filterTabs}

      {statusFilter === 'PURCHASED' ? <DiscardInfoBanner /> : null}

      {error ? <Text style={formStyles.error}>{error}</Text> : null}

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : ingredients.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>
            Brak produktów ({ingredientStatusFilterLabel(statusFilter).toLowerCase()})
          </Text>
          <Text style={styles.empty}>
            {statusFilter === 'PURCHASED'
              ? 'Zacznij od dodania produktu z datą zakupu i terminem ważności.'
              : `Nie ma jeszcze produktów oznaczonych jako ${ingredientStatusFilterLabel(statusFilter).toLowerCase()}.`}
          </Text>
        </View>
      ) : (
        <View style={[styles.list, isWideWeb && styles.listWide]}>
          {ingredients.map((item) => {
            const status = getExpiryStatus(item.expiresAt);
            const showStatusActions = statusFilter === 'PURCHASED';
            const showExpiryBadge = shouldShowExpiryBadge(statusFilter);
            const quantityLabel = formatIngredientQuantity(item.quantity);

            return (
              <View key={item.id} style={[styles.listItem, isWideWeb && styles.listItemWide]}>
                <IngredientDeleteButton
                  onPress={() => onDelete(item)}
                  disabled={isActionPending(item.id)}
                  isLoading={isActionPending(item.id, 'delete')}
                />

                <Pressable
                  style={[styles.listItemMain, webPointer]}
                  onPress={() =>
                    navigation.navigate('IngredientDetail', {
                      householdId,
                      householdName,
                      ingredientId: item.id,
                      returnTo: isStandalone ? 'IngredientList' : 'HouseholdDetail',
                      allowStatusChange: showStatusActions,
                      ingredientStatusFilter: statusFilter,
                    })
                  }
                >
                  <View style={styles.listItemTopRow}>
                    {item.ingredientPicture ? (
                      <IngredientPhoto ingredientPicture={item.ingredientPicture} size={56} />
                    ) : null}
                    <View style={styles.listItemContent}>
                      <View style={styles.listItemHeader}>
                        <Text style={styles.listItemTitle} numberOfLines={2}>
                          {item.name}
                        </Text>
                        {showExpiryBadge ? (
                          <View
                            style={[
                              styles.statusBadge,
                              status === 'expired' && styles.statusExpired,
                              status === 'soon' && styles.statusSoon,
                            ]}
                          >
                            <Text style={styles.statusBadgeText}>{expiryStatusLabel(status)}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.listItemMeta} numberOfLines={1}>
                        Zakup: {formatLocalDate(item.purchasedAt)} · Ważny do:{' '}
                        {formatLocalDate(item.expiresAt)}
                        {quantityLabel ? ` · Ilość: ${quantityLabel}` : ''}
                      </Text>
                      <Text
                        style={[
                          styles.listItemNotes,
                          !item.notes && styles.listItemNotesEmpty,
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {item.notes ?? ''}
                      </Text>
                    </View>
                  </View>
                </Pressable>

                {showStatusActions ? (
                  <IngredientStatusButtons
                    onConsume={() => onConsume(item)}
                    onDiscard={() => onDiscard(item)}
                    isConsumePending={isActionPending(item.id, 'consume')}
                    isDiscardPending={isActionPending(item.id, 'discard')}
                    disabled={isActionPending(item.id)}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      {hasNext ? (
        <Pressable
          style={[formStyles.secondaryButton, styles.loadMoreButton, webPointer]}
          onPress={() => void loadPage(page + 1, true, statusFilter)}
          disabled={isLoadingMore}
        >
          {isLoadingMore ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={formStyles.secondaryButtonText}>Załaduj więcej</Text>
          )}
        </Pressable>
      ) : null}

      <ConfirmDialog
        visible={confirmRequest !== null}
        title={confirmRequest?.title ?? ''}
        message={confirmRequest?.message ?? ''}
        confirmLabel={confirmRequest?.confirmLabel}
        variant={confirmRequest?.variant}
        isLoading={isConfirmLoading}
        onConfirm={() => void handleConfirm()}
        onCancel={closeConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignSelf: 'stretch',
    width: '100%',
  },
  header: {
    gap: 16,
    marginBottom: 20,
  },
  headerWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  lead: {
    color: colors.textMuted,
    lineHeight: 22,
    fontSize: 15,
  },
  embeddedHeader: {
    marginBottom: 16,
    gap: 12,
  },
  embeddedHeaderWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  embeddedLead: {
    color: colors.textMuted,
    lineHeight: 22,
    fontSize: 15,
    flex: 1,
  },
  householdBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F7F4',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
  },
  householdBadgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  householdBadgeName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterRowWide: {
    marginBottom: 20,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FAFCFA',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  infoBanner: {
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: '#B8D4F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 6,
  },
  infoBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A4D8F',
  },
  infoBannerText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#2C5282',
  },
  actionButtons: {
    gap: 10,
    width: '100%',
    marginBottom: 16,
  },
  actionButtonsWide: {
    width: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    marginLeft: 32,
    marginBottom: 0,
  },
  actionButton: {
    justifyContent: 'center',
  },
  actionButtonFull: {
    width: '100%',
  },
  actionButtonCompact: {
    minWidth: 160,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  loader: {
    marginVertical: 24,
  },
  emptyState: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: '#FAFCFA',
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  list: {
    gap: 12,
    width: '100%',
  },
  listWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    gap: 16,
  },
  listItem: {
    position: 'relative',
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: '#FAFCFA',
    overflow: 'hidden',
  },
  listItemWide: {
    width: 400,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 400,
    maxWidth: 400,
    minWidth: 0,
    alignSelf: 'stretch',
  },
  listItemMain: {
    flexGrow: 1,
    padding: 16,
    paddingRight: 44,
  },
  listItemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  listItemContent: {
    flex: 1,
    minWidth: 0,
  },
  listItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  listItemTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    backgroundColor: '#E8F5EE',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusSoon: {
    backgroundColor: '#FFF4E5',
  },
  statusExpired: {
    backgroundColor: colors.dangerBg,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  listItemMeta: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textMuted,
  },
  listItemNotes: {
    marginTop: 8,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    height: 18,
  },
  listItemNotesEmpty: {
    color: 'transparent',
  },
  loadMoreButton: {
    marginTop: 16,
    width: '100%',
  },
});
