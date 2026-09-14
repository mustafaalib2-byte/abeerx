export const revalidate = 0; // Disable static caching so it always fetches fresh content

export default async function FAQPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';
  
  let htmlContent = "";
  try {
    const res = await fetch(`https://abeerx-a9260-default-rtdb.firebaseio.com/abeerx/content/${locale}/faq.json`, { cache: 'no-store' });
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
        <h3 className="text-xl font-medium text-foreground">1. أين تقومون بالتوصيل؟</h3>
        <p>نقوم بالتوصيل إلى جميع المناطق في دولة الكويت. نحن نضمن توصيلاً سريعًا وآمنًا مباشرة إلى باب منزلك.</p>
        <h3 className="text-xl font-medium text-foreground">2. كم تكلفة الشحن؟</h3>
        <p>التوصيل مجاني تمامًا لجميع الطلبات التي تزيد عن 20 دينار كويتي. للطلبات الأقل من هذا المبلغ، يتم تطبيق رسوم توصيل قياسية بناءً على موقعك الدقيق في الكويت.</p>
        <h3 className="text-xl font-medium text-foreground">3. كم من الوقت سيستغرق التوصيل؟</h3>
        <p>يستغرق التوصيل القياسي داخل الكويت عادة من يوم إلى يومي عمل. إذا قمت بتقديم طلبك مبكرًا في اليوم، فإننا نسعى جاهدين للتوصيل في اليوم التالي.</p>
        <h3 className="text-xl font-medium text-foreground">4. هل عطوركم أصلية؟</h3>
        <p>نعم. تضمن ABEERX أن جميع العطور المباعة على منصتنا أصلية 100٪ ويتم الحصول عليها مباشرة من الموزعين والعلامات التجارية المعتمدة.</p>
        <h3 className="text-xl font-medium text-foreground">5. هل يمكنني إرجاع عطر؟</h3>
        <p>نعم، يمكنك إرجاع منتج خلال 14 يومًا من استلامه، بشرط أن يكون غير مفتوح وغير مستخدم وفي عبوته الأصلية المغلقة. يرجى الرجوع إلى سياسة الإرجاع والاسترداد الخاصة بنا للحصول على التفاصيل الكاملة.</p>
      </div>` : `<div className="space-y-6 text-muted-foreground leading-relaxed">
        <h3 className="text-xl font-medium text-foreground">1. Where do you deliver?</h3>
        <p>We deliver across all areas in the State of Kuwait. We ensure fast and secure delivery directly to your doorstep.</p>
        <h3 className="text-xl font-medium text-foreground">2. How much does shipping cost?</h3>
        <p>Delivery is absolutely free for all orders over 20 KWD. For orders below this amount, a standard delivery fee applies based on your exact location in Kuwait.</p>
        <h3 className="text-xl font-medium text-foreground">3. How long will my delivery take?</h3>
        <p>Standard delivery within Kuwait typically takes 1 to 2 business days. If you place your order early in the day, we strive for next-day delivery.</p>
        <h3 className="text-xl font-medium text-foreground">4. Are your perfumes authentic?</h3>
        <p>Yes. ABEERX guarantees that all fragrances sold on our platform are 100% authentic and sourced directly from authorized distributors and brands.</p>
        <h3 className="text-xl font-medium text-foreground">5. Can I return a perfume?</h3>
        <p>Yes, you can return a product within 14 days of receipt, provided it is unopened, unused, and in its original sealed packaging. Please refer to our Returns & Refunds Policy for full details.</p>
      </div>`;
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl min-h-[60vh]">
      <h1 className="text-4xl font-serif text-foreground mb-8 text-center">
        {isArabic ? `الأسئلة الشائعة` : `Frequently Asked Questions (FAQs)`}
      </h1>
      <div 
        className="bg-background border border-border p-8 md:p-12 shadow-sm web-editor-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
