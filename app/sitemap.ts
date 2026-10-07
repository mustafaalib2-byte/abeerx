import { MetadataRoute } from 'next'
import { ProductService } from '@/services/ProductService'
import { SITE_URL, LOCALES, brandSlug, languageUrls } from '@/lib/seo'

// Rebuild at most once an hour.
export const revalidate = 3600;

const STATIC_PAGES: { path: string; changeFrequency: 'daily' | 'weekly' | 'monthly'; priority: number }[] = [
  { path: '', changeFrequency: 'daily', priority: 1 },
  { path: '/shop', changeFrequency: 'daily', priority: 0.9 },
  { path: '/brands', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/request-fragrance', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/shipping-policy', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/returns-refunds', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/privacy-policy', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/terms-conditions', changeFrequency: 'monthly', priority: 0.3 },
];

// One entry per language, each pointing at its other-language twin (hreflang), so Google
// treats /en/… and /ar/… as translations of one page rather than duplicates.
function bothLanguages(
  path: string,
  extra: Omit<MetadataRoute.Sitemap[number], 'url' | 'alternates'>
): MetadataRoute.Sitemap {
  const languages = languageUrls(path);
  return LOCALES.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    alternates: { languages },
    ...extra,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // getAllProducts() only returns products that have a photo, a price and stock,
  // so the sitemap lists exactly what is for sale (every URL here answers 200).
  const products = await ProductService.getAllProducts();

  // No lastModified on static pages: stamping them with "now" on every rebuild tells
  // Google they changed when they didn't, and it then stops trusting lastmod at all.
  const pages = STATIC_PAGES.flatMap((p) =>
    bothLanguages(p.path, { changeFrequency: p.changeFrequency, priority: p.priority })
  );

  const brands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean).map(brandSlug))).filter(Boolean);
  const brandPages = brands.flatMap((slug) =>
    bothLanguages(`/brands/${slug}`, { changeFrequency: 'weekly', priority: 0.7 })
  );

  const productPages = products.flatMap((product) =>
    bothLanguages(`/product/${product.slug}`, {
      ...(product.updatedAt ? { lastModified: new Date(product.updatedAt) } : {}),
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  );

  return [...pages, ...brandPages, ...productPages];
}
