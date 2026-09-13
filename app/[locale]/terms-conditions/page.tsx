export default async function TermsConditionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl min-h-[60vh]">
      <h1 className="text-4xl font-serif text-foreground mb-8 text-center">
        {isArabic ? `الشروط والأحكام` : `Terms & Conditions`}
      </h1>
      <div className="bg-background border border-border p-8 md:p-12 shadow-sm">
        {isArabic ? (
          <>
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>مرحبًا بك في ABEERX. من خلال الوصول إلى هذا الموقع، نفترض أنك تقبل هذه الشروط والأحكام. لا تستمر في استخدام ABEERX إذا كنت لا توافق على أخذ جميع الشروط والأحكام المذكورة في هذه الصفحة.</p>
        
        <h3 className="text-xl font-medium text-foreground">1. معلومات عامة</h3>
        <p>ABEERX هو كيان تجاري مسجل يعمل في دولة الكويت. يقع متجرنا الفعلي في: مدينة الكويت - المباركية، الغربللي، بالقرب من مركز لؤلؤة - محل رقم 7. للتواصل: +965 98521807.</p>

        <h3 className="text-xl font-medium text-foreground">2. التسعير والدفع</h3>
        <p>جميع الأسعار المدرجة على موقعنا هي بالدينار الكويتي (KWD). نحتفظ بالحق في تغيير الأسعار في أي وقت دون إشعار. نحن نقبل أشكالًا مختلفة من الدفع الآمن عبر الإنترنت والدفع عند الاستلام (COD) בכפוף للتحقق.</p>

        <h3 className="text-xl font-medium text-foreground">3. معلومات المنتج</h3>
        <p>نحن نبذل قصارى جهدنا لعرض ألوان وصور منتجاتنا بدقة قدر الإمكان. لا نضمن أن جودة أي منتجات أو خدمات أو معلومات أو مواد أخرى تشتريها ستلبي توقعاتك الشخصية بشكل مثالي.</p>

        <h3 className="text-xl font-medium text-foreground">4. القانون الحاكم</h3>
        <p>تخضع هذه الشروط والأحكام وتفسر وفقًا لقوانين دولة الكويت، وأنت تخضع بشكل لا رجعة فيه للاختصاص الحصري للمحاكم في الكويت.</p>
      </div>
    </>
        ) : (
          <>
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>Welcome to ABEERX. By accessing this website, we assume you accept these terms and conditions. Do not continue to use ABEERX if you do not agree to take all of the terms and conditions stated on this page.</p>
        
        <h3 className="text-xl font-medium text-foreground">1. General Information</h3>
        <p>ABEERX is a registered commercial entity operating in the State of Kuwait. Our physical store is located at: Kuwait City - Al-Mubarakiyah, Gharabally, near Luluwa Center - Shop No. 7. Contact: +965 98521807.</p>

        <h3 className="text-xl font-medium text-foreground">2. Pricing and Payment</h3>
        <p>All prices listed on our website are in Kuwaiti Dinars (KWD). We reserve the right to change prices at any time without notice. We accept various forms of secure online payment and Cash on Delivery (COD) subject to verification.</p>

        <h3 className="text-xl font-medium text-foreground">3. Product Information</h3>
        <p>We make every effort to display as accurately as possible the colors and images of our products. We do not warrant that the quality of any products, services, information, or other material purchased by you will perfectly meet your subjective expectations.</p>

        <h3 className="text-xl font-medium text-foreground">4. Governing Law</h3>
        <p>These terms and conditions are governed by and construed in accordance with the laws of the State of Kuwait, and you irrevocably submit to the exclusive jurisdiction of the courts in Kuwait.</p>
      </div>
    </>
        )}
      </div>
    </div>
  );
}
