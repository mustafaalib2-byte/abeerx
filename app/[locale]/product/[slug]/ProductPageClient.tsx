"use client";
import Image from "next/image";

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
            <Image 
              src={product.images[0] || '/placeholder.jpg'} 
              alt={product.name} 
              fill 
              priority 
              className="object-cover" 
            />
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

          {/* Fragrance Profile Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 bg-secondary p-6 border border-border">
            {product.gender && (
              <div>
                <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Gender</span>
                <span className="text-sm font-medium">{product.gender}</span>
              </div>
            )}
            {product.concentration && (
              <div>
                <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Concentration</span>
                <span className="text-sm font-medium">{product.concentration}</span>
              </div>
            )}
            {product.fragranceFamily && (
              <div>
                <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Scent Family</span>
                <span className="text-sm font-medium">{product.fragranceFamily}</span>
              </div>
            )}
            {product.mainAccord && (
              <div>
                <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Main Accord</span>
                <span className="text-sm font-medium">{product.mainAccord}</span>
              </div>
            )}
            {product.occasion && (
              <div>
                <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Occasion</span>
                <span className="text-sm font-medium">{product.occasion}</span>
              </div>
            )}
            {product.origin && (
              <div>
                <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Origin</span>
                <span className="text-sm font-medium">{product.origin}</span>
              </div>
            )}
          </div>

          {(product.topNotes || product.heartNotes || product.baseNotes) && (
            <div className="mb-8 border-t border-border pt-6">
              <h3 className="text-lg font-serif mb-4 uppercase tracking-widest">Fragrance Notes</h3>
              <div className="space-y-3">
                {product.topNotes && (
                  <div>
                    <span className="font-semibold text-sm uppercase tracking-wider">Top: </span>
                    <span className="text-sm text-muted-foreground">{product.topNotes}</span>
                  </div>
                )}
                {product.heartNotes && (
                  <div>
                    <span className="font-semibold text-sm uppercase tracking-wider">Heart: </span>
                    <span className="text-sm text-muted-foreground">{product.heartNotes}</span>
                  </div>
                )}
                {product.baseNotes && (
                  <div>
                    <span className="font-semibold text-sm uppercase tracking-wider">Base: </span>
                    <span className="text-sm text-muted-foreground">{product.baseNotes}</span>
                  </div>
                )}
              </div>
            </div>
          )}

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

        </div>
      </div>
    </div>
  );
}
