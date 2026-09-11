import { NextResponse } from 'next/server';
import { ProductService } from '@/services/ProductService';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://abeerx.com';

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

export async function GET() {
  try {
    const products = await ProductService.getAllProducts();

    const itemsXml = products.map(product => {
      const isAvailable = product.isAvailable ? 'in_stock' : 'out_of_stock';
      const imageLink = product.images?.[0]?.startsWith('http') 
        ? product.images[0] 
        : `${SITE_URL}${product.images[0]}`;

      return `
      <item>
        <g:id>${escapeXml(product.sku)}</g:id>
        <g:title>${escapeXml(product.name)}</g:title>
        <g:description>${escapeXml(product.description || product.shortDescription)}</g:description>
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
