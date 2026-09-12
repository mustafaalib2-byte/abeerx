import Link from "next/link";
import { ProductService } from "@/services/ProductService";

export const revalidate = 60;

export default async function BrandsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';
  
  const products = await ProductService.getAllProducts();
  const uniqueBrands = Array.from(new Set(products.map(p => p.brand))).filter(Boolean).sort();
  
  // Group brands by first letter
  const groupedBrands: Record<string, string[]> = {};
  uniqueBrands.forEach(brand => {
    const firstLetter = brand.charAt(0).toUpperCase();
    if (!groupedBrands[firstLetter]) groupedBrands[firstLetter] = [];
    groupedBrands[firstLetter].push(brand);
  });

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-serif mb-8 text-foreground">
          {isArabic ? "ماركاتنا" : "Our Brands"}
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-muted-foreground font-light leading-relaxed">
          {isArabic 
            ? "اكتشف مجموعتنا الحصرية من أرقى دور العطور الفاخرة في العالم، مرتبة أبجدياً لراحتك."
            : "Discover our exclusive collection of the world's most prestigious luxury perfume houses, organized alphabetically for your convenience."}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {Object.keys(groupedBrands).sort().map(letter => (
          <div key={letter} className="mb-8">
            <h2 className="text-3xl font-serif border-b border-border pb-2 mb-6 text-foreground">{letter}</h2>
            <ul className="space-y-3">
              {groupedBrands[letter].map(brand => (
                <li key={brand}>
                  <Link href={`/${locale}/shop`} className="text-lg text-muted-foreground hover:text-ring transition-colors block">
                    {brand}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}