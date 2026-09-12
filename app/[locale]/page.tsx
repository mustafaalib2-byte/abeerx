export const revalidate = 60;
import { ProductService } from "@/services/ProductService";
import Link from "next/link";
import Image from "next/image";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';
  
  // Fetch featured products using our Data Access Layer
  const featuredProducts = await ProductService.getFeaturedProducts();

  return (
    <div className="flex flex-col w-full">
      {/* 1. Premium Hero Section */}
      <section className="relative w-full h-[80vh] bg-secondary flex items-center justify-center overflow-hidden">
        {/* We would use next/image here, but using a styled div for placeholder until assets are uploaded */}
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=2000')] bg-cover bg-center" />
        
        <div className="relative z-20 text-center text-white px-4 max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight">
            {isArabic ? "اكتشف عطرك المميز" : "Discover Your Signature Scent"}
          </h1>
          <p className="text-lg md:text-xl font-light mb-10 opacity-90">
            {isArabic ? "مجموعة حصرية من العطور الفاخرة والأصلية في الكويت." : "An exclusive collection of authentic luxury perfumes curated for Kuwait."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href={`/${locale}/shop`}
              className="bg-ring text-white px-8 py-4 text-sm tracking-widest uppercase font-bold hover:bg-black transition-colors w-full sm:w-auto"
            >
              {isArabic ? "تسوق الآن" : "Shop Now"}
            </Link>
            <Link 
              href={`/${locale}/collections`}
              className="bg-transparent border border-white text-white px-8 py-4 text-sm tracking-widest uppercase font-bold hover:bg-white hover:text-black transition-colors w-full sm:w-auto"
            >
              {isArabic ? "استكشف المجموعة" : "Explore Collection"}
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Featured Categories */}
      <section className="py-20 px-4 container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {['Women', 'Men', 'Unisex', 'Oud'].map((category) => (
            <Link href={`/${locale}/category/${category.toLowerCase()}`} key={category} className="group cursor-pointer">
              <div className="aspect-square bg-secondary flex items-center justify-center relative overflow-hidden mb-4 border border-border">
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/20 transition-all duration-300 z-10" />
                <span className="text-xl font-serif z-20 relative text-foreground">{category}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Best Sellers / Featured Products (Data from Firebase Adapter) */}
      <section className="py-20 bg-secondary px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif mb-4 text-foreground">
              {isArabic ? "العطور المميزة" : "Featured Fragrances"}
            </h2>
            <div className="w-16 h-[1px] bg-ring mx-auto" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map(product => (
              <div key={product.id} className="group flex flex-col bg-card p-4 hover:shadow-lg transition-shadow border border-border">
                <div className="relative aspect-square bg-secondary mb-4 overflow-hidden">
                  <Image 
                  src={product.images[0] || '/placeholder.jpg'} 
                  alt={product.name} 
                  fill 
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500" 
                />
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
      </section>

      {/* 4. Trust Section */}
      <section className="py-20 border-t border-border px-4 bg-background">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-center text-foreground">
          <div>
            <h3 className="font-serif text-lg mb-2">100% Authentic</h3>
            <p className="text-sm text-muted-foreground">Guaranteed original luxury perfumes.</p>
          </div>
          <div>
            <h3 className="font-serif text-lg mb-2">Fast Delivery</h3>
            <p className="text-sm text-muted-foreground">Express delivery across all of Kuwait.</p>
          </div>
          <div>
            <h3 className="font-serif text-lg mb-2">Secure Payment</h3>
            <p className="text-sm text-muted-foreground">KNET, Visa, Mastercard, Apple Pay.</p>
          </div>
          <div>
            <h3 className="font-serif text-lg mb-2">Expert Support</h3>
            <p className="text-sm text-muted-foreground">Dedicated perfume specialists via WhatsApp.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
