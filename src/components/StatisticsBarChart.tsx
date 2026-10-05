import React, { useMemo, useState } from 'react';
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Granularity } from '../api/statistics';
import { formatPeriodLabel } from '../statistics/statisticsUtils';
import { colors } from '../theme/colors';
import { webPointer } from '../theme/forms';

export type ChartPoint = {
  key: string;
  count: number;
  periodStart: string;
  periodEnd: string | null;
  label: string;
};

type Props = {
  points: ChartPoint[];
  granularity: Granularity;
};

const CHART_HEIGHT = 220;
const TOOLTIP_AREA_HEIGHT = 50;
const LABEL_AREA_HEIGHT = 48;
const PLOT_HEIGHT = TOOLTIP_AREA_HEIGHT + CHART_HEIGHT + LABEL_AREA_HEIGHT;
const BAR_COLUMN_WIDTH = 88;
const BAR_WIDTH = 36;

export function StatisticsBarChart({ points, granularity }: Props) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const isNativeMobile = Platform.OS === 'ios' || Platform.OS === 'android';

  const maxCount = useMemo(
    () => Math.max(1, ...points.map((point) => point.count)),
    [points],
  );

  const plotWidth = points.length * BAR_COLUMN_WIDTH;
  const needsScroll = viewportWidth > 0 && plotWidth > viewportWidth;
  const scrollContentWidth = needsScroll ? plotWidth : Math.max(plotWidth, viewportWidth);

  const activeKey = isNativeMobile ? selectedKey : hoveredKey;
  const activePoint = points.find((point) => point.key === activeKey) ?? null;

  const onChartAreaLayout = (event: LayoutChangeEvent) => {
    setViewportWidth(event.nativeEvent.layout.width);
  };

  if (points.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyChartText}>Brak zakupów w wybranym okresie.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.yAxis}>
        <Text style={styles.yAxisLabel}>{maxCount}</Text>
        <Text style={styles.yAxisLabel}>{Math.ceil(maxCount / 2)}</Text>
        <Text style={styles.yAxisLabel}>0</Text>
      </View>

      <View style={styles.chartArea} onLayout={onChartAreaLayout}>
        <ScrollView
          horizontal
          scrollEnabled={needsScroll}
          showsHorizontalScrollIndicator={needsScroll && !isNativeMobile}
          contentContainerStyle={[
            styles.scrollContent,
            {
              width: scrollContentWidth,
              justifyContent: needsScroll ? 'flex-start' : 'center',
            },
          ]}
        >
          <View style={[styles.plot, { width: plotWidth }]}>
            <View style={styles.gridLines}>
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />
            </View>

            <View style={styles.barsRow}>
              {points.map((point) => {
                const height = Math.max(6, (point.count / maxCount) * (CHART_HEIGHT - 24));
                const isActive = activeKey === point.key;

                return (
                  <View key={point.key} style={styles.barColumn}>
                    <Pressable
                      onPress={() => {
                        if (!isNativeMobile) {
                          return;
                        }
                        setSelectedKey((current) => (current === point.key ? null : point.key));
                      }}
                      onHoverIn={() => {
                        if (isNativeMobile) {
                          return;
                        }
                        setHoveredKey(point.key);
                      }}
                      onHoverOut={() => {
                        if (isNativeMobile) {
                          return;
                        }
                        setHoveredKey(null);
                      }}
                      style={[styles.barPressable, webPointer]}
                      accessibilityRole="button"
                      accessibilityLabel={`${point.label}: ${point.count}`}
                    >
                      {isActive ? (
                        <View style={styles.tooltip}>
                          <Text style={styles.tooltipCount}>{point.count}</Text>
                          <Text style={styles.tooltipPeriod} numberOfLines={2}>
                            {formatPeriodLabel(point.periodStart, point.periodEnd, granularity)}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.tooltipSpacer} />
                      )}

                      <View
                        style={[
                          styles.bar,
                          { height },
                          isActive && styles.barActive,
                        ]}
                      />

                      <Text style={styles.xLabel} numberOfLines={2}>
                        {point.label}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {isNativeMobile && activePoint ? (
          <View style={styles.mobileDetail}>
            <Text style={styles.mobileDetailCount}>{activePoint.count}</Text>
            <Text style={styles.mobileDetailLabel}>
              {formatPeriodLabel(activePoint.periodStart, activePoint.periodEnd, granularity)}
            </Text>
            <Text style={styles.mobileDetailHint}>Dotknij słupka ponownie, aby ukryć</Text>
          </View>
        ) : null}

        {!isNativeMobile ? (
          <Text style={styles.hint}>Najedź kursorem na słupek, aby zobaczyć szczegóły</Text>
        ) : points.length > 0 && !activePoint ? (
          <Text style={styles.hint}>Dotknij słupka, aby zobaczyć liczbę zakupów</Text>
        ) : null}

        {needsScroll ? (
          <Text style={styles.scrollHint}>Przewiń w poziomie, aby zobaczyć cały wykres</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'center',
    width: '100%',
    maxWidth: '100%',
  },
  yAxis: {
    width: 28,
    height: PLOT_HEIGHT,
    justifyContent: 'space-between',
    paddingTop: TOOLTIP_AREA_HEIGHT,
    paddingBottom: LABEL_AREA_HEIGHT,
  },
  yAxisLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 4,
    alignItems: 'flex-end',
  },
  plot: {
    height: PLOT_HEIGHT,
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: TOOLTIP_AREA_HEIGHT,
    height: CHART_HEIGHT - 24,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: colors.border,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: PLOT_HEIGHT,
    paddingTop: TOOLTIP_AREA_HEIGHT,
  },
  barColumn: {
    width: BAR_COLUMN_WIDTH,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barPressable: {
    width: BAR_COLUMN_WIDTH,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  tooltipSpacer: {
    height: 44,
    marginBottom: 6,
  },
  tooltip: {
    minHeight: 44,
    marginBottom: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: BAR_COLUMN_WIDTH + 16,
  },
  tooltipCount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  tooltipPeriod: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },
  barActive: {
    backgroundColor: colors.primary,
  },
  xLabel: {
    marginTop: 10,
    width: BAR_COLUMN_WIDTH - 8,
    fontSize: 10,
    lineHeight: 14,
    color: colors.textMuted,
    textAlign: 'center',
    minHeight: LABEL_AREA_HEIGHT - 10,
  },
  mobileDetail: {
    marginTop: 12,
    width: '100%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FAFCFA',
    alignItems: 'center',
  },
  mobileDetailCount: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  mobileDetailLabel: {
    marginTop: 4,
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  mobileDetailHint: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textMuted,
  },
  hint: {
    marginTop: 10,
    width: '100%',
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  scrollHint: {
    marginTop: 4,
    width: '100%',
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyChart: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: '#FAFCFA',
    alignSelf: 'center',
    width: '100%',
  },
  emptyChartText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
