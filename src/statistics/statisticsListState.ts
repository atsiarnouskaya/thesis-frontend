import { Granularity, IngredientNameCount, InterPurchaseInterval } from '../api/statistics';
import { StatisticsModule } from './productStatusUtils';
import { createDefaultDateRange, DateRange, ProductTotal } from './statisticsUtils';

export type StatisticsListState = {
  activeModule: StatisticsModule;
  dateRange: DateRange;
  granularity: Granularity;
  useFullRange: boolean;
  firstDate: string | null;
  statusLimit: number | null;
  products: ProductTotal[];
  statusProducts: IngredientNameCount[];
  interPurchaseProducts: InterPurchaseInterval[];
  hasLoaded: boolean;
  productsFilterKey: string | null;
  statusFilterKey: string | null;
  interPurchaseFilterKey: string | null;
};

const cache = new Map<string, StatisticsListState>();

function createInitialState(): StatisticsListState {
  const defaultRange = createDefaultDateRange();
  return {
    activeModule: 'purchases',
    dateRange: defaultRange,
    granularity: 'MONTH',
    useFullRange: false,
    firstDate: null,
    statusLimit: null,
    products: [],
    statusProducts: [],
    interPurchaseProducts: [],
    hasLoaded: false,
    productsFilterKey: null,
    statusFilterKey: null,
    interPurchaseFilterKey: null,
  };
}

export function getStatisticsListState(householdId: string): StatisticsListState {
  const existing = cache.get(householdId);
  if (existing) {
    return existing;
  }

  const initial = createInitialState();
  cache.set(householdId, initial);
  return initial;
}

export function saveStatisticsListState(
  householdId: string,
  patch: Partial<StatisticsListState>,
): StatisticsListState {
  const current = getStatisticsListState(householdId);
  const next = { ...current, ...patch };
  cache.set(householdId, next);
  return next;
}
