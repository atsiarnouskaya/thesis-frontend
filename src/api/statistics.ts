import { apiRequest, ApiError } from './client';

export type Granularity = 'MONTH' | 'YEAR';

export type ProductStatus = 'CONSUMED' | 'DISCARD';

export type IngredientNameCount = {
  ingredientName: string;
  count: number;
};

export type IngredientStats = {
  ingredientName: string;
  count: number;
  periodStart: string;
  periodEnd: string | null;
};

export type IngredientStatisticsResult = {
  data: IngredientStats[];
  firstDate: string | null;
};

export type StatisticsQuery = {
  householdId: string;
  granularity: Granularity;
  startTime?: string;
  endTime?: string;
  ingredientName?: string;
  useFullRange?: boolean;
};

export type ProductStatusStatisticsQuery = {
  householdId: string;
  status: ProductStatus;
  useFullRange?: boolean;
  startTime?: string;
  endTime?: string;
  limit?: number;
};

export type InterPurchaseInterval = {
  ingredientName: string;
  interval: number;
  firstPurchaseDate: string;
  lastPurchaseDate: string;
};

export type InterPurchaseStatisticsQuery = {
  householdId: string;
  useFullRange?: boolean;
  startTime?: string;
  endTime?: string;
};

type IngredientStatsRowRaw = {
  ingredientName?: unknown;
  count?: unknown;
  periodStart?: unknown;
  periodEnd?: unknown;
};

type IngredientStatisticsRaw = {
  data?: unknown;
  firstDate?: unknown;
  firstProductDate?: unknown;
};

type IngredientNameCountRaw = {
  ingredientName?: unknown;
  ingredientCount?: unknown;
  count?: unknown;
};

type InterPurchaseIntervalRaw = {
  ingredientName?: unknown;
  interval?: unknown;
  firstPurchaseDate?: unknown;
  lastPurchaseDate?: unknown;
};

function parseLocalDate(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  return value;
}

function parseIngredientStatsRow(raw: unknown): IngredientStats {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError('Nieprawidłowa odpowiedź statystyk', 502);
  }

  const item = raw as IngredientStatsRowRaw;
  const periodStart = parseLocalDate(item.periodStart);
  const periodEnd = item.periodEnd == null ? null : parseLocalDate(item.periodEnd);

  if (typeof item.ingredientName !== 'string' || typeof item.count !== 'number' || !periodStart) {
    throw new ApiError('Nieprawidłowa odpowiedź statystyk', 502);
  }

  return {
    ingredientName: item.ingredientName,
    count: item.count,
    periodStart,
    periodEnd,
  };
}

function parseIngredientStatisticsResult(raw: unknown): IngredientStatisticsResult {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError('Nieprawidłowa odpowiedź statystyk', 502);
  }

  const payload = raw as IngredientStatisticsRaw;

  if (!Array.isArray(payload.data)) {
    throw new ApiError('Nieprawidłowa odpowiedź statystyk', 502);
  }

  const firstDate =
    parseLocalDate(payload.firstDate) ?? parseLocalDate(payload.firstProductDate);

  return {
    data: payload.data.map(parseIngredientStatsRow),
    firstDate,
  };
}

function buildStatisticsPath(query: StatisticsQuery): string {
  const params = new URLSearchParams();
  params.set('granularity', query.granularity);

  if (!query.useFullRange) {
    if (query.startTime) {
      params.set('startTime', query.startTime);
    }
    if (query.endTime) {
      params.set('endTime', query.endTime);
    }
  }

  if (query.ingredientName) {
    params.set('ingredientName', query.ingredientName);
  }

  return `/household/${query.householdId}/statistics?${params.toString()}`;
}

export async function fetchIngredientStatistics(
  query: StatisticsQuery,
): Promise<IngredientStatisticsResult> {
  const raw = await apiRequest<unknown>(buildStatisticsPath(query), { auth: true });
  return parseIngredientStatisticsResult(raw);
}

function parseIngredientNameCount(raw: unknown): IngredientNameCount {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError('Nieprawidłowa odpowiedź statystyk statusu', 502);
  }

  const item = raw as IngredientNameCountRaw;
  const count =
    typeof item.ingredientCount === 'number'
      ? item.ingredientCount
      : typeof item.count === 'number'
        ? item.count
        : null;

  if (typeof item.ingredientName !== 'string' || count === null) {
    throw new ApiError('Nieprawidłowa odpowiedź statystyk statusu', 502);
  }

  return {
    ingredientName: item.ingredientName,
    count,
  };
}

function buildProductStatusStatisticsPath(query: ProductStatusStatisticsQuery): string {
  const params = new URLSearchParams();
  params.set('status', query.status);

  if (!query.useFullRange) {
    if (query.startTime) {
      params.set('startTime', query.startTime);
    }
    if (query.endTime) {
      params.set('endTime', query.endTime);
    }
  }

  if (query.limit != null && query.limit > 0) {
    params.set('limit', String(query.limit));
  }

  return `/household/${query.householdId}/statistics/status?${params.toString()}`;
}

export async function fetchProductStatusStatistics(
  query: ProductStatusStatisticsQuery,
): Promise<IngredientNameCount[]> {
  const raw = await apiRequest<unknown[]>(
    buildProductStatusStatisticsPath(query),
    { auth: true },
  );

  if (!Array.isArray(raw)) {
    throw new ApiError('Nieprawidłowa odpowiedź statystyk statusu', 502);
  }

  return raw.map(parseIngredientNameCount);
}

function parseInterPurchaseInterval(raw: unknown): InterPurchaseInterval {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError('Nieprawidłowa odpowiedź statystyk odstępów zakupów', 502);
  }

  const item = raw as InterPurchaseIntervalRaw;
  const firstPurchaseDate = parseLocalDate(item.firstPurchaseDate);
  const lastPurchaseDate = parseLocalDate(item.lastPurchaseDate);

  if (
    typeof item.ingredientName !== 'string' ||
    typeof item.interval !== 'number' ||
    !firstPurchaseDate ||
    !lastPurchaseDate
  ) {
    throw new ApiError('Nieprawidłowa odpowiedź statystyk odstępów zakupów', 502);
  }

  return {
    ingredientName: item.ingredientName,
    interval: item.interval,
    firstPurchaseDate,
    lastPurchaseDate,
  };
}

function buildInterPurchaseStatisticsPath(query: InterPurchaseStatisticsQuery): string {
  const params = new URLSearchParams();

  if (!query.useFullRange) {
    if (query.startTime) {
      params.set('startTime', query.startTime);
    }
    if (query.endTime) {
      params.set('endTime', query.endTime);
    }
  }

  const queryString = params.toString();
  return `/household/${query.householdId}/statistics/inter-purchase${queryString ? `?${queryString}` : ''}`;
}

export async function fetchInterPurchaseStatistics(
  query: InterPurchaseStatisticsQuery,
): Promise<InterPurchaseInterval[]> {
  const raw = await apiRequest<unknown[]>(buildInterPurchaseStatisticsPath(query), {
    auth: true,
  });

  if (!Array.isArray(raw)) {
    throw new ApiError('Nieprawidłowa odpowiedź statystyk odstępów zakupów', 502);
  }

  return raw.map(parseInterPurchaseInterval);
}
