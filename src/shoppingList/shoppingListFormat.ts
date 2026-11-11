import { TranslationValues } from '../i18n/types';

type TranslateFn = (key: string, values?: TranslationValues) => string;

export type ShoppingListItemDraft = {
  id: string;
  name: string;
  quantity: string;
  checked: boolean;
};

export function parseShoppingListQuantity(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const quantity = Number(normalized);
  return Number.isSafeInteger(quantity) && quantity > 0 ? quantity : null;
}

export function validateShoppingListInput(
  name: string,
  items: ShoppingListItemDraft[],
  t: TranslateFn,
  options: { requireItems?: boolean; validateItemFields?: boolean } = {},
): string | null {
  const requireItems = options.requireItems ?? true;
  const validateItemFields = options.validateItemFields ?? true;

  if (!name.trim()) {
    return t('shopping.validation.name');
  }

  if (requireItems && items.length === 0) {
    return t('shopping.validation.items');
  }

  if (!validateItemFields) {
    return null;
  }

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!item.name.trim()) {
      return t('shopping.validation.itemName', { index: index + 1 });
    }
    if (parseShoppingListQuantity(item.quantity) === null) {
      return t('shopping.validation.itemQuantity', { index: index + 1 });
    }
  }

  return null;
}

export function formatShoppingListDate(value: string | null, intlLocale = 'pl-PL'): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(intlLocale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function shoppingListItemCountLabel(count: number, t: TranslateFn): string {
  if (count === 1) {
    return t('shopping.countOne');
  }
  if (count >= 2 && count <= 4) {
    return t('shopping.countFew', { count });
  }
  return t('shopping.countMany', { count });
}
