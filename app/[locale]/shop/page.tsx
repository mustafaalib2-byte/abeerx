import type { Metadata } from "next";
import { ProductService } from "@/services/ProductService";
import { pageAlternates } from "@/lib/seo";
import ShopClient from "./ShopClient";
import type { Product } from "@/types/product";

// Rebuilt at most every 5 minutes (each rebuild counts against the hosting plan).
export const revalidate = 300;

// Filtered views (?brand=, ?gender=, ?note=…) all point back to the plain shop page as canonical.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'ar' ? "تسوق العطور | ABEERX" : "Shop Perfumes | ABEERX",
    alternates: pageAlternates(locale, '/shop'),
  };
}

export default async function ShopPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const products = await ProductService.getAllProducts();

  // Every product is sent to the browser for filtering, so only send what the shop uses.
  // The full records (Arabic descriptions, dates, tags...) made this page several MB.
  const shopProducts = products.map((p) => ({
    id: p.id, slug: p.slug, sku: p.sku, name: p.name, brand: p.brand,
    price: p.price, salePrice: p.salePrice, discountPercentage: p.discountPercentage, currency: p.currency,
    images: p.images.slice(0, 1),
    variants: (p.variants || []).map((v) => ({ sku: v.sku, size: v.size, price: v.price, salePrice: v.salePrice, stock: v.stock, isAvailable: v.isAvailable, isTester: v.isTester })),
    totalStock: p.totalStock, isAvailable: p.isAvailable, isFeatured: p.isFeatured, isBestSeller: p.isBestSeller,
    testerAvailable: p.testerAvailable, gender: p.gender, concentration: p.concentration, size: p.size,
    categoryId: p.categoryId, fragranceFamily: p.fragranceFamily, mainAccord: p.mainAccord,
    topNotes: p.topNotes, heartNotes: p.heartNotes, baseNotes: p.baseNotes, occasion: p.occasion, origin: p.origin,
    // only used by the search box
    description: (p.description || '').slice(0, 200),
  })) as Product[];

  return <ShopClient products={shopProducts} locale={locale} />;
}
