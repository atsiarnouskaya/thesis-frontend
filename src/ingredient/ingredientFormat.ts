const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidLocalDateInput(value: string): boolean {
  const trimmed = value.trim();
  if (!DATE_PATTERN.test(trimmed)) {
    return false;
  }
  const parsed = Date.parse(`${trimmed}T12:00:00`);
  return !Number.isNaN(parsed);
}

export function formatLocalDate(value: string): string {
  try {
    return new Date(`${value}T12:00:00`).toLocaleDateString('pl-PL', {
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

export function expiryStatusLabel(status: ExpiryStatus): string {
  switch (status) {
    case 'expired':
      return 'Przeterminowany';
    case 'soon':
      return 'Wkrótce się psuje';
    default:
      return 'Ważny';
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

export function ingredientStatusFilterLabel(status: IngredientStatusFilter): string {
  switch (status) {
    case 'PURCHASED':
      return 'Aktywne';
    case 'CONSUMED':
      return 'Zjedzone';
    case 'DISCARD':
      return 'Wyrzucone';
    case 'EXPIRED':
      return 'Przeterminowane';
  }
}

export function ingredientStatusCountLabel(status: IngredientStatusFilter, count: number): string {
  const noun = (() => {
    switch (status) {
      case 'PURCHASED':
        return count === 1 ? 'aktywny produkt' : 'aktywne produkty';
      case 'CONSUMED':
        return count === 1 ? 'zjedzony produkt' : 'zjedzone produkty';
      case 'DISCARD':
        return count === 1 ? 'wyrzucony produkt' : 'wyrzucone produkty';
      case 'EXPIRED':
        return count === 1 ? 'przeterminowany produkt' : 'przeterminowane produkty';
    }
  })();

  if (count === 0) {
    return `Brak ${noun} w tej lodówce.`;
  }
  if (count === 1) {
    return `1 ${noun}.`;
  }
  if (count < 5) {
    return `${count} ${noun}.`;
  }
  return `${count} produktów (${ingredientStatusFilterLabel(status).toLowerCase()}).`;
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

export function formatIngredientQuantity(quantity: number | null): string | null {
  if (quantity == null) {
    return null;
  }

  return quantity === 1 ? '1 szt.' : `${quantity} szt.`;
}

export function validateIngredientInput(input: {
  name: string;
  purchasedAt: string;
  expiresAt: string;
  quantity?: string;
}): string | null {
  if (!input.name.trim()) {
    return 'Podaj nazwę produktu';
  }
  if (parseIngredientQuantityInput(input.quantity ?? '') === undefined) {
    return 'Ilość musi być liczbą całkowitą większą od zera';
  }
  if (!isValidLocalDateInput(input.purchasedAt)) {
    return 'Wybierz datę zakupu';
  }
  if (!isValidLocalDateInput(input.expiresAt)) {
    return 'Wybierz termin ważności';
  }
  if (input.expiresAt.trim() < input.purchasedAt.trim()) {
    return 'Termin ważności nie może być wcześniejszy niż data zakupu';
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
