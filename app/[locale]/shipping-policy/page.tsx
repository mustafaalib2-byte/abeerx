export default async function ShippingPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl min-h-[60vh]">
      <h1 className="text-4xl font-serif text-foreground mb-8 text-center">
        {isArabic ? `سياسة الشحن` : `Shipping Policy`}
      </h1>
      <div className="bg-background border border-border p-8 md:p-12 shadow-sm">
        {isArabic ? (
          <>
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>تسعى ABEERX جاهدة لتقديم عطورك الفاخرة بسرعة وأمان. يرجى مراجعة سياسة الشحن الخاصة بنا أدناه.</p>
        
        <h3 className="text-xl font-medium text-foreground">1. مواقع التوصيل</h3>
        <p>نقدم حاليًا خدمات التوصيل لجميع المحافظات والمناطق داخل دولة الكويت.</p>

        <h3 className="text-xl font-medium text-foreground">2. رسوم التوصيل</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>الطلبات التي تزيد عن 20 دينار كويتي:</strong> توصيل مجاني</li>
          <li><strong>الطلبات التي تقل عن 20 دينار كويتي:</strong> يتم تطبيق رسوم شحن قياسية اعتمادًا على منطقة التوصيل، ويتم حسابها عند الدفع.</li>
        </ul>

        <h3 className="text-xl font-medium text-foreground">3. وقت المعالجة والتوصيل</h3>
        <p>تتم معالجة الطلبات عادة في غضون 24 ساعة. وقت التوصيل القياسي هو من يوم إلى يومي عمل. إذا كنت بحاجة إلى توصيل سريع، يرجى الاتصال بفريق الدعم لدينا.</p>

        <h3 className="text-xl font-medium text-foreground">4. تتبع طلبك</h3>
        <p>بمجرد إرسال طلبك، ستتلقى رسالة تأكيد أو بريدًا إلكترونيًا. سيتصل بك فريق التوصيل لدينا أيضًا في يوم التوصيل للتأكد من تواجدك.</p>
      </div>
    </>
        ) : (
          <>
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>ABEERX strives to deliver your luxury fragrances quickly and safely. Please review our shipping policy below.</p>
        
        <h3 className="text-xl font-medium text-foreground">1. Delivery Locations</h3>
        <p>We currently offer delivery services to all governorates and areas within the State of Kuwait.</p>

        <h3 className="text-xl font-medium text-foreground">2. Delivery Fees</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Orders over 20 KWD:</strong> Free Delivery</li>
          <li><strong>Orders under 20 KWD:</strong> A standard shipping fee applies depending on the delivery area, calculated at checkout.</li>
        </ul>

        <h3 className="text-xl font-medium text-foreground">3. Processing and Delivery Time</h3>
        <p>Orders are typically processed within 24 hours. Standard delivery time is 1 to 2 business days. If you require expedited delivery, please contact our support team.</p>

        <h3 className="text-xl font-medium text-foreground">4. Tracking Your Order</h3>
        <p>Once your order is dispatched, you will receive a confirmation message or email. Our delivery team will also contact you on the day of delivery to ensure you are available.</p>
      </div>
    </>
        )}
      </div>
    </div>
  );
}
