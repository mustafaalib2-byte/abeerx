"use client";

import { createContext, useContext, ReactNode } from "react";
import { DeliverySettings, DEFAULT_DELIVERY } from "@/lib/delivery";

const DeliveryContext = createContext<DeliverySettings>(DEFAULT_DELIVERY);

// The layout fetches the live settings on the server and hands them down here,
// so the header banner and checkout always use the same numbers.
export function DeliveryProvider({ value, children }: { value: DeliverySettings; children: ReactNode }) {
  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>;
}

export function useDeliverySettings(): DeliverySettings {
  return useContext(DeliveryContext);
}
