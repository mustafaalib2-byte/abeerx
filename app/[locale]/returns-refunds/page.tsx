export default async function ReturnsRefundsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl min-h-[60vh]">
      <h1 className="text-4xl font-serif text-foreground mb-8 text-center">
        {isArabic ? `الاسترجاع والاسترداد` : `Returns & Refunds`}
      </h1>
      <div className="bg-background border border-border p-8 md:p-12 shadow-sm">
        {isArabic ? (
          <>
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>في ABEERX، رضا العملاء هو أولويتنا. تتوافق سياسة الاسترجاع والاسترداد الخاصة بنا تمامًا مع قوانين حماية المستهلك في دولة الكويت.</p>
        
        <h3 className="text-xl font-medium text-foreground">1. أهلية الاسترجاع</h3>
        <p>يمكنك إرجاع منتج خلال <strong>14 يومًا</strong> من استلامه. لكي تكون مؤهلاً للاسترجاع، يجب أن يكون العنصر:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>غير مستخدم وبنفس الحالة التي استلمته بها.</li>
          <li>في عبوته الأصلية غير المفتوحة والمغلقة.</li>
          <li>مصحوبًا بالإيصال الأصلي أو إثبات الشراء.</li>
        </ul>
        <p><em>يرجى الملاحظة: لأسباب تتعلق بالصحة والسلامة والنظافة، لا يمكننا قبول المرتجعات على العطور المفتوحة.</em></p>

        <h3 className="text-xl font-medium text-foreground">2. العناصر التالفة أو المعيبة</h3>
        <p>إذا تلقيت منتجًا معيبًا أو تالفًا، يرجى الاتصال بنا على الفور على +965 98521807 أو زيارة متجرنا في مدينة الكويت - المباركية. سنقوم بترتيب استبدال مجاني أو استرداد كامل.</p>

        <h3 className="text-xl font-medium text-foreground">3. عملية الاسترداد</h3>
        <p>بمجرد استلام المرتجع وفحصه، سنخطرك بالموافقة على استرداد أموالك أو رفضه. ستتم معالجة المبالغ المستردة المعتمدة وإعادتها إلى طريقة الدفع الأصلية الخاصة بك في غضون عدد معين من الأيام. بالنسبة لطلبات الدفع عند الاستلام، قد يتم إصدار المبالغ المستردة كرصيد في المتجر أو تحويل مصرفي بناءً على اتفاق متبادل.</p>
      </div>
    </>
        ) : (
          <>
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>At ABEERX, customer satisfaction is our priority. Our returns and refunds policy complies fully with the consumer protection laws of the State of Kuwait.</p>
        
        <h3 className="text-xl font-medium text-foreground">1. Return Eligibility</h3>
        <p>You may return a product within <strong>14 days</strong> of receipt. To be eligible for a return, the item must be:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Unused and in the same condition that you received it.</li>
          <li>In its original, unopened, and sealed packaging.</li>
          <li>Accompanied by the original receipt or proof of purchase.</li>
        </ul>
        <p><em>Please note: For health, safety, and hygiene reasons, we cannot accept returns on opened perfumes.</em></p>

        <h3 className="text-xl font-medium text-foreground">2. Damaged or Defective Items</h3>
        <p>If you receive a defective or damaged product, please contact us immediately at +965 98521807 or visit our store at Kuwait City - Al-Mubarakiyah. We will arrange a free exchange or full refund.</p>

        <h3 className="text-xl font-medium text-foreground">3. Refund Process</h3>
        <p>Once your return is received and inspected, we will notify you of the approval or rejection of your refund. Approved refunds will be processed back to your original method of payment within a certain amount of days. For cash on delivery orders, refunds may be issued as store credit or bank transfer upon mutual agreement.</p>
      </div>
    </>
        )}
      </div>
    </div>
  );
}
