import { ApiError, apiRequest } from './client';
import { parseTimestamp } from '../utils/binaryPayload';

export type ShoppingListItem = {
  name: string;
  quantity: number;
  checked: boolean;
};

export type ShoppingList = {
  shoppingListId: string;
  shoppingListName: string;
  shoppingListDescription: string | null;
  createdAt: string | null;
  modifiedAt: string | null;
  items: ShoppingListItem[];
  /** Ustawiane, gdy lista powstała z generowania ML (wymagane do acceptGeneratedList). */
  draftId: string | null;
};

export type IngredientRowForRegression = {
  name: string;
  quantity: number;
  label?: number;
  features?: number[];
};

export type AcceptGeneratedListInput = {
  draftId: string;
  shoppingListId: string;
  ingredientRowForRegressionList: IngredientRowForRegression[];
};

export type ShoppingListInput = {
  shoppingListName: string;
  shoppingListDescription: string | null;
  items: ShoppingListItem[];
};

export type ShoppingListPage = {
  items: ShoppingList[];
  page: number;
  hasNext: boolean;
};

type ShoppingListItemRaw = {
  name?: unknown;
  quantity?: unknown;
  checked?: unknown;
};

type ShoppingListRaw = {
  shoppingListId?: unknown;
  shoppingListName?: unknown;
  shoppingListDescription?: unknown;
  createdAt?: unknown;
  modifiedAt?: unknown;
  items?: unknown;
  draftId?: unknown;
};

function parseShoppingListItem(raw: unknown): ShoppingListItem {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError('Nieprawidłowa pozycja listy zakupów', 502);
  }

  const item = raw as ShoppingListItemRaw;
  if (
    typeof item.name !== 'string' ||
    typeof item.quantity !== 'number' ||
    !Number.isSafeInteger(item.quantity) ||
    item.quantity < 0 ||
    typeof item.checked !== 'boolean'
  ) {
    throw new ApiError('Nieprawidłowa pozycja listy zakupów', 502);
  }

  return {
    name: item.name,
    quantity: item.quantity,
    checked: item.checked,
  };
}

function parseShoppingList(raw: unknown): ShoppingList {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError('Nieprawidłowa odpowiedź listy zakupów', 502);
  }

  const item = raw as ShoppingListRaw;
  if (
    typeof item.shoppingListId !== 'string' ||
    typeof item.shoppingListName !== 'string'
  ) {
    throw new ApiError('Nieprawidłowa odpowiedź listy zakupów (id/nazwa)', 502);
  }

  if (item.items != null && !Array.isArray(item.items)) {
    throw new ApiError('Nieprawidłowa odpowiedź listy zakupów (pozycje)', 502);
  }

  const description =
    item.shoppingListDescription == null
      ? null
      : typeof item.shoppingListDescription === 'string'
        ? item.shoppingListDescription
        : null;

  const draftId =
    typeof item.draftId === 'string' && item.draftId.trim()
      ? item.draftId.trim()
      : null;

  return {
    shoppingListId: item.shoppingListId,
    shoppingListName: item.shoppingListName,
    shoppingListDescription: description,
    createdAt: parseTimestamp(item.createdAt),
    modifiedAt: parseTimestamp(item.modifiedAt),
    items: (item.items ?? []).map(parseShoppingListItem),
    draftId,
  };
}

function parseShoppingLists(raw: unknown): ShoppingList[] {
  if (!Array.isArray(raw)) {
    throw new ApiError('Nieprawidłowa odpowiedź list zakupów', 502);
  }
  return raw.map(parseShoppingList);
}

export async function fetchShoppingLists(
  householdId: string,
  options: { page?: number; size?: number } = {},
): Promise<ShoppingListPage> {
  const page = options.page ?? 0;
  const size = options.size ?? 20;
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort: 'createdAt,desc',
  });
  const raw = await apiRequest<unknown>(
    `/household/${householdId}/shoppingLists?${query.toString()}`,
    { auth: true },
  );
  const items = parseShoppingLists(raw);

  return {
    items,
    page,
    hasNext: items.length === size,
  };
}

