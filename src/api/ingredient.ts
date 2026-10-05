import { apiRequest, ApiError } from './client';
import { submitMultipartJson } from './multipartUpload';
import { normalizeBinaryBase64, parseLocalDate, parseTimestamp } from '../utils/binaryPayload';

export type Ingredient = {
  id: string;
  householdId: string;
  name: string;
  quantity: number | null;
  purchasedAt: string;
  expiresAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  ingredientPicture: string | null;
};

export type IngredientInput = {
  name: string;
  purchasedAt: string;
  expiresAt: string;
  notes?: string | null;
  quantity?: number | null;
};

export type IngredientPhotoInput = {
  uri: string;
  fileName: string;
  mimeType: string;
};

export type IngredientStatus = 'PURCHASED' | 'CONSUMED' | 'DISCARD' | 'EXPIRED';

export type IngredientPage = {
  items: Ingredient[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

type IngredientPageRaw = {
  content?: unknown;
  number?: unknown;
  size?: unknown;
  totalElements?: unknown;
  totalPages?: unknown;
  last?: unknown;
};

type IngredientRaw = {
  id?: unknown;
  householdId?: unknown;
  name?: unknown;
  quantity?: unknown;
  purchasedAt?: unknown;
  expiresAt?: unknown;
  notes?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  ingredientPicture?: unknown;
  profilePicture?: unknown;
};

function parseIngredientQuantity(raw: unknown): number | null {
  if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 1) {
    return null;
  }
  return raw;
}

function parseIngredient(raw: unknown): Ingredient {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError('Nieprawidłowa odpowiedź produktu', 502);
  }

  const item = raw as IngredientRaw;
  const purchasedAt = parseLocalDate(item.purchasedAt);
  const expiresAt = parseLocalDate(item.expiresAt);
  const createdAt = parseTimestamp(item.createdAt) ?? new Date().toISOString();
  const updatedAt = parseTimestamp(item.updatedAt) ?? createdAt;

  if (
    typeof item.id !== 'string' ||
    typeof item.householdId !== 'string' ||
    typeof item.name !== 'string' ||
    !purchasedAt ||
    !expiresAt
  ) {
    throw new ApiError('Nieprawidłowa odpowiedź produktu', 502);
  }

  return {
    id: item.id,
    householdId: item.householdId,
    name: item.name,
    quantity: parseIngredientQuantity(item.quantity),
    purchasedAt,
    expiresAt,
    notes: typeof item.notes === 'string' && item.notes.trim() ? item.notes.trim() : null,
    createdAt,
    updatedAt,
    ingredientPicture: normalizeBinaryBase64(item.ingredientPicture ?? item.profilePicture),
  };
}

function parseIngredientList(raw: unknown): Ingredient[] {
  if (!Array.isArray(raw)) {
    throw new ApiError('Nieprawidłowa lista produktów', 502);
  }
  return raw.map(parseIngredient);
}

function parseIngredientPage(raw: unknown): IngredientPage {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError('Nieprawidłowa odpowiedź listy produktów', 502);
  }

  const page = raw as IngredientPageRaw;
  const number = typeof page.number === 'number' ? page.number : 0;
  const size = typeof page.size === 'number' ? page.size : 0;
  const totalElements = typeof page.totalElements === 'number' ? page.totalElements : 0;
  const totalPages = typeof page.totalPages === 'number' ? page.totalPages : 0;
  const last = typeof page.last === 'boolean' ? page.last : true;

  return {
    items: parseIngredientList(page.content),
    page: number,
    size,
    totalElements,
    totalPages,
    hasNext: !last,
  };
}

function buildIngredientFields(
  input: IngredientInput,
): Record<string, string | null | undefined> {
  const notes = input.notes?.trim();
  return {
    name: input.name.trim(),
    purchasedAt: input.purchasedAt.trim(),
    expiresAt: input.expiresAt.trim(),
    notes: notes ?? '',
    quantity: input.quantity != null ? String(input.quantity) : undefined,
  };
}

export type IngredientUpdateOptions = {
  photo?: IngredientPhotoInput | null;
  removeImage?: boolean;
};

async function submitIngredient(
  method: 'POST' | 'PUT',
  path: string,
  input: IngredientInput,
  photo?: IngredientPhotoInput | null,
  options?: Pick<IngredientUpdateOptions, 'removeImage'>,
): Promise<Ingredient> {
  const fields = buildIngredientFields(input);
  if (options?.removeImage) {
    fields.removeImage = 'true';
  }

  const raw = await submitMultipartJson<unknown>(
    path,
    method,
    fields,
    photo
      ? {
          uri: photo.uri,
          fileName: photo.fileName,
          mimeType: photo.mimeType,
          fieldName: 'image',
        }
      : undefined,
  );
  return parseIngredient(raw);
}

export async function fetchIngredients(householdId: string): Promise<Ingredient[]> {
  const raw = await apiRequest<unknown>(`/household/${householdId}/ingredients`, { auth: true });
  return parseIngredientList(raw);
}

export async function fetchIngredient(
  householdId: string,
  ingredientId: string,
): Promise<Ingredient> {
  const raw = await apiRequest<unknown>(
    `/household/${householdId}/ingredients/${ingredientId}`,
    { auth: true },
  );
  return parseIngredient(raw);
}

export async function createIngredient(
  householdId: string,
  input: IngredientInput,
  photo?: IngredientPhotoInput | null,
): Promise<Ingredient> {
  return submitIngredient('POST', `/household/${householdId}/ingredients`, input, photo);
}

export async function updateIngredient(
  householdId: string,
  ingredientId: string,
  input: IngredientInput,
  options?: IngredientUpdateOptions,
): Promise<Ingredient> {
  return submitIngredient(
    'PUT',
    `/household/${householdId}/ingredients/${ingredientId}`,
    input,
    options?.photo,
    { removeImage: options?.removeImage },
  );
}

export async function deleteIngredient(householdId: string, ingredientId: string): Promise<void> {
  await apiRequest<void>(`/household/${householdId}/ingredients/${ingredientId}`, {
    method: 'DELETE',
    auth: true,
  });
}

export type FetchIngredientsFilteredOptions = {
  status: IngredientStatus;
  page?: number;
  size?: number;
};

export async function fetchIngredientsFiltered(
  householdId: string,
  options: FetchIngredientsFilteredOptions,
): Promise<IngredientPage> {
  const params = new URLSearchParams({
    status: options.status,
    page: String(options.page ?? 0),
    size: String(options.size ?? 20),
    sort: 'expiresAt,asc',
  });

  const raw = await apiRequest<unknown>(
    `/household/${householdId}/ingredients/filtered?${params.toString()}`,
    { auth: true },
  );
  return parseIngredientPage(raw);
}

export async function consumeIngredient(
  householdId: string,
  ingredientId: string,
  consumeDate: string,
): Promise<Ingredient> {
  const params = new URLSearchParams({ consumeDate });
  const raw = await apiRequest<unknown>(
    `/household/${householdId}/ingredients/consume/${ingredientId}?${params.toString()}`,
    { method: 'PATCH', auth: true },
  );
  return parseIngredient(raw);
}

export async function discardIngredient(
  householdId: string,
  ingredientId: string,
  discardDate: string,
): Promise<Ingredient> {
  const params = new URLSearchParams({ discardDate });
  const raw = await apiRequest<unknown>(
    `/household/${householdId}/ingredients/discard/${ingredientId}?${params.toString()}`,
    { method: 'PATCH', auth: true },
  );
  return parseIngredient(raw);
}
