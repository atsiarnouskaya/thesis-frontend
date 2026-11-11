import { ProductStatus } from '../api/statistics';
import { TranslationValues } from '../i18n/types';
import { DateRange } from './statisticsUtils';

type TranslateFn = (key: string, values?: TranslationValues) => string;

export type StatisticsModule = 'purchases' | 'consumed' | 'discarded' | 'interPurchase';

export function getStatisticsModuleOptions(t: TranslateFn): {
  id: StatisticsModule;
  label: string;
  status?: ProductStatus;
}[] {
  return [
    { id: 'purchases', label: t('statistics.modulePurchases') },
    { id: 'consumed', label: t('statistics.moduleConsumed'), status: 'CONSUMED' },
    { id: 'discarded', label: t('statistics.moduleDiscarded'), status: 'DISCARD' },
    { id: 'interPurchase', label: t('statistics.moduleInterPurchase') },
  ];
}

export function statisticsModuleLabel(module: StatisticsModule, t: TranslateFn): string {
  return getStatisticsModuleOptions(t).find((option) => option.id === module)?.label ?? module;
}

export function statisticsModuleDescription(module: StatisticsModule, t: TranslateFn): string {
  switch (module) {
    case 'purchases':
      return t('statistics.modulePurchasesDesc');
    case 'consumed':
      return t('statistics.moduleConsumedDesc');
    case 'discarded':
      return t('statistics.moduleDiscardedDesc');
    case 'interPurchase':
      return t('statistics.moduleInterPurchaseDesc');
  }
}

export function statisticsModuleToStatus(module: StatisticsModule): ProductStatus | null {
  switch (module) {
    case 'consumed':
      return 'CONSUMED';
    case 'discarded':
      return 'DISCARD';
    default:
      return null;
  }
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

export function formatInterPurchaseInterval(interval: number, t: TranslateFn): string {
  const formatted = Number.isInteger(interval) ? String(interval) : interval.toFixed(1);
  const localized = formatted.replace('.', ',');
  return t('statistics.interPurchaseDays', { value: localized });
}
