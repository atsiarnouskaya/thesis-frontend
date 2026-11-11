import { apiRequest, ApiError } from './client';
import { uploadMultipartJson } from './multipartUpload';
import { PickedImage } from '../utils/pickedImageTypes';

export type ReceiptShop = 'BIEDRONKA' | 'LIDL' | 'KAUFLAND' | 'AUCHAN';

export const RECEIPT_SHOPS: ReceiptShop[] = ['BIEDRONKA', 'LIDL', 'KAUFLAND', 'AUCHAN'];

export type ReceiptProductRow = {
  productNameFromReceipt: string;
  userProvidedProductName: string;
};

export type ReceiptData = {
  items: ReceiptProductRow[];
};

type ReceiptRowRaw = {
  productNameFromReceipt?: unknown;
  userProvidedProductName?: unknown;
};

function parseReceiptRow(raw: unknown): ReceiptProductRow | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const row = raw as ReceiptRowRaw;
  if (typeof row.productNameFromReceipt !== 'string') {
    return null;
  }

  const productNameFromReceipt = row.productNameFromReceipt.trim();
  if (!productNameFromReceipt) {
    return null;
  }

  const userProvidedProductName =
    typeof row.userProvidedProductName === 'string' ? row.userProvidedProductName : '';

  return {
    productNameFromReceipt,
    userProvidedProductName,
  };
}

export function parseReceiptData(raw: unknown): ReceiptData {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError('Nieprawidłowa odpowiedź OCR paragonu', 502);
  }

  const itemsRaw = (raw as { items?: unknown }).items;
  if (!Array.isArray(itemsRaw)) {
    throw new ApiError('Nieprawidłowa odpowiedź OCR paragonu (items)', 502);
  }

  const items = itemsRaw
    .map((entry) => parseReceiptRow(entry))
    .filter((entry): entry is ReceiptProductRow => entry != null);

  return { items };
}

export async function processReceiptImage(
  householdId: string,
  shop: ReceiptShop,
  image: PickedImage,
): Promise<ReceiptData> {
  const raw = await uploadMultipartJson<unknown>(
    `/household/${householdId}/process-receipt`,
    image.uri,
    image.fileName,
    image.mimeType,
    { shop },
  );

  return parseReceiptData(raw);
}

export async function saveReceiptProductMappings(
  householdId: string,
  payload: ReceiptData,
): Promise<ReceiptData> {
  const raw = await apiRequest<unknown>(`/household/${householdId}/receipt-data`, {
    method: 'POST',
    auth: true,
    body: payload,
  });

  return parseReceiptData(raw);
}
