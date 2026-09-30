import { NextResponse } from 'next/server';
import { ProductService } from '@/services/ProductService';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abeerx.com';
const PLACEHOLDER_IMAGE = `${SITE_URL}/placeholder.jpg`;

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// Strips the Unicode replacement character and other non-printable/control
// characters that sometimes sneak into the Firebase product data, so we
// never emit a corrupted title/description like "212 MEN NYC EDT 100 ML�".
function sanitizeText(value: unknown): string {
  if (!value) return '';
  return String(value)
    .replace(/�/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim();
}

function getImageLink(product: any): string | null {
  const rawImage = Array.isArray(product.images) ? product.images[0] : undefined;
  if (!rawImage || typeof rawImage !== 'string') return null;
  if (rawImage.startsWith('http')) return rawImage;
  return `${SITE_URL}${rawImage}`;
}

export async function GET() {
  try {
    const products = await ProductService.getAllProducts();

    const itemsXml = products
      // Google rejects items with no usable image anyway, so skip products
      // that have neither a real image nor an id/name instead of emitting
      // a broken "https://...undefined" link.
      .filter(product => !!product.sku && !!product.name)
      .map(product => {
        const isAvailable = product.isAvailable ? 'in_stock' : 'out_of_stock';
        const imageLink = getImageLink(product) || PLACEHOLDER_IMAGE;
        const title = sanitizeText(product.name);
        const description = sanitizeText(product.description || product.shortDescription) || title;

        return `
      <item>
        <g:id>${escapeXml(product.sku)}</g:id>
        <g:title>${escapeXml(title)}</g:title>
        <g:description>${escapeXml(description)}</g:description>
        <g:link>${SITE_URL}/en/product/${product.slug}</g:link>
        <g:image_link>${escapeXml(imageLink)}</g:image_link>
        <g:condition>new</g:condition>
        <g:availability>${isAvailable}</g:availability>
        <g:price>${product.price} KWD</g:price>
        <g:brand>${escapeXml(product.brand)}</g:brand>
        <g:google_product_category>Health &amp; Beauty &gt; Personal Care &gt; Cosmetics &gt; Perfume &amp; Cologne</g:google_product_category>
      </item>
      `;
      }).join('');

    const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
    <rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
      <channel>
        <title>ABEERX Luxury Perfumes</title>
        <link>${SITE_URL}</link>
        <description>Authentic luxury perfumes delivered across Kuwait.</description>
        ${itemsXml}
      </channel>
    </rss>`;

    return new NextResponse(feedXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 's-maxage=86400, stale-while-revalidate',
      }
    });

  } catch (error) {
    console.error("GMC Feed Generation Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
