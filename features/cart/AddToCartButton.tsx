"use client";

import React from "react";
import { useCart } from "./CartContext";
import { Product } from "@/types/product";

// "Add to Cart" control for product cards (e.g. homepage Featured Fragrances).
// First click adds the first listed size (the size/price the card shows) WITHOUT opening
// the side cart; the button then turns into a − qty + stepper right on the card.
// Pressing − at 1 removes the item and brings the "Add to Cart" button back.
export function AddToCartButton({ product, locale }: { product: Product; locale: string }) {
  const { items, addToCart, updateQuantity } = useCart();
  const isArabic = locale === "ar";
  const variant = product.variants?.[0];
  const sku = variant ? variant.sku : product.sku;
  const isAvailable = variant ? variant.isAvailable !== false : product.isAvailable !== false;

  const inCart = items.find(i => (i.variant ? i.variant.sku : i.product.sku) === sku);
  const qty = inCart ? inCart.quantity : 0;

  // Keep clicks on this control from ever triggering a surrounding card link.
  const stop = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); };

  if (!isAvailable) {
    return (
      <button type="button" disabled className="text-xs uppercase tracking-wider font-bold opacity-40 cursor-not-allowed">
        {isArabic ? "نفدت الكمية" : "Out of Stock"}
      </button>
    );
  }

  if (qty === 0) {
    return (
      <button
        type="button"
        onClick={(e) => { stop(e); addToCart(product, variant, 1, false); }}
        className="text-xs uppercase tracking-wider font-bold hover:text-ring transition-colors"
      >
        {isArabic ? "أضف للسلة" : "Add to Cart"}
      </button>
    );
  }

  return (
    <div className="flex items-center border border-border text-foreground" dir="ltr">
      <button
        type="button"
        aria-label={isArabic ? "تقليل الكمية" : "Decrease quantity"}
        onClick={(e) => { stop(e); updateQuantity(sku, qty - 1); }}
        className="px-3 py-1 hover:bg-secondary transition-colors"
      >
        −
      </button>
      <span className="px-2 py-1 text-xs min-w-[2rem] text-center font-bold" aria-live="polite">{qty}</span>
      <button
        type="button"
        aria-label={isArabic ? "زيادة الكمية" : "Increase quantity"}
        onClick={(e) => { stop(e); updateQuantity(sku, qty + 1); }}
        className="px-3 py-1 hover:bg-secondary transition-colors"
      >
        +
      </button>
    </div>
  );
}
