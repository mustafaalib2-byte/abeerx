export const revalidate = 60;
import { ProductService } from "@/services/ProductService";
import { notFound } from "next/navigation";
import ProductPageClient from "./ProductPageClient";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await ProductService.getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };
  
  return {
    title: product.seoTitle || `${product.name} | ABEERX`,
    description: product.seoDescription || product.shortDescription,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ locale: string, slug: string }> }) {
  const { locale, slug } = await params;
  const product = await ProductService.getProductBySlug(slug);
  
  if (!product) {
    notFound();
  }

  return <ProductPageClient product={product} locale={locale} />;
}
