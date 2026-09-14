export const revalidate = 0; // Disable static caching so it always fetches fresh content

export default async function TermsConditionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';
  
  let htmlContent = "";
  try {
    const res = await fetch(`https://abeerx-a9260-default-rtdb.firebaseio.com/abeerx/content/${locale}/terms-conditions.json`, { cache: 'no-store' });
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
        <p>مرحبًا بك في ABEERX. من خلال الوصول إلى هذا الموقع، نفترض أنك تقبل هذه الشروط والأحكام. لا تستمر في استخدام ABEERX إذا كنت لا توافق على أخذ جميع الشروط والأحكام المذكورة في هذه الصفحة.</p>
        <h3 className="text-xl font-medium text-foreground">1. معلومات عامة</h3>
        <p>ABEERX هو كيان تجاري مسجل يعمل في دولة الكويت. يقع متجرنا الفعلي في: مدينة الكويت - المباركية، الغربللي، بالقرب من مركز لؤلؤة - محل رقم 7. للتواصل: +965 98521807.</p>
      </div>` : `<div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>Welcome to ABEERX. By accessing this website, we assume you accept these terms and conditions. Do not continue to use ABEERX if you do not agree to take all of the terms and conditions stated on this page.</p>
        <h3 className="text-xl font-medium text-foreground">1. General Information</h3>
        <p>ABEERX is a registered commercial entity operating in the State of Kuwait. Our physical store is located at: Kuwait City - Al-Mubarakiyah, Gharabally, near Luluwa Center - Shop No. 7. Contact: +965 98521807.</p>
      </div>`;
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl min-h-[60vh]">
      <h1 className="text-4xl font-serif text-foreground mb-8 text-center">
        {isArabic ? `الشروط والأحكام` : `Terms & Conditions`}
      </h1>
      <div 
        className="bg-background border border-border p-8 md:p-12 shadow-sm web-editor-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
