import { DeliverySettings, DEFAULT_DELIVERY, normalizeDeliverySettings } from "@/lib/delivery";

// Tiny node (two numbers) — safe to read often. Refreshed at most once a minute.
const DELIVERY_URL = "https://abeerx-a9260-default-rtdb.firebaseio.com/abeerx/settings/delivery.json";

export async function getDeliverySettings(): Promise<DeliverySettings> {
  try {
    const res = await fetch(DELIVERY_URL, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error("Firebase REST failed");
    return normalizeDeliverySettings(await res.json());
  } catch (e) {
    console.error("Failed to fetch delivery settings, using defaults:", e);
    return DEFAULT_DELIVERY;
  }
}
