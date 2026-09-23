"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product, ProductVariant } from "@/types/product";

export interface CartItem {
  product: Product;
  variant?: ProductVariant; // undefined means it's the base product
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, variant?: ProductVariant, quantity?: number, openCart?: boolean) => void;
  removeFromCart: (sku: string) => void;
  updateQuantity: (sku: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    setIsMounted(true);
    const savedCart = localStorage.getItem("abeerx_cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart");
      }
    }
  }, []);

  // Save to local storage when items change
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("abeerx_cart", JSON.stringify(items));
    }
  }, [items, isMounted]);

  // openCart=false lets product cards add silently (they show their own − qty + control instead)
  const addToCart = (product: Product, variant?: ProductVariant, quantity = 1, openCart = true) => {
    setItems(prev => {
      const sku = variant ? variant.sku : product.sku;
      const existing = prev.find(item => (item.variant ? item.variant.sku : item.product.sku) === sku);
      
      if (existing) {
        return prev.map(item => 
          (item.variant ? item.variant.sku : item.product.sku) === sku
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, variant, quantity }];
    });
    if (openCart) setIsCartOpen(true);
  };

  const removeFromCart = (sku: string) => {
    setItems(prev => prev.filter(item => (item.variant ? item.variant.sku : item.product.sku) !== sku));
  };

  const updateQuantity = (sku: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(sku);
      return;
    }
    setItems(prev => prev.map(item => 
      (item.variant ? item.variant.sku : item.product.sku) === sku
        ? { ...item, quantity }
        : item
    ));
  };

  const clearCart = () => setItems([]);

  const cartTotal = items.reduce((total, item) => {
    const price = item.variant ? (item.variant.salePrice || item.variant.price) : (item.product.salePrice || item.product.price);
    return total + (price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{
      items, addToCart, removeFromCart, updateQuantity, clearCart, isCartOpen, setIsCartOpen, cartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
