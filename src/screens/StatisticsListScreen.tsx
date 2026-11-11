import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {
  fetchIngredientStatistics,
  fetchInterPurchaseStatistics,
  fetchProductStatusStatistics,
  Granularity,
  IngredientNameCount,
  InterPurchaseInterval,
} from '../api/statistics';
import { ApiError } from '../api/client';
import { AppChrome } from '../components/AppChrome';
import { AppPageFrame } from '../components/AppPageFrame';
import { DatePickerField } from '../components/DatePickerField';
import { FormTextInput } from '../components/FormTextInput';
import { ScreenShell } from '../components/ScreenShell';
import {
  HouseholdDetailTab,
} from '../household/HouseholdDetailTabBar';
import { HouseholdSectionsLayout } from '../household/HouseholdSectionsLayout';
import { useMobilePageInsets } from '../hooks/useMobilePageInsets';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { isValidLocalDateInput, formatLocalDate } from '../ingredient/ingredientFormat';
import { resetToHouseholdDetail } from '../navigation/navigationHelpers';
import { AppStackParamList, HouseholdStackParamList } from '../navigation/types';
import {
  buildInterPurchaseFilterKey,
  buildStatusFilterKey,
  formatInterPurchaseInterval,
  parseStatusLimitInput,
  getStatisticsModuleOptions,
  statisticsModuleDescription,
  statisticsModuleLabel,
  statisticsModuleToStatus,
  StatisticsModule,
} from '../statistics/productStatusUtils';
import {
  aggregateProductTotals,
  DateRange,
  ProductTotal,
  validateDateRange,
} from '../statistics/statisticsUtils';
import {
  getStatisticsListState,
  saveStatisticsListState,
} from '../statistics/statisticsListState';
import { colors } from '../theme/colors';
import { useI18n } from '../i18n/I18nContext';
import { formStyles, webPointer } from '../theme/forms';

const STATISTICS_PAGE_WIDTH = 880;
const STATISTICS_VALUE_COLUMN_WIDTH = 132;
/** Suma zakupów na liście nie zależy od rozbicia wykresu - szczegółowy typ statystyk jest na ekranie wykresu. */
const PURCHASES_LIST_GRANULARITY: Granularity = 'MONTH';

