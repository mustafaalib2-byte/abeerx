"use client";

import { useCart } from "./CartContext";
import { Product } from "@/types/product";

// Small "Add to Cart" link-style button for product cards (e.g. homepage Featured Fragrances).
// Adds the first size listed — the same size and price the card shows — and opens the cart drawer.
export function AddToCartButton({ product, locale }: { product: Product; locale: string }) {
  const { addToCart } = useCart();
  const isArabic = locale === "ar";
  const variant = product.variants?.[0];
  const isAvailable = variant ? variant.isAvailable !== false : product.isAvailable !== false;

  return (
    <button
      type="button"
      onClick={() => addToCart(product, variant, 1)}
      disabled={!isAvailable}
      className="text-xs uppercase tracking-wider font-bold hover:text-ring transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {!isAvailable
        ? (isArabic ? "نفدت الكمية" : "Out of Stock")
        : (isArabic ? "أضف للسلة" : "Add to Cart")}
    </button>
  );
}
