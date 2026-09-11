import { ProductService } from "@/services/ProductService";
import Link from "next/link";
import Image from "next/image";

export default async function ShopPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';
  
  // Fetch all products (with filters applied in production via searchParams)
  const products = await ProductService.getAllProducts();

  return (
    <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-8">
      
      {/* Sidebar Filters */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <h2 className="font-serif text-xl mb-6 border-b border-border pb-2 text-foreground">
          {isArabic ? "التصفية" : "Filter"}
        </h2>
        
        {/* Mock Filter Sections */}
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-3 text-sm tracking-wider uppercase text-foreground">{isArabic ? "الماركة" : "Brand"}</h3>
            <div className="space-y-2">
              {['Faiz Perfumes', 'Dior', 'Chanel', 'Tom Ford'].map(brand => (
                <label key={brand} className="flex items-center space-x-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  <input type="checkbox" className="rounded border-border text-ring focus:ring-ring" />
                  <span>{brand}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-3 text-sm tracking-wider uppercase text-foreground">{isArabic ? "العائلة العطرية" : "Fragrance Family"}</h3>
            <div className="space-y-2">
              {['Oriental', 'Floral', 'Woody', 'Fresh'].map(family => (
                <label key={family} className="flex items-center space-x-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  <input type="checkbox" className="rounded border-border text-ring focus:ring-ring" />
                  <span>{family}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Product Grid */}
      <div className="flex-grow">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif text-foreground">{isArabic ? "جميع العطور" : "All Fragrances"}</h1>
          <select className="border border-border bg-transparent text-sm p-2 text-foreground focus:outline-none focus:border-ring">
            <option>{isArabic ? "الأحدث" : "Newest"}</option>
            <option>{isArabic ? "السعر: من الأقل للأعلى" : "Price: Low to High"}</option>
            <option>{isArabic ? "السعر: من الأعلى للأقل" : "Price: High to Low"}</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map(product => (
            <div key={product.id} className="group flex flex-col bg-card p-4 hover:shadow-lg transition-shadow border border-border">
              <div className="relative aspect-square bg-secondary mb-4 overflow-hidden border border-border/50">
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-[#F9F9F9]">
                  <span className="font-serif text-sm">Image Placeholder</span>
                </div>
                {product.isNewArrival && (
                  <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] uppercase tracking-wider px-2 py-1 z-10">
                    New
                  </span>
                )}
              </div>
              <div className="flex-grow flex flex-col">
                <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{product.brand}</span>
                <Link href={`/${locale}/product/${product.slug}`} className="text-lg font-serif mb-2 group-hover:text-ring transition-colors line-clamp-1 text-foreground">
                  {product.name}
                </Link>
                <div className="mt-auto flex items-center justify-between text-foreground">
                  <span className="font-medium">{product.price.toFixed(2)} {product.currency}</span>
                  <button className="text-xs uppercase tracking-wider font-bold hover:text-ring transition-colors">
                    {isArabic ? "أضف للسلة" : "Add to Cart"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
