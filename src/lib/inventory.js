// Money + inventory helpers for the Product module.
// Prices are stored as integer UZS (so'm) — no floating point for money.

export const LOW_STOCK_THRESHOLD = 5;

export function formatSoM(value) {
  return new Intl.NumberFormat("en-US").format(Math.round(Number(value) || 0));
}

export function parsePrice(value) {
  const n = Math.round(Number(value));
  return Number.isNaN(n) ? null : n;
}

// Effective price for a branch: override wins, else the product default.
export function effectivePrice(product, inventory) {
  if (inventory && inventory.price_override != null) return inventory.price_override;
  return product?.price ?? 0;
}

// A product is purchasable only when it has inventory, is enabled, and stock > 0.
export function isPurchasable(inventory) {
  return !!inventory && inventory.is_available === true && (inventory.stock || 0) > 0;
}

export function isLowStock(stock) {
  return stock > 0 && stock <= LOW_STOCK_THRESHOLD;
}

export function stockLabel(stock) {
  return `${formatSoM(stock)} dona`;
}