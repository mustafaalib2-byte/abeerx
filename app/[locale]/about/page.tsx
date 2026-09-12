import Link from "next/link";

export const revalidate = 60;

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';
  
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="text-4xl md:text-5xl font-serif mb-8 text-foreground">
        {isArabic ? "تراثنا" : "Our Legacy"}
      </h1>
      <p className="max-w-3xl mx-auto text-lg text-muted-foreground font-light leading-relaxed mb-12">
        {isArabic
          ? "عبير إكس ولدت من شغف عميق بفن صناعة العطور. التزامنا بالجودة والفخامة والأصالة متجذر في تراث الكويت العريق، حيث نجلب لكم أرقى الروائح من جميع أنحاء العالم لتكوين ذكريات تدوم مدى الحياة."
          : "ABEERX was born from a profound passion for the art of perfumery. Rooted in Kuwait's rich heritage, our commitment to quality, luxury, and authenticity drives us to bring you the finest scents from around the globe, crafting memories that last a lifetime."}
      </p>
      <Link href={'/' + locale + '/shop'} className="inline-block bg-ring text-white px-8 py-4 text-sm tracking-widest uppercase font-bold hover:bg-black transition-colors">
        {isArabic ? "اكتشف مجموعتنا" : "Discover Our Collection"}
      </Link>
    </div>
  );
}