import { ReceiptProductRow, ReceiptShop } from '../api/receipt';

const SHOP_LABELS: Record<ReceiptShop, string> = {
  BIEDRONKA: 'Biedronka',
  LIDL: 'Lidl',
  KAUFLAND: 'Kaufland',
  AUCHAN: 'Auchan',
};

export function receiptShopLabel(shop: ReceiptShop): string {
  return SHOP_LABELS[shop];
}

export function resolveReceiptIngredientName(row: ReceiptProductRow): string {
  const userName = row.userProvidedProductName.trim();
  if (userName) {
    return userName;
  }
  return row.productNameFromReceipt.trim();
}

export function buildIngredientNamesFromReceipt(rows: ReceiptProductRow[]): string[] {
  const names: string[] = [];

  for (const row of rows) {
    const name = resolveReceiptIngredientName(row);
    if (name) {
      names.push(name);
    }
  }

  return names;
}
