import { MetadataRoute } from 'next'
import { ProductService } from '@/services/ProductService'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://abeerx.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await ProductService.getAllProducts();
  
  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/en/product/${product.slug}`,
    lastModified: product.updatedAt || new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const productEntriesArabic: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/ar/product/${product.slug}`,
    lastModified: product.updatedAt || new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: `${SITE_URL}/en`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/ar`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/en/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/ar/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...productEntries,
    ...productEntriesArabic,
  ];
}
