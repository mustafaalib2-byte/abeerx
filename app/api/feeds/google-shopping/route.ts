import { NextResponse } from 'next/server';
import { ProductService } from '@/services/ProductService';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.abeerx.com';

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

    // Only what can actually be bought today: a real photo, a selling price above zero and
    // stock on the shelf. One feed item per in-stock size/tester so every price is correct.
    type FeedItem = { id: string; groupId: string; title: string; price: number; product: any };
    const items: FeedItem[] = [];
    for (const product of products as any[]) {
      if (!product.sku || !product.name || !getImageLink(product)) continue;
      const variants: any[] = Array.isArray(product.variants) ? product.variants : [];
      if (variants.length > 0) {
        variants.forEach((v, i) => {
          const price = Number(v.price);
          if (!(price > 0) || !(Number(v.stock) > 0)) return;
          const label = [v.size, v.isTester ? 'Tester' : ''].filter(Boolean).join(' ');
          items.push({
            id: String(v.sku || v.key || `${product.sku}-${i}`),
            groupId: String(product.sku),
            title: label ? `${product.name} - ${label}` : product.name,
            price,
            product,
          });
        });
      } else if (Number(product.price) > 0 && Number(product.totalStock) > 0) {
        items.push({ id: String(product.sku), groupId: String(product.sku), title: product.name, price: Number(product.price), product });
      }
    }

    const seen = new Set<string>();
    const itemsXml = items
      .filter(it => (seen.has(it.id) ? false : (seen.add(it.id), true)))
      .map(it => {
        const product = it.product;
        const imageLink = getImageLink(product) as string;
        const title = sanitizeText(it.title);
        const description = sanitizeText(product.description || product.shortDescription) || title;

        return `
      <item>
        <g:id>${escapeXml(it.id)}</g:id>
        <g:item_group_id>${escapeXml(it.groupId)}</g:item_group_id>
        <g:title>${escapeXml(title)}</g:title>
        <g:description>${escapeXml(description)}</g:description>
        <g:link>${SITE_URL}/en/product/${product.slug}</g:link>
        <g:image_link>${escapeXml(imageLink)}</g:image_link>
        <g:condition>new</g:condition>
        <g:availability>in_stock</g:availability>
        <g:price>${it.price.toFixed(3)} KWD</g:price>
        <g:brand>${escapeXml(sanitizeText(product.brand))}</g:brand>
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
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      }
    });

  } catch (error) {
    console.error("GMC Feed Generation Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
