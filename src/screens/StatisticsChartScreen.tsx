import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { fetchIngredientStatistics, Granularity, IngredientStats } from '../api/statistics';
import { ApiError } from '../api/client';
import { AppChrome } from '../components/AppChrome';
import { AppPageFrame } from '../components/AppPageFrame';
import { ChartPoint, StatisticsBarChart } from '../components/StatisticsBarChart';
import { ScreenBackButton } from '../components/ScreenBackButton';
import { ScreenShell } from '../components/ScreenShell';
import { formatLocalDate, todayLocalDateString } from '../ingredient/ingredientFormat';
import { useMobilePageInsets } from '../hooks/useMobilePageInsets';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { AppStackParamList, HouseholdStackParamList } from '../navigation/types';
import {
  formatPeriodLabel,
  GRANULARITY_OPTIONS,
  granularityDescription,
  sortTimeSeries,
} from '../statistics/statisticsUtils';
import { saveStatisticsListState } from '../statistics/statisticsListState';
import { colors } from '../theme/colors';
import { formStyles, webPointer } from '../theme/forms';

type Props =
  | NativeStackScreenProps<HouseholdStackParamList, 'StatisticsChart'>
  | NativeStackScreenProps<AppStackParamList, 'StatisticsChart'>;

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function StatisticsChartScreen({ navigation, route }: Props) {
  const {
    householdId,
    ingredientName,
    startTime,
    endTime,
    granularity: initialGranularity,
    useFullRange = false,
  } = route.params;
  const { isWideWeb } = useResponsiveLayout();
  const { pagePaddingTop } = useMobilePageInsets();
  const isNativeMobile = Platform.OS === 'ios' || Platform.OS === 'android';

  const [granularity, setGranularity] = useState<Granularity>(initialGranularity);
  const [entries, setEntries] = useState<IngredientStats[]>([]);
  const [firstDate, setFirstDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await fetchIngredientStatistics({
        householdId,
        granularity,
        ingredientName,
        useFullRange,
        ...(useFullRange || !startTime || !endTime
          ? {}
          : {
              startTime,
              endTime,
            }),
      });
      setEntries(sortTimeSeries(result.data));
      setFirstDate(result.firstDate);
    } catch (err) {
      setError(errorMessage(err, 'Nie udało się pobrać wykresu'));
      setEntries([]);
      setFirstDate(null);
    } finally {
      setIsLoading(false);
    }
  }, [granularity, householdId, ingredientName, startTime, endTime, useFullRange]);

  const changeGranularity = (next: Granularity) => {
    setGranularity(next);
    saveStatisticsListState(householdId, { granularity: next });
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const chartPoints = useMemo<ChartPoint[]>(
    () =>
      entries.map((entry) => ({
        key: entry.periodStart,
        count: entry.count,
        periodStart: entry.periodStart,
        periodEnd: entry.periodEnd,
        label: formatPeriodLabel(entry.periodStart, entry.periodEnd, granularity),
      })),
    [entries, granularity],
  );

  const totalPurchases = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.count, 0),
    [entries],
  );

  const periodLabel = useMemo(() => {
    if (useFullRange) {
      if (firstDate) {
        return `Wykres zakupów w okresie ${formatLocalDate(firstDate)} – ${formatLocalDate(todayLocalDateString())}`;
      }
      return 'Wykres zakupów za cały dostępny okres';
    }

    if (startTime && endTime) {
      return `Wykres zakupów w okresie ${formatLocalDate(startTime)} – ${formatLocalDate(endTime)}`;
    }

    return 'Wykres zakupów';
  }, [endTime, firstDate, startTime, useFullRange]);

  return (
    <AppChrome navigation={navigation} activeRoute="Households" scroll>
      <ScreenShell
        variant="app"
        card={false}
        alignTop
        contentStyle={[
          styles.shell,
          isWideWeb && styles.shellWide,
          isNativeMobile && { paddingTop: pagePaddingTop },
        ]}
      >
        <AppPageFrame style={isWideWeb ? styles.frameWide : undefined}>
          <ScreenBackButton
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          />

          <View style={styles.header}>
            <Text style={styles.title}>{ingredientName}</Text>
            <Text style={styles.lead}>{periodLabel}</Text>
            <Text style={styles.meta}>
              {granularityDescription(granularity)} · Łącznie {totalPurchases}{' '}
              {totalPurchases === 1 ? 'zakup' : totalPurchases < 5 ? 'zakupy' : 'zakupów'}
            </Text>
          </View>

          <View style={styles.granularitySection}>
            <Text style={formStyles.label}>Typ statystyk</Text>
            <View style={[styles.granularityRow, isWideWeb && styles.granularityRowWide]}>
              {GRANULARITY_OPTIONS.map((option) => {
                const isActive = granularity === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.granularityChip,
                      isActive && styles.granularityChipActive,
                      webPointer,
                    ]}
                    onPress={() => changeGranularity(option.value)}
                    disabled={isLoading}
                  >
                    <Text
                      style={[
                        styles.granularityChipText,
                        isActive && styles.granularityChipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        styles.granularityChipHint,
                        isActive && styles.granularityChipHintActive,
                      ]}
                    >
                      {option.hint}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {error ? <Text style={formStyles.error}>{error}</Text> : null}

          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <View style={styles.chartCard}>
              <Text style={styles.axisTitle}>Ilość zakupów w czasie</Text>
              <StatisticsBarChart points={chartPoints} granularity={granularity} />
            </View>
          )}
        </AppPageFrame>
      </ScreenShell>
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    maxWidth: 880,
  },
  shellWide: {
    maxWidth: 1120,
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
    gap: 6,
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
  meta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  granularitySection: {
    marginBottom: 20,
    gap: 8,
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
  chartCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    width: '100%',
  },
  axisTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    alignSelf: 'flex-start',
    width: '100%',
  },
});
