export interface ProductVariant {
  sku: string;
  size: string; // e.g., '30ml', '50ml', '100ml'
  price: number;
  salePrice?: number | null;
  stock: number;
  barcode?: string;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface Product {
  id: string; // Firebase Node ID or mapped ID
  sku: string;
  name: string;
  brand: string;
  categoryId: string;
  gender: 'Men' | 'Women' | 'Unisex' | 'Gift';
  shortDescription: string;
  description: string;
  price: number; // Base price
  salePrice?: number | null;
  discountPercentage?: number;
  currency: 'KWD';
  totalStock: number;
  isAvailable: boolean;
  images: string[]; // Primary image is first
  videoUrl?: string;
  variants: ProductVariant[];
  fragranceFamily: string;
  topNotes?: string;
  heartNotes?: string;
  baseNotes?: string;
  mainAccord?: string;
  occasion?: string;
  origin?: string;
  size?: string;
      concentration?: 'EDP' | 'EDT' | 'Parfum' | 'Cologne' | 'Oil';
  tags: string[];
  slug: string;
  seoTitle?: string;
  seoDescription?: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  createdAt: string; // ISO Date String
  updatedAt: string;
}