export async function fetchShoppingList(
  householdId: string,
  shoppingListId: string,
): Promise<ShoppingList> {
  const raw = await apiRequest<unknown>(
    `/household/${householdId}/shoppingLists/${shoppingListId}`,
    { auth: true },
  );
  return parseShoppingList(raw);
}

export async function createShoppingList(
  householdId: string,
  input: ShoppingListInput,
): Promise<ShoppingList> {
  const raw = await apiRequest<unknown>(`/household/${householdId}/shoppingLists`, {
    method: 'POST',
    auth: true,
    body: {
      shoppingListName: input.shoppingListName.trim(),
      shoppingListDescription: input.shoppingListDescription?.trim() || null,
      items: input.items.map((item) => ({
        ...item,
        name: item.name.trim(),
      })),
    },
  });
  return parseShoppingList(raw);
}

export function shoppingListToInput(list: ShoppingList): ShoppingListInput {
  return {
    shoppingListName: list.shoppingListName,
    shoppingListDescription: list.shoppingListDescription,
    items: list.items.map((item) => ({ ...item })),
  };
}

export async function toggleShoppingListItemChecked(
  householdId: string,
  list: ShoppingList,
  itemIndex: number,
): Promise<ShoppingList> {
  if (itemIndex < 0 || itemIndex >= list.items.length) {
    throw new ApiError('Nieprawidłowa pozycja listy zakupów', 400);
  }

  const items = list.items.map((item, index) =>
    index === itemIndex ? { ...item, checked: !item.checked } : { ...item },
  );

  return updateShoppingList(householdId, list.shoppingListId, {
    shoppingListName: list.shoppingListName,
    shoppingListDescription: list.shoppingListDescription,
    items,
  });
}

export async function updateShoppingList(
  householdId: string,
  shoppingListId: string,
  input: ShoppingListInput,
): Promise<ShoppingList> {
  const raw = await apiRequest<unknown>(
    `/household/${householdId}/shoppingLists/${shoppingListId}`,
    {
      method: 'PATCH',
      auth: true,
      body: {
        shoppingListName: input.shoppingListName.trim(),
        shoppingListDescription: input.shoppingListDescription?.trim() || null,
        items: input.items.map((item) => ({
          ...item,
          name: item.name.trim(),
        })),
      },
    },
  );
  return parseShoppingList(raw);
}

export async function deleteShoppingList(
  householdId: string,
  shoppingListId: string,
): Promise<void> {
  await apiRequest<void>(
    `/household/${householdId}/shoppingLists/${shoppingListId}`,
    {
      method: 'DELETE',
      auth: true,
    },
  );
}

export async function generateShoppingListWithLogisticRegression(
  householdId: string,
  input: Pick<ShoppingListInput, 'shoppingListName' | 'shoppingListDescription'>,
): Promise<ShoppingList> {
  const raw = await apiRequest<unknown>(
    `/household/${householdId}/shoppingLists/generateUsingLogisticRegression`,
    {
      method: 'POST',
      auth: true,
      body: {
        shoppingListName: input.shoppingListName.trim(),
        shoppingListDescription: input.shoppingListDescription?.trim() || null,
        items: [],
      },
    },
  );
  return parseShoppingList(raw);
}

export async function acceptGeneratedShoppingList(
  householdId: string,
  input: AcceptGeneratedListInput,
): Promise<ShoppingList> {
  const raw = await apiRequest<unknown>(
    `/household/${householdId}/shoppingLists/acceptGeneratedList`,
    {
      method: 'POST',
      auth: true,
      body: {
        draftId: input.draftId,
        shoppingListId: input.shoppingListId,
        ingredientRowForRegressionList: input.ingredientRowForRegressionList.map(
          (row) => ({
            name: row.name.trim(),
            quantity: row.quantity,
            label: row.label ?? 0,
            features: row.features ?? [0, 0, 0, 0],
          }),
        ),
      },
    },
  );
  return parseShoppingList(raw);
}
