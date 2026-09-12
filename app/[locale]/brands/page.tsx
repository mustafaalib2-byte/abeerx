import Link from "next/link";

export const revalidate = 60;

export default async function BrandsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';
  
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="text-4xl md:text-5xl font-serif mb-8 text-foreground">
        {isArabic ? "ماركاتنا" : "Our Brands"}
      </h1>
      <p className="max-w-2xl mx-auto text-lg text-muted-foreground font-light leading-relaxed mb-12">
        {isArabic 
          ? "في عبير إكس، نقوم برعاية مجموعة حصرية من أرقى دور العطور الفاخرة في العالم. يجري حالياً تجميع قائمة ماركاتنا المميزة."
          : "At ABEERX, we curate an exclusive collection of the world's most prestigious luxury perfume houses. Our brand portfolio is currently being assembled."}
      </p>
      <Link href={'/' + locale + '/shop'} className="inline-block bg-ring text-white px-8 py-4 text-sm tracking-widest uppercase font-bold hover:bg-black transition-colors">
        {isArabic ? "تسوق جميع العطور" : "Shop All Perfumes"}
      </Link>
    </div>
  );
}