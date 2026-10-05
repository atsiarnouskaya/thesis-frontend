import { Granularity, IngredientStats } from '../api/statistics';
import { dateToLocalDateString, parseLocalDateToDate, todayLocalDateString } from '../ingredient/ingredientFormat';

export type ProductTotal = {
  name: string;
  totalCount: number;
};

export type DateRange = {
  from: string;
  to: string;
};

export const GRANULARITY_OPTIONS: { value: Granularity; label: string; hint: string }[] = [
  { value: 'MONTH', label: 'Miesięczna', hint: 'Rozbicie po tygodniach' },
  { value: 'YEAR', label: 'Roczna', hint: 'Rozbicie po miesiącach' },
];

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

export function granularityLabel(granularity: Granularity): string {
  return GRANULARITY_OPTIONS.find((option) => option.value === granularity)?.label ?? granularity;
}

export function granularityDescription(granularity: Granularity): string {
  const option = GRANULARITY_OPTIONS.find((item) => item.value === granularity);
  if (!option) {
    return granularity;
  }
  return `${option.label.toLowerCase()} - ${option.hint.toLowerCase()}`;
}

export function aggregateProductTotals(entries: IngredientStats[]): ProductTotal[] {
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
      return left.name.localeCompare(right.name, 'pl');
    });
}

export function sortTimeSeries(entries: IngredientStats[]): IngredientStats[] {
  return [...entries].sort((left, right) => left.periodStart.localeCompare(right.periodStart));
}

export function formatPeriodLabel(
  periodStart: string,
  periodEnd: string | null,
  granularity: Granularity,
): string {
  const startLabel = formatShortDate(periodStart);

  if (!periodEnd) {
    return startLabel;
  }

  const endDate = parseLocalDateToDate(periodEnd);
  endDate.setDate(endDate.getDate() - 1);
  const endLabel = formatShortDate(dateToLocalDateString(endDate));

  if (granularity === 'MONTH') {
    return `${startLabel} – ${endLabel}`;
  }

  return startLabel;
}

function formatShortDate(value: string): string {
  return parseLocalDateToDate(value).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function validateDateRange(range: DateRange): string | null {
  if (!range.from || !range.to) {
    return 'Wybierz zakres dat';
  }
  if (range.from > range.to) {
    return 'Data początkowa nie może być późniejsza niż końcowa';
  }
  return null;
}
