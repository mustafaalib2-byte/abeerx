import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductService } from "@/services/ProductService";
import ProductLinkGrid from "@/components/ProductLinkGrid";
import { brandSlug, pageAlternates } from "@/lib/seo";

export const revalidate = 60;

async function getBrand(slug: string) {
  const products = await ProductService.getAllProducts();
  const brandProducts = products
    .filter((p) => p.brand && brandSlug(p.brand) === slug)
    .sort((a, b) => a.name.localeCompare(b.name));
  return { name: brandProducts[0]?.brand, products: brandProducts };
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const { name, products } = await getBrand(slug);
  if (!name) return { title: "Brand Not Found | ABEERX" };
  const isArabic = locale === 'ar';
  return {
    title: isArabic ? `عطور ${name} في الكويت | ABEERX` : `${name} Perfumes in Kuwait | ABEERX`,
    description: isArabic
      ? `تسوق ${products.length} من عطور ${name} الأصلية مع التوصيل في جميع أنحاء الكويت.`
      : `Shop ${products.length} authentic ${name} perfumes with delivery across Kuwait.`,
    alternates: pageAlternates(locale, `/brands/${slug}`),
  };
}

export default async function BrandPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const isArabic = locale === 'ar';
  const { name, products } = await getBrand(slug);
  if (!name) notFound();

  return (
    <div className="container mx-auto px-4 py-12 md:py-24">
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href={`/${locale}/brands`} className="hover:text-ring transition-colors">
          {isArabic ? "الماركات" : "Brands"}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{name}</span>
      </nav>
      <h1 className="text-3xl md:text-5xl font-serif mb-4 text-foreground">{name}</h1>
      <p className="text-muted-foreground mb-10">
        {isArabic ? `${products.length} عطر متوفر` : `${products.length} perfumes in stock`}
      </p>
      <ProductLinkGrid products={products} locale={locale} />
    </div>
  );
}
