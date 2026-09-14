export const revalidate = 0; // Disable static caching so it always fetches fresh content

export default async function ShippingPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';
  
  let htmlContent = "";
  try {
    const res = await fetch(`https://abeerx-a9260-default-rtdb.firebaseio.com/abeerx/content/${locale}/shipping-policy.json`, { cache: 'no-store' });
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
        <p>تسعى ABEERX جاهدة لتقديم عطورك الفاخرة بسرعة وأمان. يرجى مراجعة سياسة الشحن الخاصة بنا أدناه.</p>
        <h3 className="text-xl font-medium text-foreground">1. مواقع التوصيل</h3>
        <p>نقدم حاليًا خدمات التوصيل لجميع المحافظات والمناطق داخل دولة الكويت.</p>
        <h3 className="text-xl font-medium text-foreground">2. رسوم التوصيل</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>الطلبات التي تزيد عن 20 دينار كويتي:</strong> توصيل مجاني</li>
          <li><strong>الطلبات التي تقل عن 20 دينار كويتي:</strong> يتم تطبيق رسوم شحن قياسية اعتمادًا على منطقة التوصيل، ويتم حسابها عند الدفع.</li>
        </ul>
      </div>` : `<div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>ABEERX strives to deliver your luxury fragrances quickly and safely. Please review our shipping policy below.</p>
        <h3 className="text-xl font-medium text-foreground">1. Delivery Locations</h3>
        <p>We currently offer delivery services to all governorates and areas within the State of Kuwait.</p>
        <h3 className="text-xl font-medium text-foreground">2. Delivery Fees</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Orders over 20 KWD:</strong> Free Delivery</li>
          <li><strong>Orders under 20 KWD:</strong> A standard shipping fee applies depending on the delivery area, calculated at checkout.</li>
        </ul>
      </div>`;
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl min-h-[60vh]">
      <h1 className="text-4xl font-serif text-foreground mb-8 text-center">
        {isArabic ? `سياسة الشحن` : `Shipping Policy`}
      </h1>
      <div 
        className="bg-background border border-border p-8 md:p-12 shadow-sm web-editor-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
