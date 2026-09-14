export const revalidate = 0; // Disable static caching so it always fetches fresh content

export default async function RequestFragrancePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';
  
  let htmlContent = "";
  try {
    const res = await fetch(`https://abeerx-a9260-default-rtdb.firebaseio.com/abeerx/content/${locale}/request-fragrance.json`, { cache: 'no-store' });
    const data = await res.json();
    if (data && data.body) {
      htmlContent = data.body;
    }
  } catch (e) {
    console.error(e);
  }

  // Fallback to hardcoded content if database is empty
  if (!htmlContent) {
    htmlContent = isArabic ? `<div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>هل تبحث عن عطر معين غير مدرج حاليًا على موقعنا؟ يمكن أن تساعدك ABEERX في الحصول عليه!</p>
        <p>يرجى الاتصال بنا مع تفاصيل العطر الذي تبحث عنه (العلامة التجارية، الاسم، التركيز، والحجم).</p>
      </div>` : `<div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>Looking for a specific perfume that is not currently listed on our website? ABEERX can help source it for you!</p>
        <p>Please contact us with the details of the fragrance you are looking for (Brand, Name, Concentration, and Size).</p>
      </div>`;
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl min-h-[60vh]">
      <h1 className="text-4xl font-serif text-foreground mb-8 text-center">
        {isArabic ? `اطلب عطراً` : `Request a Fragrance`}
      </h1>
      <div 
        className="bg-background border border-border p-8 md:p-12 shadow-sm web-editor-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
