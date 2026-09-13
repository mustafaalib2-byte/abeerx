export default async function RequestFragrancePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl min-h-[60vh]">
      <h1 className="text-4xl font-serif text-foreground mb-8 text-center">
        {isArabic ? `اطلب عطراً` : `Request a Fragrance`}
      </h1>
      <div className="bg-background border border-border p-8 md:p-12 shadow-sm">
        {isArabic ? (
          <>
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>هل تبحث عن عطر معين غير مدرج حاليًا على موقعنا؟ يمكن أن تساعدك ABEERX في الحصول عليه!</p>
        <p>يرجى الاتصال بنا مع تفاصيل العطر الذي تبحث عنه (العلامة التجارية، الاسم، التركيز، والحجم).</p>
        
        <div className="bg-secondary p-8 border border-border mt-8">
          <h3 className="text-xl font-serif text-foreground mb-4">معلومات الاتصال</h3>
          <ul className="space-y-3">
            <li><strong>الهاتف / واتساب:</strong> +965 98521807</li>
            <li><strong>موقع المتجر:</strong> مدينة الكويت - المباركية، الغربللي، بالقرب من مركز لؤلؤة - محل رقم 7</li>
          </ul>
          <p className="mt-6">سنعود إليك بالتوفر والسعر في أقرب وقت ممكن.</p>
        </div>
      </div>
    </>
        ) : (
          <>
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>Looking for a specific perfume that is not currently listed on our website? ABEERX can help source it for you!</p>
        <p>Please contact us with the details of the fragrance you are looking for (Brand, Name, Concentration, and Size).</p>
        
        <div className="bg-secondary p-8 border border-border mt-8">
          <h3 className="text-xl font-serif text-foreground mb-4">Contact Information</h3>
          <ul className="space-y-3">
            <li><strong>Phone / WhatsApp:</strong> +965 98521807</li>
            <li><strong>Store Location:</strong> Kuwait City - Al-Mubarakiyah, Gharabally, near Luluwa Center - Shop No. 7</li>
          </ul>
          <p className="mt-6">We will get back to you with availability and pricing as soon as possible.</p>
        </div>
      </div>
    </>
        )}
      </div>
    </div>
  );
}
