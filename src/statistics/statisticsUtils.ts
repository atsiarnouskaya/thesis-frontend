import { Granularity, IngredientStats } from '../api/statistics';
import { TranslationValues } from '../i18n/types';
import { dateToLocalDateString, parseLocalDateToDate, todayLocalDateString } from '../ingredient/ingredientFormat';

type TranslateFn = (key: string, values?: TranslationValues) => string;

export type ProductTotal = {
  name: string;
  totalCount: number;
};

export type DateRange = {
  from: string;
  to: string;
};

export function getGranularityOptions(t: TranslateFn): { value: Granularity; label: string; hint: string }[] {
  return [
    { value: 'MONTH', label: t('statistics.granularityMonthly'), hint: t('statistics.granularityMonthHint') },
    { value: 'YEAR', label: t('statistics.granularityYearly'), hint: t('statistics.granularityYearHint') },
  ];
}

export function createDefaultDateRange(): DateRange {
  const to = todayLocalDateString();
  const fromDate = parseLocalDateToDate(to);
  fromDate.setDate(1);
  return {
    from: dateToLocalDateString(fromDate),
    to,
  };
}

export function daysBetweenInclusive(from: string, to: string): number {
  const start = parseLocalDateToDate(from);
  const end = parseLocalDateToDate(to);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
}

export function granularityLabel(granularity: Granularity, t: TranslateFn): string {
  return getGranularityOptions(t).find((option) => option.value === granularity)?.label ?? granularity;
}

export function granularityDescription(granularity: Granularity, t: TranslateFn): string {
  const option = getGranularityOptions(t).find((item) => item.value === granularity);
  if (!option) {
    return granularity;
  }
  return `${option.label.toLowerCase()} - ${option.hint.toLowerCase()}`;
}

export function aggregateProductTotals(entries: IngredientStats[], intlLocale = 'pl-PL'): ProductTotal[] {
  const totals = new Map<string, number>();

  for (const entry of entries) {
    totals.set(entry.ingredientName, (totals.get(entry.ingredientName) ?? 0) + entry.count);
  }

  return [...totals.entries()]
    .map(([name, totalCount]) => ({ name, totalCount }))
    .sort((left, right) => {
      if (right.totalCount !== left.totalCount) {
        return right.totalCount - left.totalCount;
      }
      return left.name.localeCompare(right.name, intlLocale);
    });
}

export function sortTimeSeries(entries: IngredientStats[]): IngredientStats[] {
  return [...entries].sort((left, right) => left.periodStart.localeCompare(right.periodStart));
}

export function formatPeriodLabel(
  periodStart: string,
  periodEnd: string | null,
  granularity: Granularity,
  intlLocale = 'pl-PL',
): string {
  const startLabel = formatShortDate(periodStart, intlLocale);

  if (!periodEnd) {
    return startLabel;
  }

  const endDate = parseLocalDateToDate(periodEnd);
  endDate.setDate(endDate.getDate() - 1);
  const endLabel = formatShortDate(dateToLocalDateString(endDate), intlLocale);

  if (granularity === 'MONTH') {
    return `${startLabel} – ${endLabel}`;
  }

  return startLabel;
}

function formatShortDate(value: string, intlLocale: string): string {
  return parseLocalDateToDate(value).toLocaleDateString(intlLocale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function validateDateRange(range: DateRange, t: TranslateFn): string | null {
  if (!range.from || !range.to) {
    return t('statistics.dateRangeRequired');
  }
  if (range.from > range.to) {
    return t('statistics.dateRangeInvalid');
  }
  return null;
}
