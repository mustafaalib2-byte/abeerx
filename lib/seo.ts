import type { Metadata } from "next";

// Always the canonical (www) address, so it matches the Search Console property.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abeerx.com').replace(/\/$/, '');

export const LOCALES = ['en', 'ar'] as const;
export const DEFAULT_LOCALE = 'en';

// Brand names like "D&G" or "YSL" become URL-safe slugs: "d-g", "ysl".
export const brandSlug = (brand: string) =>
  brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// The language versions of one page, e.g. path "/shop" -> /en/shop and /ar/shop.
export function languageUrls(path: string): Record<string, string> {
  return {
    en: `${SITE_URL}/en${path}`,
    ar: `${SITE_URL}/ar${path}`,
    'x-default': `${SITE_URL}/${DEFAULT_LOCALE}${path}`,
  };
}

// Self-referencing canonical plus hreflang links for a page. Query strings (filters,
// ?gclid=, utm_…) are never part of the canonical, so filtered views don't count as
// separate pages in Google.
export function pageAlternates(locale: string, path: string): Metadata['alternates'] {
  return {
    canonical: `${SITE_URL}/${locale}${path}`,
    languages: languageUrls(path),
  };
}