type Props =
  | NativeStackScreenProps<HouseholdStackParamList, 'StatisticsList'>
  | NativeStackScreenProps<AppStackParamList, 'StatisticsList'>;

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function StatisticsListScreen({ navigation, route }: Props) {
  const { t, intlLocale } = useI18n();
  const { householdId, householdName } = route.params;
  const appNavigation = navigation as NativeStackNavigationProp<AppStackParamList>;
  const { isWideWeb } = useResponsiveLayout();
  const { pagePaddingTop } = useMobilePageInsets();
  const isNativeMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  const initialState = getStatisticsListState(householdId);

  const onSectionChange = (tab: HouseholdDetailTab) => {
    if (tab === 'statistics') {
      return;
    }
    if (tab === 'shoppingLists') {
      appNavigation.navigate('ShoppingLists', { householdId, householdName });
      return;
    }
    resetToHouseholdDetail(navigation, {
      householdId,
      section: tab === 'settings' ? 'settings' : 'products',
    });
  };

  const [activeModule, setActiveModule] = useState<StatisticsModule>(
    initialState.activeModule ?? 'purchases',
  );
  const [dateRange, setDateRange] = useState<DateRange>(initialState.dateRange);
  const [draftDateRange, setDraftDateRange] = useState<DateRange>(initialState.dateRange);
  const [useFullRange, setUseFullRange] = useState(initialState.useFullRange ?? false);
  const [firstDate, setFirstDate] = useState<string | null>(initialState.firstDate ?? null);
  const [statusLimit, setStatusLimit] = useState<number | null>(initialState.statusLimit ?? null);
  const [draftStatusLimit, setDraftStatusLimit] = useState(
    initialState.statusLimit != null ? String(initialState.statusLimit) : '',
  );
  const [products, setProducts] = useState<ProductTotal[]>(initialState.products);
  const [statusProducts, setStatusProducts] = useState<IngredientNameCount[]>(
    initialState.statusProducts ?? [],
  );
  const [interPurchaseProducts, setInterPurchaseProducts] = useState<InterPurchaseInterval[]>(
    initialState.interPurchaseProducts ?? [],
  );
  const [isLoading, setIsLoading] = useState(!initialState.hasLoaded);
  const [error, setError] = useState<string | null>(null);

  const isPurchasesModule = activeModule === 'purchases';
  const isInterPurchaseModule = activeModule === 'interPurchase';
  const isStatusModule = !isPurchasesModule && !isInterPurchaseModule;
  const activeStatus = statisticsModuleToStatus(activeModule);

  const purchasesFilterKey = useMemo(() => {
    if (useFullRange) {
      return `full|${PURCHASES_LIST_GRANULARITY}`;
    }
    return `${dateRange.from}|${dateRange.to}|${PURCHASES_LIST_GRANULARITY}`;
  }, [dateRange, useFullRange]);

  const statusFilterKey = useMemo(() => {
    if (!activeStatus) {
      return null;
    }
    return buildStatusFilterKey({
      module: activeModule,
      status: activeStatus,
      useFullRange,
      dateRange,
      limit: statusLimit,
    });
  }, [activeModule, activeStatus, dateRange, statusLimit, useFullRange]);

  const interPurchaseFilterKey = useMemo(() => {
    if (!isInterPurchaseModule) {
      return null;
    }
    return buildInterPurchaseFilterKey({ useFullRange, dateRange });
  }, [dateRange, isInterPurchaseModule, useFullRange]);

  const activeFilterKey = isPurchasesModule
    ? purchasesFilterKey
    : isInterPurchaseModule
      ? interPurchaseFilterKey
      : statusFilterKey;

  const persistState = useCallback(
    (patch: Partial<ReturnType<typeof getStatisticsListState>>) => {
      saveStatisticsListState(householdId, patch);
    },
    [householdId],
  );

  const resolveFirstDateIfNeeded = useCallback(async () => {
    if (!useFullRange || firstDate) {
      return firstDate;
    }

    const meta = await fetchIngredientStatistics({
      householdId,
      granularity: 'MONTH',
      useFullRange: true,
    });
    setFirstDate(meta.firstDate);
    persistState({ firstDate: meta.firstDate });
    return meta.firstDate;
  }, [firstDate, householdId, persistState, useFullRange]);

  const loadPurchases = useCallback(async () => {
    const result = await fetchIngredientStatistics({
      householdId,
      granularity: PURCHASES_LIST_GRANULARITY,
      useFullRange,
      ...(useFullRange
        ? {}
        : {
            startTime: dateRange.from,
            endTime: dateRange.to,
          }),
    });
    const nextProducts = aggregateProductTotals(result.data, intlLocale);
    const nextFirstDate = useFullRange ? result.firstDate : null;

    setProducts(nextProducts);
    setFirstDate(nextFirstDate);
    persistState({
      activeModule,
      dateRange,
      useFullRange,
      firstDate: nextFirstDate,
      products: nextProducts,
      hasLoaded: true,
      productsFilterKey: purchasesFilterKey,
    });
  }, [
    activeModule,
    dateRange,
    householdId,
    persistState,
    purchasesFilterKey,
    useFullRange,
  ]);

  const loadStatus = useCallback(async () => {
    if (!activeStatus) {
      return;
    }

    await resolveFirstDateIfNeeded();

    const items = await fetchProductStatusStatistics({
      householdId,
      status: activeStatus,
      useFullRange,
      ...(useFullRange
        ? {}
        : {
            startTime: dateRange.from,
            endTime: dateRange.to,
          }),
      ...(statusLimit != null ? { limit: statusLimit } : {}),
    });

    setStatusProducts(items);
    persistState({
      activeModule,
      dateRange,
      useFullRange,
      statusLimit,
      statusProducts: items,
      hasLoaded: true,
      statusFilterKey: statusFilterKey ?? undefined,
    });
  }, [
    activeModule,
    activeStatus,
    dateRange,
    householdId,
    persistState,
    resolveFirstDateIfNeeded,
    statusFilterKey,
    statusLimit,
    useFullRange,
  ]);

  const loadInterPurchase = useCallback(async () => {
    await resolveFirstDateIfNeeded();

    const items = await fetchInterPurchaseStatistics({
      householdId,
      useFullRange,
      ...(useFullRange
        ? {}
        : {
            startTime: dateRange.from,
            endTime: dateRange.to,
          }),
    });

    setInterPurchaseProducts(items);
    persistState({
      activeModule,
      dateRange,
      useFullRange,
      interPurchaseProducts: items,
      hasLoaded: true,
      interPurchaseFilterKey: interPurchaseFilterKey ?? undefined,
    });
  }, [
    activeModule,
    dateRange,
    householdId,
    interPurchaseFilterKey,
    persistState,
    resolveFirstDateIfNeeded,
    useFullRange,
  ]);

  const load = useCallback(async () => {
    if (!useFullRange) {
      const validationError = validateDateRange(dateRange, t);
      if (validationError) {
        setError(validationError);
        setProducts([]);
        setStatusProducts([]);
        setInterPurchaseProducts([]);
        setIsLoading(false);
        return;
      }
    }

    setError(null);
    setIsLoading(true);

    try {
      if (isPurchasesModule) {
        await loadPurchases();
      } else if (isInterPurchaseModule) {
        await loadInterPurchase();
      } else {
        await loadStatus();
      }
    } catch (err) {
      setError(
        errorMessage(
          err,
          isPurchasesModule
            ? t('statistics.fetchFailed')
            : isInterPurchaseModule
              ? t('statistics.fetchInterPurchaseFailed')
              : t('statistics.fetchStatusFailed'),
        ),
      );
      setProducts([]);
      setStatusProducts([]);
      setInterPurchaseProducts([]);
      persistState({
        products: [],
        statusProducts: [],
        interPurchaseProducts: [],
        hasLoaded: true,
        productsFilterKey: purchasesFilterKey,
        statusFilterKey: statusFilterKey ?? undefined,
        interPurchaseFilterKey: interPurchaseFilterKey ?? undefined,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    dateRange,
    isInterPurchaseModule,
    isPurchasesModule,
    interPurchaseFilterKey,
    loadInterPurchase,
    loadPurchases,
    loadStatus,
    persistState,
    purchasesFilterKey,
    statusFilterKey,
    useFullRange,
  ]);

  useEffect(() => {
    const cached = getStatisticsListState(householdId);
    const cachedFilterKey = isPurchasesModule
      ? cached.productsFilterKey
      : isInterPurchaseModule
        ? cached.interPurchaseFilterKey
        : cached.statusFilterKey;

    if (cached.hasLoaded && cachedFilterKey === activeFilterKey) {
      setProducts(cached.products);
      setStatusProducts(cached.statusProducts ?? []);
      setInterPurchaseProducts(cached.interPurchaseProducts ?? []);
      setFirstDate(cached.firstDate ?? null);
      setIsLoading(false);
      return;
    }

    void load();
  }, [activeFilterKey, householdId, isInterPurchaseModule, isPurchasesModule, load]);

  const tryApplyDateRange = useCallback(
    (next: DateRange) => {
      if (!isValidLocalDateInput(next.from) || !isValidLocalDateInput(next.to)) {
        return;
      }

      const validationError = validateDateRange(next, t);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setUseFullRange(false);
      setDateRange(next);
      persistState({ dateRange: next, useFullRange: false });
    },
    [persistState],
  );

  const handleDraftDateChange = (field: 'from' | 'to', value: string) => {
    setDraftDateRange((current) => {
      const next = { ...current, [field]: value };
      tryApplyDateRange(next);
      return next;
    });
  };

  const handleDraftDateBlur = () => {
    setDraftDateRange((current) => {
      tryApplyDateRange(current);
      return current;
    });
  };

  const toggleFullRange = () => {
    setError(null);
    setUseFullRange((current) => {
      const next = !current;
      if (!next) {
        setFirstDate(null);
        persistState({ useFullRange: next, firstDate: null });
        return next;
      }
      persistState({ useFullRange: next });
      return next;
    });
  };

  const applyStatusLimit = (value: string) => {
    const parsed = parseStatusLimitInput(value);
    setStatusLimit(parsed);
    persistState({ statusLimit: parsed });
  };

  const handleStatusLimitBlur = () => {
    applyStatusLimit(draftStatusLimit);
  };

  const changeModule = (module: StatisticsModule) => {
    setActiveModule(module);
    persistState({ activeModule: module });
  };

  const displayedFromDate =
    useFullRange && firstDate ? firstDate : draftDateRange.from;

  const openProductChart = (ingredientName: string) => {
    const savedGranularity =
      getStatisticsListState(householdId).granularity ?? ('MONTH' as Granularity);
    appNavigation.navigate('StatisticsChart', {
      householdId,
      householdName,
      ingredientName,
      granularity: savedGranularity,
      useFullRange,
      ...(useFullRange
        ? {}
        : {
            startTime: dateRange.from,
            endTime: dateRange.to,
          }),
    });
  };

  const listItems = isPurchasesModule
    ? products
    : isInterPurchaseModule
      ? interPurchaseProducts
      : statusProducts;
  const countColumnLabel = isPurchasesModule
    ? t('statistics.modulePurchases')
    : isInterPurchaseModule
      ? t('statistics.columnInterval')
      : t('statistics.columnQuantity');
  const moduleDescription = isPurchasesModule
    ? useFullRange
      ? t('statistics.purchasesLeadFull')
      : t('statistics.purchasesLeadRange')
    : statisticsModuleDescription(activeModule, t);

  const formatInterPurchaseDateRange = (item: InterPurchaseInterval): string =>
    `${formatLocalDate(item.firstPurchaseDate, intlLocale)} – ${formatLocalDate(item.lastPurchaseDate, intlLocale)}`;

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
        <AppPageFrame style={isWideWeb ? styles.frameWide : undefined}>
          <HouseholdSectionsLayout activeTab="statistics" onChange={onSectionChange}>
            <View style={styles.centeredContent}>
          <View style={[styles.header, isWideWeb && styles.headerWide]}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{t('nav.tabStatisticsShort')}</Text>
              <Text style={styles.lead}>{moduleDescription}</Text>
              <View style={styles.householdBadge}>
                <Text style={styles.householdBadgeLabel}>{t('common.fridge')}</Text>
                <Text style={styles.householdBadgeName}>{householdName}</Text>
              </View>
            </View>
          </View>

          <View style={styles.moduleSection}>
            <Text style={formStyles.label}>{t('statistics.moduleLabel')}</Text>
            <View style={[styles.moduleRow, isWideWeb && styles.moduleRowWide]}>
              {getStatisticsModuleOptions(t).map((option) => {
                const isActive = activeModule === option.id;
                return (
                  <Pressable
                    key={option.id}
                    style={[styles.moduleChip, isActive && styles.moduleChipActive, webPointer]}
                    onPress={() => changeModule(option.id)}
                    disabled={isLoading}
                  >
                    <Text
                      style={[styles.moduleChipText, isActive && styles.moduleChipTextActive]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={[styles.filters, isWideWeb && styles.filtersWide]}>
            <View style={styles.dateField}>
              <Text style={formStyles.label}>Od</Text>
              <DatePickerField
                value={displayedFromDate}
                onChange={(value) => handleDraftDateChange('from', value)}
                onBlur={handleDraftDateBlur}
                editable={!isLoading && !useFullRange}
              />
            </View>
            <View style={styles.dateField}>
              <Text style={formStyles.label}>Do</Text>
              <DatePickerField
                value={draftDateRange.to}
                onChange={(value) => handleDraftDateChange('to', value)}
                onBlur={handleDraftDateBlur}
                editable={!isLoading && !useFullRange}
              />
            </View>
            <Pressable
              style={[
                formStyles.secondaryButton,
                styles.fullRangeButton,
                useFullRange && styles.fullRangeButtonActive,
                webPointer,
              ]}
              onPress={toggleFullRange}
              disabled={isLoading}
            >
              <Text
                style={[
                  formStyles.secondaryButtonText,
                  useFullRange && styles.fullRangeButtonTextActive,
                ]}
              >
                {t('statistics.fullTimeRange')}
              </Text>
            </Pressable>
          </View>

          {isStatusModule ? (
            <View style={styles.limitSection}>
              <Text style={formStyles.label}>{t('statistics.resultsLimit')}</Text>
              <FormTextInput
                value={draftStatusLimit}
                onChangeText={setDraftStatusLimit}
                onBlur={handleStatusLimitBlur}
                editable={!isLoading}
                placeholder={t('statistics.resultsLimitPlaceholder')}
                keyboardType="number-pad"
                style={styles.limitInput}
              />
              <Text style={styles.limitHint}>
                {t('statistics.resultsLimitHint')}
              </Text>
            </View>
          ) : null}

          {error ? <Text style={formStyles.error}>{error}</Text> : null}

          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : listItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{t('statistics.emptyDataTitle')}</Text>
              <Text style={styles.emptyText}>
                {isPurchasesModule
                  ? useFullRange
                    ? t('statistics.empty')
                    : t('statistics.emptyRange')
                  : isInterPurchaseModule
                    ? useFullRange
                      ? t('statistics.emptyInterPurchaseFull')
                      : t('statistics.emptyInterPurchaseRange')
                    : useFullRange
                      ? t('statistics.emptyStatusFull', {
                          filter: statisticsModuleLabel(activeModule, t).toLowerCase(),
                        })
                      : t('statistics.emptyStatusRange', {
                          filter: statisticsModuleLabel(activeModule, t).toLowerCase(),
                        })}
              </Text>
            </View>
          ) : (
            <View style={styles.listSection}>
              <View style={styles.list}>
                <View style={[styles.listHeader, isWideWeb && styles.listHeaderWide]}>
                  <Text style={[styles.listHeaderCell, styles.nameCell]}>Produkt</Text>
                  <Text style={[styles.listHeaderCell, styles.valueCell]}>{countColumnLabel}</Text>
                </View>
                {isPurchasesModule
                  ? products.map((product) => (
                      <Pressable
                        key={product.name}
                        style={[styles.listRow, isWideWeb && styles.listRowWide, webPointer]}
                        onPress={() => openProductChart(product.name)}
                      >
                        <Text style={[styles.productName, styles.nameCell]} numberOfLines={2}>
                          {product.name}
                        </Text>
                        <Text style={[styles.productCount, styles.valueCell]}>
                          {product.totalCount}
                        </Text>
                      </Pressable>
                    ))
                  : isInterPurchaseModule
                    ? interPurchaseProducts.map((product) => (
                        <View
                          key={product.ingredientName}
                          style={[styles.listRow, isWideWeb && styles.listRowWide]}
                        >
                          <View style={styles.nameCell}>
                            <Text style={styles.statusProductName} numberOfLines={2}>
                              {product.ingredientName}
                            </Text>
                            <Text style={styles.purchaseDates}>
                              {formatInterPurchaseDateRange(product)}
                            </Text>
                          </View>
                          <Text style={[styles.intervalText, styles.valueCell]} numberOfLines={2}>
                            {formatInterPurchaseInterval(product.interval, t)}
                          </Text>
                        </View>
                      ))
                    : statusProducts.map((product) => (
                        <View
                          key={product.ingredientName}
                          style={[styles.listRow, isWideWeb && styles.listRowWide]}
                        >
                          <Text style={[styles.statusProductName, styles.nameCell]} numberOfLines={2}>
                            {product.ingredientName}
                          </Text>
                          <Text style={[styles.productCount, styles.valueCell]}>{product.count}</Text>
                        </View>
                      ))}
              </View>
            </View>
          )}
            </View>
          </HouseholdSectionsLayout>
        </AppPageFrame>
      </ScreenShell>
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    maxWidth: 1120,
  },
  shellWide: {
    maxWidth: 1120,
  },
  centeredContent: {
    alignSelf: 'center',
    maxWidth: STATISTICS_PAGE_WIDTH,
    width: '100%',
  },
  frameWide: {
    gap: 0,
  },
  backLink: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  header: {
    marginBottom: 20,
  },
  headerWide: {
    marginBottom: 24,
  },
  headerText: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  lead: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
  },
  householdBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#E8F5EE',
  },
  householdBadgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  householdBadgeName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  moduleSection: {
    marginBottom: 20,
    gap: 8,
  },
  moduleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moduleRowWide: {
    gap: 10,
  },
  moduleChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FAFCFA',
  },
  moduleChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  moduleChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  moduleChipTextActive: {
    color: '#fff',
  },
  filters: {
    marginBottom: 20,
    gap: 4,
  },
  filtersWide: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  dateField: {
    flex: 1,
    minWidth: 140,
  },
  fullRangeButton: {
    marginBottom: 14,
    minWidth: 180,
  },
  fullRangeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  fullRangeButtonTextActive: {
    color: '#fff',
  },
  granularitySection: {
    marginBottom: 20,
    gap: 8,
  },
  limitSection: {
    marginBottom: 20,
    gap: 6,
  },
  limitInput: {
    marginBottom: 0,
  },
  limitHint: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  granularityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  granularityRowWide: {
    gap: 10,
  },
  granularityChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FAFCFA',
    minWidth: 148,
  },
  granularityChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  granularityChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  granularityChipTextActive: {
    color: '#fff',
  },
  granularityChipHint: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
  },
  granularityChipHintActive: {
    color: 'rgba(255,255,255,0.9)',
  },
  loader: {
    marginTop: 24,
  },
  emptyState: {
    marginTop: 8,
    width: '100%',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FAFCFA',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  listSection: {
    width: '100%',
    alignSelf: 'stretch',
  },
  list: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F0F5F2',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listHeaderWide: {
    paddingHorizontal: 20,
  },
  listHeaderCell: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    flexShrink: 0,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listRowWide: {
    paddingHorizontal: 20,
  },
  nameCell: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  valueCell: {
    width: STATISTICS_VALUE_COLUMN_WIDTH,
    flexShrink: 0,
    flexGrow: 0,
    textAlign: 'right',
  },
  productName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  statusProductName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  purchaseDates: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  productCount: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'right',
  },
  intervalText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
    color: colors.text,
    textAlign: 'right',
  },
});
