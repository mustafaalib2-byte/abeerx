import { NextResponse } from 'next/server';
import { ProductService } from '@/services/ProductService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';

    const products = await ProductService.getAllProducts();

    const scored = products.map(p => {
      let score = 0;
      const target = `${p.name} ${p.brand || ''}`.toLowerCase();
      
      if (query) {
        if (target.includes(query)) {
          score += 100;
        } else {
           // Word match
           const words = query.split(' ').filter(Boolean);
           let wordMatches = 0;
           words.forEach(w => { if (target.includes(w)) wordMatches += 1; });
           score += (wordMatches / Math.max(words.length, 1)) * 50;

           // Character match
           let charMatches = 0;
           for (const char of query) {
             if (target.includes(char)) charMatches += 1;
           }
           score += (charMatches / Math.max(query.length, 1)) * 10;
        }
      } else {
         score = p.isAvailable ? 10 : 0;
      }
      return { product: p, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Take top 6 results
    const top = scored.slice(0, 6).map(s => ({
      name: s.product.name,
      brand: s.product.brand,
      image: s.product.images[0] || '/placeholder.jpg',
      slug: s.product.slug || s.product.id.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      price: s.product.price,
      salePrice: s.product.salePrice,
      currency: s.product.currency
    }));

    return NextResponse.json(top);
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json([], { status: 500 });
  }
}