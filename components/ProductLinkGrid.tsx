import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/product";

// Plain server-rendered product links. Unlike the shop's infinite scroll, every product
// here is in the HTML, so search engines can follow the links to each product page.
export default function ProductLinkGrid({ products, locale }: { products: Product[]; locale: string }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-8">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/${locale}/product/${product.slug}`}
          className="group flex flex-col bg-card p-2 sm:p-4 hover:shadow-lg transition-shadow border border-border"
        >
          <div className="relative aspect-square bg-secondary mb-2 sm:mb-4 overflow-hidden border border-border/50">
            <Image
              src={product.images[0] || '/placeholder.jpg'}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider sm:tracking-widest mb-1 line-clamp-1">{product.brand}</span>
          <span className="text-sm sm:text-lg font-serif mb-1 sm:mb-2 group-hover:text-ring transition-colors line-clamp-2 text-foreground">
            {product.name}
          </span>
          <span className="mt-auto text-sm sm:text-base font-medium text-foreground">
            {(product.salePrice || product.price).toFixed(2)} {product.currency}
          </span>
        </Link>
      ))}
    </div>
  );
}
