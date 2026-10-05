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
  options: { requireItems?: boolean; validateItemFields?: boolean } = {},
): string | null {
  const requireItems = options.requireItems ?? true;
  const validateItemFields = options.validateItemFields ?? true;

  if (!name.trim()) {
    return 'Podaj nazwę listy zakupów';
  }

  if (requireItems && items.length === 0) {
    return 'Dodaj co najmniej jedną pozycję';
  }

  if (!validateItemFields) {
    return null;
  }

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!item.name.trim()) {
      return `Podaj nazwę pozycji ${index + 1}`;
    }
    if (parseShoppingListQuantity(item.quantity) === null) {
      return `Ilość pozycji ${index + 1} musi być dodatnią liczbą całkowitą`;
    }
  }

  return null;
}

export function formatShoppingListDate(value: string | null): string {
  if (!value) {
    return 'Brak daty';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Brak daty';
  }

  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function shoppingListItemCountLabel(count: number): string {
  if (count === 1) {
    return '1 pozycja';
  }
  if (count >= 2 && count <= 4) {
    return `${count} pozycje`;
  }
  return `${count} pozycji`;
}
