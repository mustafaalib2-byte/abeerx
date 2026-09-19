import { Product } from "@/types/product";
import { db } from "@/firebase/clientApp";
import fs from 'fs';
import path from 'path';
import { ref, get, child, set } from "firebase/database";

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  return hash;
}

import catalogData from '../public/catalog.json';

// --- STATIC CATALOG (0 BANDWIDTH) via CLOUDFLARE R2 ---
const CATALOG_URL = 'https://pub-209a4e728df44d029c946408e718e9c8.r2.dev/catalog.json';

export const ProductService = {
  async getAllProducts(): Promise<Product[]> {
    try {
      const res = await fetch(CATALOG_URL, { next: { revalidate: 60 } });
      if (!res.ok) throw new Error("Failed to fetch catalog from R2");
      const products = await res.json();
      
      const liveStock = await this.getLiveStock();
      products.forEach((p: any) => {
          p.totalStock = liveStock[p.name] || 0;
      });
      
      return products;
    } catch (e) {
      console.error("Failed to load R2 catalog, falling back to empty:", e);
      return [];
    }
  },

    async getLiveStock(): Promise<Record<string, number>> {
    try {
      if (!db) return {};
      const snapshot = await get(child(ref(db), 'abeerx/liveStock'));
      if (snapshot.exists()) return snapshot.val();
      return {};
    } catch (e) {
      console.error("Failed to fetch liveStock:", e);
      return {};
    }
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    const products = await this.getAllProducts();
    return products.find(p => p.slug === slug) || null;
  },

  async getFeaturedProducts(): Promise<Product[]> {
    const products = await this.getAllProducts();
    products.sort((a, b) => {
        const stockA = (a.totalStock || 0) > 0 ? 1 : 0;
        const stockB = (b.totalStock || 0) > 0 ? 1 : 0;
        return stockB - stockA;
    });
    return products.slice(0, 8);
  }
};

// ============================================================================
// MOCK DATA ADAPTER (Used while waiting for actual Firebase credentials/schema)
// ============================================================================
function getMockProducts(): Product[] {
  return [
    {
      id: "mock-1",
      sku: "ABX-001",
      name: "Oud Royal",
      brand: "Faiz Perfumes",
      categoryId: "cat-1",
      gender: "Unisex",
      shortDescription: "A rich, majestic blend of pure Cambodian Oud and Taif Rose.",
      description: "Oud Royal is the crown jewel of our 25-year legacy. Crafted for the discerning perfume connoisseur in Kuwait, it balances the deep, smoky intensity of aged agarwood with the delicate sweetness of Taif Rose.",
      price: 45.00,
      currency: "KWD",
      totalStock: 50,
      isAvailable: true,
      images: ["/placeholder.jpg"], // We will add real images later
      variants: [
        { sku: "ABX-001-50", size: "50ml", price: 45.00, stock: 20, isAvailable: true },
        { sku: "ABX-001-100", size: "100ml", price: 75.00, stock: 30, isAvailable: true }
      ],
      fragranceFamily: "Oriental",
      topNotes: "Saffron, Pink Pepper",
      heartNotes: "Taif Rose, Jasmine",
      baseNotes: "Cambodian Oud, Amber, Musk",
      concentration: "Parfum",
      tags: ["oud", "luxury", "bestseller"],
      slug: "oud-royal",
      seoTitle: "Oud Royal by Faiz Perfumes | Authentic Kuwait",
      seoDescription: "Buy original Oud Royal perfume in Kuwait. A majestic blend of Cambodian Oud.",
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "mock-2",
      sku: "ABX-002",
      name: "Midnight Blossom",
      brand: "Dior",
      categoryId: "cat-2",
      gender: "Women",
      shortDescription: "An elegant, mysterious floral fragrance.",
      description: "Midnight Blossom captures the essence of a secret garden at night.",
      price: 32.00,
      currency: "KWD",
      totalStock: 15,
      isAvailable: true,
      images: ["/placeholder.jpg"], 
      variants: [
        { sku: "ABX-002-50", size: "50ml", price: 32.00, stock: 15, isAvailable: true }
      ],
      fragranceFamily: "Floral",
      concentration: "EDP",
      tags: ["floral", "evening", "women"],
      slug: "midnight-blossom",
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];
}

