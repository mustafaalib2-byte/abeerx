"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { firstTimeTracking, readLastOrder, type PlacedOrder } from "@/lib/orderTracking";

/* ------------------------------------------------------------------------------------------
   Order confirmed page. Shows the order the customer just placed and reports the sale ONCE to:
     - Google Ads   (conversion with value, KWD, transaction id + enhanced-conversion email/phone)
     - Google Analytics 4 (purchase event with items)
     - Meta Pixel   (Purchase)
   Set in Vercel: NEXT_PUBLIC_GOOGLE_ADS_ID (AW-…) and NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL.
------------------------------------------------------------------------------------------- */

type GtagFn = (...args: unknown[]) => void;
declare global {
  interface Window { gtag?: GtagFn; fbq?: (...args: unknown[]) => void; dataLayer?: unknown[] }
}

const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const ADS_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL;

const money = (n: number) => `${n.toFixed(3)} KWD`;

function e164Kuwait(mobile: string): string | undefined {
  const d = (mobile || "").replace(/\D/g, "");
  if (!d) return undefined;
  if (d.startsWith("965") && d.length === 11) return `+${d}`;
  if (d.length === 8) return `+965${d}`;
  return d.length >= 10 ? `+${d}` : undefined;
}

// The Google / Meta scripts load a moment after the page, so wait for them (max ~8s).
function whenReady(test: () => boolean, run: () => void, tries = 40) {
  if (test()) return run();
  if (tries <= 0) return;
  setTimeout(() => whenReady(test, run, tries - 1), 200);
}

function reportPurchase(o: PlacedOrder) {
  if (!firstTimeTracking(o.orderNum)) return;

  whenReady(() => typeof window.gtag === "function", () => {
    const gtag = window.gtag!;
    const email = o.customer.email?.trim().toLowerCase();
    const phone = e164Kuwait(o.customer.mobile);
    if (email || phone) {
      gtag("set", "user_data", { ...(email ? { email } : {}), ...(phone ? { phone_number: phone } : {}) });
    }
    if (ADS_ID && ADS_LABEL) {
      gtag("event", "conversion", {
        send_to: `${ADS_ID}/${ADS_LABEL}`,
        value: o.total,
        currency: o.currency,
        transaction_id: o.orderNum,
      });
    }
    gtag("event", "purchase", {
      transaction_id: o.orderNum,
      value: o.total,
      currency: o.currency,
      shipping: o.deliveryFee,
      ...(o.couponCode ? { coupon: o.couponCode } : {}),
      items: o.items.map(i => ({
        item_id: i.sku, item_name: i.name, item_brand: i.brand, item_variant: i.size, price: i.price, quantity: i.qty,
      })),
    });
  });

  whenReady(() => typeof window.fbq === "function", () => {
    window.fbq!("track", "Purchase", {
      value: o.total,
      currency: o.currency,
      content_type: "product",
      contents: o.items.map(i => ({ id: i.sku, quantity: i.qty, item_price: i.price })),
      num_items: o.items.reduce((n, i) => n + i.qty, 0),
    }, { eventID: o.orderNum });
  });
}

