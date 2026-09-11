"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import { useCart } from "@/features/cart/CartContext";

export default function ProductPageClient({ product, locale }: { product: Product, locale: string }) {
  const isArabic = locale === 'ar';
  
  // Default to the first variant if available, otherwise fallback to base product price
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const currentVariant = product.variants?.[selectedVariantIndex];
  const price = currentVariant ? (currentVariant.salePrice || currentVariant.price) : (product.salePrice || product.price);
  const isAvailable = currentVariant ? currentVariant.isAvailable : product.isAvailable;

  const handleAddToCart = () => {
    addToCart(product, currentVariant, quantity);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Left: Image Gallery */}
        <div className="flex flex-col space-y-4">
          <div className="aspect-square bg-secondary w-full relative border border-border">
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-[#F9F9F9]">
              <span className="font-serif text-lg">Main Product Image Placeholder</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="aspect-square bg-secondary relative border border-border cursor-pointer hover:opacity-80 transition-opacity">
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-[#F9F9F9]">
                  <span className="text-xs">Img {idx}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="flex flex-col">
          <span className="text-sm tracking-widest uppercase text-muted-foreground mb-2">
            {product.brand}
          </span>
          <h1 className="text-4xl font-serif text-foreground mb-4">{product.name}</h1>
          
          <div className="text-2xl font-medium text-foreground mb-6">
            {price.toFixed(2)} {product.currency}
          </div>

          <p className="text-muted-foreground mb-8 leading-relaxed">
            {product.description}
          </p>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-8">
              <span className="block text-sm font-medium tracking-wider uppercase mb-3 text-foreground">
                {isArabic ? "الحجم" : "Size"}
              </span>
              <div className="flex flex-wrap gap-4">
                {product.variants.map((variant, idx) => (
                  <button 
                    key={variant.sku}
                    onClick={() => setSelectedVariantIndex(idx)}
                    className={`px-6 py-2 text-sm tracking-wider uppercase transition-colors border ${
                      selectedVariantIndex === idx 
                        ? 'border-foreground bg-foreground text-background' 
                        : 'border-border text-foreground hover:border-foreground'
                    }`}
                  >
                    {variant.size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="flex items-center gap-4 mb-12">
            <div className="flex items-center border border-border">
              <button 
                className="px-4 py-3 text-foreground hover:bg-secondary transition-colors"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >-</button>
              <span className="px-4 py-3 min-w-[3rem] text-center text-foreground">{quantity}</span>
              <button 
                className="px-4 py-3 text-foreground hover:bg-secondary transition-colors"
                onClick={() => setQuantity(quantity + 1)}
              >+</button>
            </div>
            
            <button 
              onClick={handleAddToCart}
              disabled={!isAvailable}
              className={`flex-grow py-4 px-8 text-sm tracking-widest uppercase font-bold transition-colors ${
                isAvailable 
                  ? 'bg-ring text-white hover:bg-black' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {!isAvailable 
                ? (isArabic ? "نفذت الكمية" : "Out of Stock")
                : (isArabic ? "أضف للسلة" : "Add to Cart")}
            </button>
          </div>

          {/* Accordion Info */}
          <div className="border-t border-border pt-8 space-y-6">
            <div>
              <h3 className="text-sm font-medium tracking-wider uppercase mb-2 text-foreground">{isArabic ? "المكونات العطرية" : "Fragrance Notes"}</h3>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Top:</span> {product.topNotes?.join(', ')}<br/>
                <span className="font-medium text-foreground">Heart:</span> {product.heartNotes?.join(', ')}<br/>
                <span className="font-medium text-foreground">Base:</span> {product.baseNotes?.join(', ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
