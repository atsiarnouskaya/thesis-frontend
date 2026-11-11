import { TranslationValues } from '../i18n/types';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type TranslateFn = (key: string, values?: TranslationValues) => string;

export function isValidLocalDateInput(value: string): boolean {
  const trimmed = value.trim();
  if (!DATE_PATTERN.test(trimmed)) {
    return false;
  }
  const parsed = Date.parse(`${trimmed}T12:00:00`);
  return !Number.isNaN(parsed);
}

export function formatLocalDate(value: string, intlLocale = 'pl-PL'): string {
  try {
    return new Date(`${value}T12:00:00`).toLocaleDateString(intlLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return value;
  }
}

export type ExpiryStatus = 'expired' | 'soon' | 'ok';

export function getExpiryStatus(expiresAt: string): ExpiryStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(`${expiresAt}T12:00:00`);
  expiry.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'expired';
  }
  if (diffDays <= 3) {
    return 'soon';
  }
  return 'ok';
}

export function expiryStatusLabel(status: ExpiryStatus, t: TranslateFn): string {
  switch (status) {
    case 'expired':
      return t('ingredient.expiryExpired');
    case 'soon':
      return t('ingredient.expirySoon');
    default:
      return t('ingredient.expiryOk');
  }
}

export type IngredientStatusFilter = 'PURCHASED' | 'CONSUMED' | 'DISCARD' | 'EXPIRED';

export function shouldShowExpiryBadge(statusFilter?: IngredientStatusFilter): boolean {
  return statusFilter !== 'CONSUMED' && statusFilter !== 'DISCARD';
}

export const INGREDIENT_STATUS_FILTERS: IngredientStatusFilter[] = [
  'PURCHASED',
  'CONSUMED',
  'DISCARD',
  'EXPIRED',
];

export function ingredientStatusFilterLabel(
  status: IngredientStatusFilter,
  t: TranslateFn,
): string {
  return t(`ingredient.statusFilter.${status}`);
}

export function ingredientStatusCountLabel(
  status: IngredientStatusFilter,
  count: number,
  t: TranslateFn,
): string {
  const filterLabel = ingredientStatusFilterLabel(status, t);
  const nounKey =
    count === 1
      ? `ingredient.noun.${status}_one`
      : `ingredient.noun.${status}_few`;
  const noun = t(nounKey);

  if (count === 0) {
    return t('ingredient.countNone', { noun });
  }
  if (count === 1) {
    return t('ingredient.countOne', { noun });
  }
  if (count < 5) {
    return t('ingredient.countFew', { count, noun });
  }
  return t('ingredient.countMany', { count, filter: filterLabel.toLowerCase() });
}

export function parseIngredientQuantityInput(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return undefined;
  }

  return parsed;
}

export function formatIngredientQuantity(quantity: number | null, t: TranslateFn): string | null {
  if (quantity == null) {
    return null;
  }

  return quantity === 1
    ? t('ingredient.qtyOnePiece')
    : t('ingredient.qtyPiece', { count: quantity });
}

export function validateIngredientInput(
  input: {
    name: string;
    purchasedAt: string;
    expiresAt: string;
    quantity?: string;
  },
  t: TranslateFn,
): string | null {
  if (!input.name.trim()) {
    return t('ingredient.validation.name');
  }
  if (parseIngredientQuantityInput(input.quantity ?? '') === undefined) {
    return t('ingredient.validation.quantity');
  }
  if (!isValidLocalDateInput(input.purchasedAt)) {
    return t('ingredient.validation.purchasedAt');
  }
  if (!isValidLocalDateInput(input.expiresAt)) {
    return t('ingredient.validation.expiresAt');
  }
  if (input.expiresAt.trim() < input.purchasedAt.trim()) {
    return t('ingredient.validation.expiryBeforePurchase');
  }
  return null;
}

export function todayLocalDateString(): string {
  const now = new Date();
  return dateToLocalDateString(now);
}

export function parseLocalDateToDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return new Date();
  }
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function dateToLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