export default function SuccessClient({ locale }: { locale: string }) {
  const isArabic = locale === "ar";
  const L = (en: string, ar: string) => (isArabic ? ar : en);
  const [order, setOrder] = useState<PlacedOrder | null>(null);
  const [ready, setReady] = useState(false);
  const [refFromUrl, setRefFromUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const wanted = qs.get("order") || qs.get("orderId") || "";
    setRefFromUrl(wanted);
    const o = readLastOrder();
    // Only use the saved order if it is the one in the link (or the link has no number)
    const match = o && (!wanted || wanted === o.orderNum || wanted === String(o.orderId)) ? o : null;
    setOrder(match);
    setReady(true);
    if (match) reportPurchase(match);
  }, []);

  if (!ready) return <div className="min-h-[60vh]" />;

  const orderNum = order?.orderNum || refFromUrl;
  const firstName = order?.customer.name?.trim().split(/\s+/)[0] || "";
  const isCash = order?.paymentMethod === "Cash on Delivery";
  const copy = async () => {
    try { await navigator.clipboard.writeText(orderNum); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  };

  const steps = [
    { en: "Order placed", ar: "تم استلام الطلب", done: true },
    { en: "We confirm by phone", ar: "نؤكد معك هاتفياً", done: false },
    { en: "Out for delivery", ar: "في الطريق إليك", done: false },
    { en: "Delivered", ar: "تم التوصيل", done: false },
  ];

  return (
    <div className="container mx-auto px-4 py-10 md:py-16 max-w-3xl" dir={isArabic ? "rtl" : "ltr"}>
      <style>{`
        @keyframes abx-draw{to{stroke-dashoffset:0}}
        @keyframes abx-pop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.06);opacity:1}100%{transform:scale(1)}}
        @keyframes abx-fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .abx-pop{animation:abx-pop .6s cubic-bezier(.2,.8,.2,1) both}
        .abx-ring{stroke-dasharray:240;stroke-dashoffset:240;animation:abx-draw .9s .1s ease-out forwards}
        .abx-tick{stroke-dasharray:60;stroke-dashoffset:60;animation:abx-draw .45s .75s ease-out forwards}
        .abx-fade{animation:abx-fade .6s ease-out both}
        @media (prefers-reduced-motion: reduce){.abx-pop,.abx-ring,.abx-tick,.abx-fade{animation:none;stroke-dashoffset:0}}
      `}</style>

      {/* Hero */}
      <div className="text-center">
        <svg className="abx-pop mx-auto mb-6" width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
          <circle cx="42" cy="42" r="38" fill="#fbf7ec" />
          <circle className="abx-ring" cx="42" cy="42" r="38" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" transform="rotate(-90 42 42)" />
          <path className="abx-tick" d="M27 43 L37 53 L58 32" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="abx-fade text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3" style={{ animationDelay: ".3s" }}>
          {L("Order confirmed", "تم تأكيد طلبك")}
        </p>
        <h1 className="abx-fade text-3xl md:text-4xl font-serif text-foreground mb-3" style={{ animationDelay: ".4s" }}>
          {firstName ? L(`Thank you, ${firstName}`, `شكراً لك، ${firstName}`) : L("Thank you for your order", "شكراً لطلبك")}
        </h1>
        <p className="abx-fade text-muted-foreground max-w-md mx-auto leading-relaxed" style={{ animationDelay: ".5s" }}>
          {L(
            "Your fragrance is being prepared. Our team will contact you shortly to confirm the delivery time.",
            "يتم الآن تجهيز عطرك. سيتواصل معك فريقنا قريباً لتأكيد موعد التوصيل."
          )}
        </p>

        {orderNum && (
          <div className="abx-fade inline-flex items-center gap-3 mt-6 border border-ring px-5 py-3" style={{ animationDelay: ".6s" }}>
            <span className="text-xs tracking-widest uppercase text-muted-foreground">{L("Order no.", "رقم الطلب")}</span>
            <span className="text-lg font-serif text-foreground" dir="ltr">#{orderNum}</span>
            <button type="button" onClick={copy} className="text-xs underline text-muted-foreground hover:text-foreground">
              {copied ? L("Copied", "تم النسخ") : L("Copy", "نسخ")}
            </button>
          </div>
        )}
      </div>

      {/* Progress */}
      <ol className="abx-fade grid grid-cols-4 gap-2 mt-10 mb-10" style={{ animationDelay: ".7s" }}>
        {steps.map((s, i) => (
          <li key={i} className="flex flex-col items-center text-center">
            <span className={`w-full h-[2px] mb-3 ${s.done ? "bg-ring" : "bg-border"}`} />
            <span className={`w-3 h-3 rounded-full mb-2 ${s.done ? "bg-ring" : "border border-border bg-background"}`} />
            <span className={`text-[10px] md:text-xs uppercase tracking-wider ${s.done ? "text-foreground font-bold" : "text-muted-foreground"}`}>
              {isArabic ? s.ar : s.en}
            </span>
          </li>
        ))}
      </ol>

      {order ? (
        <div className="abx-fade grid md:grid-cols-5 gap-6" style={{ animationDelay: ".8s" }}>
          {/* Items + totals */}
          <section className="md:col-span-3 border border-border p-5">
            <h2 className="text-sm font-bold tracking-widest uppercase mb-4 text-foreground">{L("Your order", "طلبك")}</h2>
            <ul className="divide-y divide-border">
              {order.items.map((it, i) => (
                <li key={i} className="flex items-center gap-3 py-3">
                  <div className="w-14 h-14 shrink-0 bg-secondary border border-border flex items-center justify-center overflow-hidden">
                    {it.image
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={it.image} alt="" className="w-full h-full object-contain" />
                      : <span className="text-[10px] text-muted-foreground">ABEERX</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    {it.brand && <p className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">{it.brand}</p>}
                    <p className="text-sm text-foreground truncate">{it.name}</p>
                    <p className="text-xs text-muted-foreground">{[it.size, `× ${it.qty}`].filter(Boolean).join("  ·  ")}</p>
                  </div>
                  <span className="text-sm text-foreground whitespace-nowrap" dir="ltr">{money(it.price * it.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-border mt-2 pt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{L("Subtotal", "المجموع الفرعي")}</span><span dir="ltr">{money(order.subtotal)}</span></div>
              {order.discount > 0 && (
                <div className="flex justify-between text-ring"><span>{L("Discount", "الخصم")}{order.couponCode ? ` (${order.couponCode})` : ""}</span><span dir="ltr">−{money(order.discount)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">{L("Delivery", "التوصيل")}</span><span dir="ltr">{order.deliveryFee > 0 ? money(order.deliveryFee) : L("Free", "مجاني")}</span></div>
              <div className="flex justify-between border-t border-foreground pt-3 mt-1 font-bold text-base">
                <span className="uppercase tracking-wider">{L("Total", "الإجمالي")}</span><span dir="ltr">{money(order.total)}</span>
              </div>
            </div>
          </section>

          {/* Delivery + payment */}
          <aside className="md:col-span-2 space-y-6">
            <section className="bg-secondary border border-border p-5">
              <h2 className="text-sm font-bold tracking-widest uppercase mb-3 text-foreground">{L("Delivering to", "التوصيل إلى")}</h2>
              <p className="text-sm text-foreground">{order.customer.name}</p>
              <p className="text-sm text-muted-foreground">{order.customer.area}</p>
              <p className="text-sm text-muted-foreground">{order.customer.address}</p>
              <p className="text-sm text-muted-foreground mt-1" dir="ltr">{order.customer.mobile}</p>
            </section>
            <section className="bg-secondary border border-border p-5">
              <h2 className="text-sm font-bold tracking-widest uppercase mb-3 text-foreground">{L("Payment", "الدفع")}</h2>
              <p className="text-sm text-foreground">{isCash ? L("Cash on delivery", "الدفع عند الاستلام") : order.paymentMethod}</p>
              {isCash && (
                <p className="text-sm text-muted-foreground mt-1">
                  {L(`Please have ${money(order.total)} ready when your order arrives.`, `يرجى تجهيز مبلغ ${money(order.total)} عند الاستلام.`)}
                </p>
              )}
            </section>
          </aside>
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          {L("Keep your order number for any questions about your delivery.", "احتفظ برقم طلبك لأي استفسار عن التوصيل.")}
        </p>
      )}

      {/* Actions */}
      <div className="abx-fade flex flex-col sm:flex-row gap-3 justify-center mt-10" style={{ animationDelay: ".9s" }}>
        <Link href={`/${locale}/shop`} className="bg-foreground text-background px-8 py-4 text-sm tracking-widest uppercase font-bold text-center hover:bg-ring transition-colors">
          {L("Continue shopping", "مواصلة التسوق")}
        </Link>
        <Link href={`/${locale}`} className="border border-foreground px-8 py-4 text-sm tracking-widest uppercase font-bold text-center hover:bg-secondary transition-colors">
          {L("Back to home", "العودة للرئيسية")}
        </Link>
      </div>
    </div>
  );
}
