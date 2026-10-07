import type { Metadata } from "next";
import { ProductService } from "@/services/ProductService";
import { pageAlternates } from "@/lib/seo";
import ShopClient from "./ShopClient";

export const revalidate = 60;

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

  return <ShopClient products={products} locale={locale} />;
}
