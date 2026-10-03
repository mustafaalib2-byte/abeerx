// Stores a small summary of the order the customer just placed, so the success page can show it
// and report the sale to Google Ads / GA4 / Meta. Kept in the customer's own browser only.

export type PlacedOrder = {
  orderId: number;
  orderNum: string;
  date: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  couponCode?: string;
  deliveryFee: number;
  total: number;
  currency: "KWD";
  customer: { name: string; mobile: string; email?: string; area: string; address: string };
  items: { sku: string; name: string; brand?: string; size?: string; qty: number; price: number; image?: string }[];
};

const KEY = "abeerx_last_order";

export function saveLastOrder(order: PlacedOrder) {
  const json = JSON.stringify(order);
  try { sessionStorage.setItem(KEY, json); } catch { /* ignore */ }
  try { localStorage.setItem(KEY, json); } catch { /* ignore */ }
}

export function readLastOrder(): PlacedOrder | null {
  for (const store of [() => sessionStorage, () => localStorage]) {
    try {
      const raw = store().getItem(KEY);
      if (raw) return JSON.parse(raw) as PlacedOrder;
    } catch { /* ignore */ }
  }
  return null;
}

// True only the first time it is called for an order — stops a page refresh counting the sale twice.
export function firstTimeTracking(orderNum: string): boolean {
  const k = `abeerx_conv_${orderNum}`;
  try {
    if (localStorage.getItem(k)) return false;
    localStorage.setItem(k, String(Date.now()));
  } catch { /* if storage is blocked we still track once per page view */ }
  return true;
}
