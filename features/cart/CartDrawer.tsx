"use client";

import { useCart } from "./CartContext";
import Link from "next/link";
import Image from "next/image";

export function CartDrawer({ locale }: { locale: string }) {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal } = useCart();
  const isArabic = locale === 'ar';

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />
      
      {/* Drawer */}
      <div className={`fixed top-0 bottom-0 ${isArabic ? 'left-0' : 'right-0'} w-full sm:w-96 bg-background z-50 shadow-2xl flex flex-col transition-transform transform translate-x-0`}>
        <div className="p-6 border-b border-border flex justify-between items-center bg-secondary">
          <h2 className="text-xl font-serif text-foreground">{isArabic ? "سلة المشتريات" : "Your Cart"}</h2>
          <button onClick={() => setIsCartOpen(false)} className="text-muted-foreground hover:text-foreground">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="text-center text-muted-foreground mt-12">
              <svg className="mx-auto w-12 h-12 mb-4 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line></svg>
              <p>{isArabic ? "سلة المشتريات فارغة" : "Your cart is empty."}</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="mt-6 text-sm tracking-widest uppercase font-bold text-ring hover:text-foreground"
              >
                {isArabic ? "مواصلة التسوق" : "Continue Shopping"}
              </button>
            </div>
          ) : (
            items.map(item => {
              const sku = item.variant ? item.variant.sku : item.product.sku;
              const price = item.variant ? (item.variant.salePrice || item.variant.price) : (item.product.salePrice || item.product.price);
              
              return (
                <div key={sku} className="flex gap-4 border-b border-border pb-4">
                  <div className="w-20 h-20 bg-secondary flex-shrink-0 border border-border flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground">Img</span>
                  </div>
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-serif font-bold text-foreground line-clamp-1">{item.product.name}</h3>
                        <button onClick={() => removeFromCart(sku)} className="text-muted-foreground hover:text-destructive">×</button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.variant ? item.variant.size : 'Standard'}
                      </p>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <div className="flex items-center border border-border">
                        <button className="px-2 py-1 hover:bg-secondary text-foreground" onClick={() => updateQuantity(sku, item.quantity - 1)}>-</button>
                        <span className="px-2 py-1 text-xs w-8 text-center text-foreground">{item.quantity}</span>
                        <button className="px-2 py-1 hover:bg-secondary text-foreground" onClick={() => updateQuantity(sku, item.quantity + 1)}>+</button>
                      </div>
                      <span className="text-sm font-bold text-foreground">{price.toFixed(2)} KWD</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-border bg-secondary">
            <div className="flex justify-between items-center mb-6 text-foreground font-medium">
              <span>{isArabic ? "المجموع الفرعي" : "Subtotal"}</span>
              <span>{cartTotal.toFixed(2)} KWD</span>
            </div>
            <Link 
              href={`/${locale}/checkout`}
              onClick={() => setIsCartOpen(false)}
              className="block w-full text-center bg-ring text-white py-4 text-sm tracking-widest uppercase font-bold hover:bg-black transition-colors"
            >
              {isArabic ? "إتمام الطلب" : "Secure Checkout"}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
