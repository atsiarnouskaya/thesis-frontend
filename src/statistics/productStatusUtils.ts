import { ProductStatus } from '../api/statistics';
import { DateRange } from './statisticsUtils';

export type StatisticsModule = 'purchases' | 'consumed' | 'discarded' | 'interPurchase';

export const STATISTICS_MODULE_OPTIONS: {
  id: StatisticsModule;
  label: string;
  status?: ProductStatus;
}[] = [
  { id: 'purchases', label: 'Zakupy' },
  { id: 'consumed', label: 'Zjedzone', status: 'CONSUMED' },
  { id: 'discarded', label: 'Wyrzucone', status: 'DISCARD' },
  { id: 'interPurchase', label: 'Odstępy zakupów' },
];

export function statisticsModuleLabel(module: StatisticsModule): string {
  return STATISTICS_MODULE_OPTIONS.find((option) => option.id === module)?.label ?? module;
}

export function statisticsModuleDescription(module: StatisticsModule): string {
  switch (module) {
    case 'purchases':
      return 'Lista produktów kupionych w wybranym okresie.';
    case 'consumed':
      return 'Najczęściej zjedzone produkty w wybranym okresie.';
    case 'discarded':
      return 'Najczęściej wyrzucone produkty w wybranym okresie.';
    case 'interPurchase':
      return 'Mediana odstępu w dniach między kolejnymi zakupami tego samego produktu. Produkty pojawiają się tutaj jak zostały kupione przynajmniej 2 razy.';
  }
}

export function statisticsModuleToStatus(module: StatisticsModule): ProductStatus | null {
  const option = STATISTICS_MODULE_OPTIONS.find((item) => item.id === module);
  return option?.status ?? null;
}

export function parseStatusLimitInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function buildStatusFilterKey(input: {
  module: StatisticsModule;
  status: ProductStatus;
  useFullRange: boolean;
  dateRange: DateRange;
  limit: number | null;
}): string {
  const rangePart = input.useFullRange
    ? 'full'
    : `${input.dateRange.from}|${input.dateRange.to}`;
  const limitPart = input.limit == null ? 'default' : String(input.limit);
  return `${input.module}|${input.status}|${rangePart}|${limitPart}`;
}

export function buildInterPurchaseFilterKey(input: {
  useFullRange: boolean;
  dateRange: DateRange;
}): string {
  const rangePart = input.useFullRange
    ? 'full'
    : `${input.dateRange.from}|${input.dateRange.to}`;
  return `interPurchase|${rangePart}`;
}

export function formatInterPurchaseInterval(interval: number): string {
  const formatted = Number.isInteger(interval) ? String(interval) : interval.toFixed(1);
  return `~ ${formatted.replace('.', ',')} dni`;
}
