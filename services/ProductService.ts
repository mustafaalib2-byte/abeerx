import { Product } from "@/types/product";

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  return hash;
}

// --- STATIC CATALOG (0 BANDWIDTH) via CLOUDFLARE R2 ---
const CATALOG_URL = 'https://pub-209a4e728df44d029c946408e718e9c8.r2.dev/catalog.json';

// Live selling prices, edited in the admin panel (Item Catalog). Each value is a plain
// number keyed by the item's full name, e.g. { "212 NYC EDT 100 ML": 36 }. ~0.25 MB.
const RATES_URL = 'https://abeerx-a9260-default-rtdb.firebaseio.com/abeerx/itemRates.json';

// Must match the grouping in generateCatalog.js exactly: the catalog merges items that
// only differ by a trailing size ("X 50 ML" / "X 100 ML") into one product whose slug
// comes from the name with the size removed, and one variant per size.
const SIZE_RE = /\s*[-()]*\s*(\d+)\s*(ml|oz)\s*[-()]*\s*$/i;
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

function buildRateLookup(rates: Record<string, unknown>): Map<string, number> {
  const lookup = new Map<string, number>(); // "<product slug>|<size>" -> price
  for (const [key, val] of Object.entries(rates)) {
    let base = key;
    let size = '100ml';
    const m = key.match(SIZE_RE);
    if (m) {
      base = key.substring(0, m.index).trim();
      size = m[1] + m[2].toLowerCase();
    }
    const k = `${slugify(base)}|${size}`;
    if (!lookup.has(k)) lookup.set(k, Number(val) || 0); // first wins, same as the generator
  }
  return lookup;
}

function getPriority(p: any) {
    const hasStock = (p.totalStock || 0) > 0;
    const hasImage = p.images && p.images.length > 0;
    if (hasStock && hasImage) return 3;
    if (hasStock && !hasImage) return 2;
    if (!hasStock && hasImage) return 1;
    return 0;
}

export const ProductService = {
  async getAllProducts(): Promise<Product[]> {
    try {
      const res = await fetch(CATALOG_URL, { next: { revalidate: 60 } });
      if (!res.ok) throw new Error("Failed to fetch catalog from R2");
      const products = await res.json();

      const [liveStock, liveRates] = await Promise.all([this.getLiveStock(), this.getLiveRates()]);
      products.forEach((p: any) => {
          p.totalStock = liveStock[p.name] || 0;
      });

      // If the price feed is unavailable, don't wipe the shop — keep catalog prices
      // (still hiding anything priced at zero below).
      const rateLookup = liveRates ? buildRateLookup(liveRates) : null;

      const priced: Product[] = [];
      for (const p of products) {
        const variants = Array.isArray(p.variants) ? p.variants : [];

        if (rateLookup) {
          for (const v of variants) {
            const live = rateLookup.get(`${p.slug}|${v.size}`);
            if (live !== undefined) {
              v.price = live;
              v.salePrice = undefined; // discounts aren't stored anywhere live, so never show a stale one
            }
          }
        }

        // Never show a size (or a product) whose selling price is zero.
        const sellable = variants.filter((v: any) => Number(v.price) > 0);
        if (variants.length > 0) {
          if (sellable.length === 0) continue;
          p.variants = sellable;
          p.price = sellable[0].price;
          p.salePrice = sellable[0].salePrice;
        } else if (!(Number(p.price) > 0)) {
          continue;
        }
        priced.push(p);
      }

      return priced;
    } catch (e) {
      console.error("Failed to load R2 catalog, falling back to empty:", e);
      return [];
    }
  },

  async getLiveRates(): Promise<Record<string, unknown> | null> {
    try {
      const res = await fetch(RATES_URL, { next: { revalidate: 60 } });
      if (!res.ok) throw new Error("Firebase REST failed");
      const data = await res.json();
      return data && typeof data === 'object' ? data : null;
    } catch (e) {
      console.error("Failed to fetch itemRates via REST:", e);
      return null;
    }
  },

    async getLiveStock(): Promise<Record<string, number>> {
    try {
      const url = "https://abeerx-a9260-default-rtdb.firebaseio.com/abeerx/liveStock.json";
      const res = await fetch(url, { next: { revalidate: 60 } });
      if (!res.ok) throw new Error("Firebase REST failed");
      const data = await res.json();
      return data || {};
    } catch (e) {
      console.error("Failed to fetch liveStock via REST:", e);
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
        const pA = getPriority(a);
        const pB = getPriority(b);
        return pB - pA;
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

