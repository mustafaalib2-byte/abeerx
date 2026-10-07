export const revalidate = 60;
import Link from "next/link";
import { ProductService } from "@/services/ProductService";
import { notFound } from "next/navigation";
import ProductPageClient from "./ProductPageClient";
import ProductLinkGrid from "@/components/ProductLinkGrid";
import { brandSlug, pageAlternates } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string, slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await ProductService.getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };
  
  return {
    title: product.seoTitle || `${product.name} | ABEERX`,
    description: product.seoDescription || product.shortDescription,
    alternates: pageAlternates(locale, `/product/${product.slug}`),
    openGraph: product.images?.[0] ? { images: [product.images[0]] } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ locale: string, slug: string }> }) {
  const { locale, slug } = await params;
  const isArabic = locale === 'ar';
  const products = await ProductService.getAllProducts();
  const product = products.find(p => p.slug === slug);
  
  if (!product) {
    notFound();
  }

  // Links to other perfumes from the same house, so search engines can reach them too.
  const moreFromBrand = products
    .filter(p => p.brand === product.brand && p.slug !== product.slug)
    .slice(0, 8);

  return (
    <>
      <ProductPageClient product={product} locale={locale} />
      {moreFromBrand.length > 0 && (
        <section className="container mx-auto px-4 pb-12">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-2xl font-serif text-foreground">
              {isArabic ? `المزيد من ${product.brand}` : `More from ${product.brand}`}
            </h2>
            <Link href={`/${locale}/brands/${brandSlug(product.brand)}`} className="text-sm text-ring hover:underline">
              {isArabic ? "عرض الكل" : "View all"}
            </Link>
          </div>
          <ProductLinkGrid products={moreFromBrand} locale={locale} />
        </section>
      )}
    </>
  );
}
