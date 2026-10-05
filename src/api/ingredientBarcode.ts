import { apiRequest, ApiError } from './client';
import { uploadMultipartJson } from './multipartUpload';
import { PickedImage } from '../utils/pickedImageTypes';

export type BarcodeProduct = {
  barcode: string;
  name: string | null;
  brand: string | null;
  quantity: string | null;
  imageUrl: string | null;
  categories: string | null;
};

type BarcodeProductRaw = {
  barcode?: unknown;
  name?: unknown;
  brand?: unknown;
  quantity?: unknown;
  imageUrl?: unknown;
  categories?: unknown;
};

export function normalizeBarcodeInput(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function isValidBarcode(barcode: string): boolean {
  return barcode.length >= 8 && barcode.length <= 14;
}

function parseNullableString(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseBarcodeProduct(raw: unknown): BarcodeProduct {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError('Nieprawidłowa odpowiedź wyszukiwania produktu', 502);
  }

  const item = raw as BarcodeProductRaw;
  if (typeof item.barcode !== 'string' || !item.barcode.trim()) {
    throw new ApiError('Nieprawidłowa odpowiedź wyszukiwania (barcode)', 502);
  }

  return {
    barcode: item.barcode.trim(),
    name: parseNullableString(item.name),
    brand: parseNullableString(item.brand),
    quantity: parseNullableString(item.quantity),
    imageUrl: parseNullableString(item.imageUrl),
    categories: parseNullableString(item.categories),
  };
}

export async function lookupIngredientByBarcode(
  householdId: string,
  barcode: string,
): Promise<BarcodeProduct> {
  const normalized = normalizeBarcodeInput(barcode);
  if (!isValidBarcode(normalized)) {
    throw new ApiError('Podaj prawidłowy kod kreskowy (8–14 cyfr)', 400);
  }

  const raw = await apiRequest<unknown>(
    `/household/${householdId}/ingredients/barcode/${encodeURIComponent(normalized)}`,
    { auth: true },
  );

  return parseBarcodeProduct(raw);
}

export async function scanBarcodeFromImage(
  householdId: string,
  image: PickedImage,
): Promise<BarcodeProduct> {
  const raw = await uploadMultipartJson<unknown>(
    `/household/${householdId}/ingredients/barcode/scan`,
    image.uri,
    image.fileName,
    image.mimeType,
  );

  return parseBarcodeProduct(raw);
}
