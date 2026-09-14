export const revalidate = 0; // Disable static caching so it always fetches fresh content

export default async function ReturnsRefundsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';
  
  let htmlContent = "";
  try {
    const res = await fetch(`https://abeerx-a9260-default-rtdb.firebaseio.com/abeerx/content/${locale}/returns-refunds.json`, { cache: 'no-store' });
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
        <p>في ABEERX، رضا العملاء هو أولويتنا. تتوافق سياسة الاسترجاع والاسترداد الخاصة بنا تمامًا مع قوانين حماية المستهلك في دولة الكويت.</p>
        <h3 className="text-xl font-medium text-foreground">1. أهلية الاسترجاع</h3>
        <p>يمكنك إرجاع منتج خلال <strong>14 يومًا</strong> من استلامه. لكي تكون مؤهلاً للاسترجاع، يجب أن يكون العنصر:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>غير مستخدم وبنفس الحالة التي استلمته بها.</li>
          <li>في عبوته الأصلية غير المفتوحة والمغلقة.</li>
          <li>مصحوبًا بالإيصال الأصلي أو إثبات الشراء.</li>
        </ul>
        <p><em>يرجى الملاحظة: لأسباب تتعلق بالصحة والسلامة والنظافة، لا يمكننا قبول المرتجعات على العطور المفتوحة.</em></p>
      </div>` : `<div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>At ABEERX, customer satisfaction is our priority. Our returns and refunds policy complies fully with the consumer protection laws of the State of Kuwait.</p>
        <h3 className="text-xl font-medium text-foreground">1. Return Eligibility</h3>
        <p>You may return a product within <strong>14 days</strong> of receipt. To be eligible for a return, the item must be:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Unused and in the same condition that you received it.</li>
          <li>In its original, unopened, and sealed packaging.</li>
          <li>Accompanied by the original receipt or proof of purchase.</li>
        </ul>
        <p><em>Please note: For health, safety, and hygiene reasons, we cannot accept returns on opened perfumes.</em></p>
      </div>`;
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl min-h-[60vh]">
      <h1 className="text-4xl font-serif text-foreground mb-8 text-center">
        {isArabic ? `الاسترجاع والاسترداد` : `Returns & Refunds`}
      </h1>
      <div 
        className="bg-background border border-border p-8 md:p-12 shadow-sm web-editor-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
