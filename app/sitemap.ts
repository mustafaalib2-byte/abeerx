import { MetadataRoute } from 'next'
import { ProductService } from '@/services/ProductService'

// Always the canonical (www) address, so it matches the Search Console property.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abeerx.com').replace(/\/$/, '');

// Rebuild at most once an hour.
export const revalidate = 3600;

const LOCALES = ['en', 'ar'];
const STATIC_PAGES: { path: string; changeFrequency: 'daily' | 'weekly' | 'monthly'; priority: number }[] = [
  { path: '', changeFrequency: 'daily', priority: 1 },
  { path: '/shop', changeFrequency: 'daily', priority: 0.9 },
  { path: '/brands', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/shipping-policy', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/returns-refunds', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/terms-conditions', changeFrequency: 'monthly', priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // getAllProducts() only returns products that have a photo, a price and stock,
  // so the sitemap lists exactly what is for sale.
  const products = await ProductService.getAllProducts();
  const now = new Date();

  const pages: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    STATIC_PAGES.map((p) => ({
      url: `${SITE_URL}/${locale}${p.path}`,
      lastModified: now,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
    }))
  );

  const productPages: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    products.map((product) => ({
      url: `${SITE_URL}/${locale}/product/${product.slug}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  );

  return [...pages, ...productPages];
}
