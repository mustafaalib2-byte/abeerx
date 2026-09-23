// Delivery pricing rules, shared by the server (layout) and the browser (header, checkout).
// The live values are edited in the admin panel (Data & Settings → Delivery Charges) and
// stored in Firebase at abeerx/settings/delivery = { fee, freeThreshold }.

export type DeliverySettings = {
  fee: number;           // KWD charged when the order is below freeThreshold
  freeThreshold: number; // orders at or above this amount (KWD) get free delivery
};

// Used until the admin saves values (or if Firebase can't be reached).
export const DEFAULT_DELIVERY: DeliverySettings = { fee: 1.9, freeThreshold: 19 };

export function deliveryFeeFor(orderAmount: number, s: DeliverySettings): number {
  if (orderAmount <= 0) return 0;
  return orderAmount >= s.freeThreshold ? 0 : s.fee;
}

// 19 -> "19", 19.5 -> "19.5", 1.9 -> "1.9" (for sentences like "orders of 19 KWD and above")
export function formatAmount(n: number): string {
  return String(Number(n.toFixed(3)));
}

export function normalizeDeliverySettings(raw: unknown): DeliverySettings {
  const d = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const fee = Number(d.fee);
  const freeThreshold = Number(d.freeThreshold);
  return {
    fee: Number.isFinite(fee) && fee >= 0 ? fee : DEFAULT_DELIVERY.fee,
    freeThreshold: Number.isFinite(freeThreshold) && freeThreshold >= 0 ? freeThreshold : DEFAULT_DELIVERY.freeThreshold,
  };
}
