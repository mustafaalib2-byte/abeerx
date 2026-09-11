import { Product } from "@/types/product";
import { db } from "@/firebase/clientApp";
import { ref, get, child } from "firebase/database";

export const ProductService = {
  async getAllProducts(): Promise<Product[]> {
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || !db) {
      return getMockProducts();
    }
    
    try {
      const dbRef = ref(db);
      
      let detailsSnap, ratesSnap, imagesSnap;
      
      try {
        // Fetch details, rates, and images simultaneously from the POS schema
        [detailsSnap, ratesSnap, imagesSnap] = await Promise.all([
          get(child(dbRef, `abeerx/itemDetails`)),
          get(child(dbRef, `abeerx/itemRates`)),
          get(child(dbRef, `abeerx/productImages`))
        ]);
      } catch (permissionError) {
        console.warn("Firebase Permission Denied. Returning empty catalog until DB rules are updated.", permissionError);
        return [];
      }

      if (detailsSnap && detailsSnap.exists() && ratesSnap.exists()) {
        const details = detailsSnap.val();
        const rates = ratesSnap.val();
        const images = imagesSnap.exists() ? imagesSnap.val() : {};

        return Object.keys(details).map(key => {
          const item = details[key];
          const price = rates[key] || 0;
          
          let imageUrl = "/placeholder.jpg";
          const rawImage = images[key];
          if (rawImage) {
             if (typeof rawImage === 'string') imageUrl = rawImage;
             else if (rawImage.images && Array.isArray(rawImage.images)) imageUrl = rawImage.images[0];
          }

          return {
            id: key, 
            sku: item.sku || `SKU-${Date.now()}`,
            name: key,
            brand: item.brand || 'ABEERX',
            categoryId: item.category || item.scentFamily || 'Uncategorized',
            gender: item.gender || 'Unisex',
            shortDescription: item.concentration || 'EDP',
            description: item.description || `Notes: Top (${item.topNotes || '-'}), Heart (${item.heartNotes || '-'}), Base (${item.baseNotes || '-'}). Main Accord: ${item.mainAccord || '-'}. Origin: ${item.origin || '-'}`,
            price: price,
            currency: 'KWD',
            totalStock: 99, 
            isAvailable: true,
            images: [imageUrl],
            variants: [],
            fragranceFamily: item.scentFamily || 'General',
            tags: [item.concentration || 'EDP', item.size || '100ml', item.occasion, item.mainAccord, item.origin].filter(Boolean),
            slug: key.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            isFeatured: true, 
            isBestSeller: false,
            isNewArrival: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as Product;
        });
      }
      return [];
    } catch (error) {
      console.error("Error fetching products from Live Firebase:", error);
      return [];
    }
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    const products = await this.getAllProducts();
    return products.find(p => p.slug === slug) || null;
  },

  async getFeaturedProducts(): Promise<Product[]> {
    const products = await this.getAllProducts();
    return products.slice(0, 8); // Just return the first 8 for the homepage grid
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
      topNotes: ["Saffron", "Pink Pepper"],
      heartNotes: ["Taif Rose", "Jasmine"],
      baseNotes: ["Cambodian Oud", "Amber", "Musk"],
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
