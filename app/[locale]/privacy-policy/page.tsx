export default async function PrivacyPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl min-h-[60vh]">
      <h1 className="text-4xl font-serif text-foreground mb-8 text-center">
        {isArabic ? `سياسة الخصوصية` : `Privacy Policy`}
      </h1>
      <div className="bg-background border border-border p-8 md:p-12 shadow-sm">
        {isArabic ? (
          <>
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>في ABEERX، نحن ملتزمون بحماية خصوصيتك وضمان التعامل مع معلوماتك الشخصية بطريقة آمنة ومسؤولة وفقًا لقوانين دولة الكويت.</p>
        
        <h3 className="text-xl font-medium text-foreground">1. المعلومات التي نجمعها</h3>
        <p>عندما تزور موقعنا الإلكتروني أو تقدم طلبًا أو تتصل بنا، قد نقوم بجمع معلومات شخصية بما في ذلك اسمك وعنوان بريدك الإلكتروني ورقم هاتفك وعنوان الشحن ومعلومات الدفع.</p>

        <h3 className="text-xl font-medium text-foreground">2. كيف نستخدم معلوماتك</h3>
        <p>تُستخدم معلوماتك بشكل صارم لمعالجة طلباتك وتلبيتها، والتواصل معك بشأن عملية الشراء، وبموافقتك، إرسال العروض الترويجية والتحديثات حول ABEERX إليك.</p>

        <h3 className="text-xl font-medium text-foreground">3. مشاركة البيانات وأمنها</h3>
        <p>نحن لا نبيع أو نتاجر أو نؤجر معلومات الهوية الشخصية الخاصة بك للآخرين. نحن نشارك المعلومات الديموغرافية المجمعة العامة غير المرتبطة بأي معلومات هوية شخصية بخصوص الزوار والمستخدمين مع شركائنا التجاريين والشركات التابعة الموثوقة للأغراض الموضحة أعلاه. نعتمد ممارسات جمع البيانات وتخزينها ومعالجتها والتدابير الأمنية المناسبة للحماية من الوصول غير المصرح به.</p>

        <h3 className="text-xl font-medium text-foreground">4. ملفات تعريف الارتباط (الكوكيز)</h3>
        <p>قد يستخدم موقعنا "ملفات تعريف الارتباط" لتعزيز تجربة المستخدم. يمكنك اختيار ضبط متصفح الويب الخاص بك لرفض ملفات تعريف الارتباط، أو لتنبيهك عند إرسال ملفات تعريف الارتباط.</p>
      </div>
    </>
        ) : (
          <>
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>At ABEERX, we are committed to protecting your privacy and ensuring your personal information is handled in a safe and responsible manner in accordance with the laws of the State of Kuwait.</p>
        
        <h3 className="text-xl font-medium text-foreground">1. Information We Collect</h3>
        <p>When you visit our website, place an order, or contact us, we may collect personal information including your name, email address, phone number, shipping address, and payment information.</p>

        <h3 className="text-xl font-medium text-foreground">2. How We Use Your Information</h3>
        <p>Your information is used strictly to process and fulfill your orders, communicate with you regarding your purchase, and, with your consent, send you promotional offers and updates about ABEERX.</p>

        <h3 className="text-xl font-medium text-foreground">3. Data Sharing and Security</h3>
        <p>We do not sell, trade, or rent your personal identification information to others. We share generic aggregated demographic information not linked to any personal identification information regarding visitors and users with our business partners and trusted affiliates for the purposes outlined above. We adopt appropriate data collection, storage, and processing practices and security measures to protect against unauthorized access.</p>

        <h3 className="text-xl font-medium text-foreground">4. Cookies</h3>
        <p>Our site may use "cookies" to enhance user experience. You may choose to set your web browser to refuse cookies, or to alert you when cookies are being sent.</p>
      </div>
    </>
        )}
      </div>
    </div>
  );
}
