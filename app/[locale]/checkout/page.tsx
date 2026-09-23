"use client";

import { useCart } from "@/features/cart/CartContext";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { db } from "@/firebase/clientApp";
import { ref, push, set } from "firebase/database";
import { use } from "react";
import { useDeliverySettings } from "@/features/delivery/DeliveryContext";
import { deliveryFeeFor, formatAmount } from "@/lib/delivery";

export default function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { items, cartTotal, clearCart } = useCart();
  const delivery = useDeliverySettings();
  const isArabic = locale === 'ar';
  
  const [formData, setFormData] = useState({
    name: '', mobile: '', email: '', area: '', block: '', street: '', house: '', notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('KNET'); // KNET, Visa/Mastercard, Cash on Delivery
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, type: string, value: number, min: number} | null>(null);

  // ---- Precise delivery location (ticked by default) ----
  // Saved on the order as a Google Maps link; the POS prints it as a QR code on the delivery label.
  type GeoFix = { lat: number; lng: number; accuracy: number };
  const [shareLocation, setShareLocation] = useState(true);
  const [geo, setGeo] = useState<GeoFix | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'fetching' | 'ok' | 'denied' | 'error' | 'unsupported'>('idle');
  const geoRequest = useRef<Promise<GeoFix | null> | null>(null);

  const requestLocation = (): Promise<GeoFix | null> => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoStatus('unsupported');
      return Promise.resolve(null);
    }
    if (geoRequest.current) return geoRequest.current; // one request at a time
    setGeoStatus('fetching');
    geoRequest.current = new Promise<GeoFix | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const fix = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) };
          setGeo(fix);
          setGeoStatus('ok');
          geoRequest.current = null;
          resolve(fix);
        },
        (err) => {
          setGeoStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error');
          geoRequest.current = null;
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      );
    });
    return geoRequest.current;
  };

  // Box is ticked by default, so ask for the location as soon as checkout opens.
  useEffect(() => {
    if (shareLocation && !geo) requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mapsUrlFor = (fix: GeoFix) => `https://www.google.com/maps?q=${fix.lat.toFixed(6)},${fix.lng.toFixed(6)}`;

  const applyCoupon = async () => {
    setCouponError('');
    if (!couponCode) return;
    try {
      const code = couponCode.toUpperCase().replace(/\s+/g, '');
      const snap = await fetch(`https://abeerx-a9260-default-rtdb.firebaseio.com/abeerx/coupons/${code}.json`).then(r => r.json());
      if (!snap || !snap.active) {
        setCouponError(isArabic ? 'كوبون غير صالح أو منتهي الصلاحية' : 'Invalid or expired coupon');
        setAppliedCoupon(null);
        return;
      }
      if (snap.min_order_value && cartTotal < snap.min_order_value) {
        setCouponError(isArabic ? `يجب أن يكون الطلب أكثر من ${snap.min_order_value} د.ك لاستخدام هذا الكوبون` : `Minimum order ${snap.min_order_value} KWD required`);
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon({ code, type: snap.type, value: snap.value, min: snap.min_order_value || 0 });
      setCouponCode('');
    } catch (e) {
      setCouponError('Error verifying coupon');
    }
  };

  const calculateFinalTotal = () => {
    if (!appliedCoupon) return cartTotal;
    const minVal = Number(appliedCoupon.min) || 0;
    const cVal = Number(appliedCoupon.value) || 0;
    if (cartTotal < minVal) return cartTotal; // Security check
    if (appliedCoupon.type === 'percentage') {
      return Math.max(0, cartTotal - (cartTotal * (cVal / 100)));
    }
    return Math.max(0, cartTotal - cVal);
  };
  
  const finalTotal = calculateFinalTotal();
  // Free delivery is judged on what the customer pays for the goods (after any coupon).
  const deliveryFee = deliveryFeeFor(finalTotal, delivery);
  const grandTotal = finalTotal + deliveryFee;
  const amountToFreeDelivery = deliveryFee > 0 ? delivery.freeThreshold - finalTotal : 0;


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return alert("Your cart is empty!");
    
    setIsSubmitting(true);
    
    try {
      let fix = shareLocation ? geo : null;
      if (shareLocation && !fix) {
        fix = await Promise.race([
          requestLocation(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000)),
        ]);
      }

      // Create the exact schema the POS expects for "Web Orders"
      const orderRef = push(ref(db, 'abeerx/webOrders'));
      const orderId = Date.now(); // We use timestamp for the numeric ID just like the POS does internally
      const orderNum = `W-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      const posOrder = {
        id: orderId,
        orderNum: orderNum,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        paymentMethod: paymentMethod === 'Cash on Delivery' ? 'Cash on Delivery' : 'Online Payment',
        total: grandTotal, deliveryFee, discount: appliedCoupon ? { code: appliedCoupon.code, value: cartTotal - finalTotal } : null, subtotal: cartTotal,
        customer: {
          name: formData.name,
          mobile: formData.mobile,
          email: formData.email,
          area: formData.area,
          address: `Block ${formData.block}, St ${formData.street}, House/Bldg ${formData.house}`,
          notes: formData.notes,
          // Only present when the customer shared their location (Firebase rejects undefined values)
          ...(fix ? { locationUrl: mapsUrlFor(fix), location: fix } : {})
        },
        items: items.map(i => ({
          item: i.product.name,
          qty: i.quantity,
          rate: i.variant ? (i.variant.salePrice || i.variant.price) : (i.product.salePrice || i.product.price),
          amount: i.quantity * (i.variant ? (i.variant.salePrice || i.variant.price) : (i.product.salePrice || i.product.price))
        }))
      };

      if (paymentMethod === 'Cash on Delivery') {
        // Direct to Firebase and show success
        await set(orderRef, posOrder);
        clearCart();
        alert(`Order Placed Successfully! Your Order Number is #${orderNum}`);
        window.location.href = `/${locale}/shop`;
      } else {
        // Here we would call our server-side MyFatoorah integration
        // const res = await fetch('/api/payment/create', { method: 'POST', body: JSON.stringify(posOrder) });
        // const { paymentUrl } = await res.json();
        // window.location.href = paymentUrl;
        
        // Mocking success for now
        await set(orderRef, posOrder);
        clearCart();
        alert(`Redirecting to MyFatoorah (${paymentMethod})... (Mocked Success)`);
        window.location.href = `/${locale}/shop`;
      }
    } catch (error) {
      console.error(error);
      alert("Failed to submit order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-serif mb-6">{isArabic ? "سلة المشتريات فارغة" : "Your Cart is Empty"}</h1>
        <Link href={`/${locale}/shop`} className="text-ring hover:text-foreground font-medium underline uppercase tracking-widest text-sm">
          {isArabic ? "مواصلة التسوق" : "Continue Shopping"}
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 flex flex-col lg:flex-row gap-12">
      {/* Checkout Form */}
      <div className="flex-grow max-w-2xl">
        <h1 className="text-3xl font-serif mb-8 text-foreground">{isArabic ? "إتمام الطلب كزائر" : "Guest Checkout"}</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer Details */}
          <section>
            <h2 className="text-sm font-bold tracking-widest uppercase mb-4 text-muted-foreground border-b border-border pb-2">
              {isArabic ? "بيانات التواصل" : "Contact Information"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required name="name" onChange={handleInputChange} placeholder={isArabic ? "الاسم الكامل" : "Full Name"} className="w-full p-4 border border-border bg-background text-foreground focus:outline-none focus:border-ring" />
              <input required name="mobile" onChange={handleInputChange} placeholder="+965 " className="w-full p-4 border border-border bg-background text-foreground focus:outline-none focus:border-ring" />
              <input type="email" name="email" onChange={handleInputChange} placeholder={isArabic ? "البريد الإلكتروني (اختياري)" : "Email (Optional)"} className="w-full p-4 border border-border bg-background text-foreground focus:outline-none focus:border-ring md:col-span-2" />
            </div>
          </section>

          {/* Delivery Details */}
          <section>
            <h2 className="text-sm font-bold tracking-widest uppercase mb-4 text-muted-foreground border-b border-border pb-2">
              {isArabic ? "عنوان التوصيل" : "Delivery Address (Kuwait)"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input required name="area" onChange={handleInputChange} placeholder={isArabic ? "المنطقة" : "Area (e.g. Salmiya)"} className="w-full p-4 border border-border bg-background text-foreground focus:outline-none focus:border-ring md:col-span-3" />
              <input required name="block" onChange={handleInputChange} placeholder={isArabic ? "قطعة" : "Block"} className="w-full p-4 border border-border bg-background text-foreground focus:outline-none focus:border-ring" />
              <input required name="street" onChange={handleInputChange} placeholder={isArabic ? "شارع" : "Street"} className="w-full p-4 border border-border bg-background text-foreground focus:outline-none focus:border-ring" />
              <input required name="house" onChange={handleInputChange} placeholder={isArabic ? "منزل / مبنى" : "House/Bldg"} className="w-full p-4 border border-border bg-background text-foreground focus:outline-none focus:border-ring" />
              <textarea name="notes" onChange={handleInputChange} placeholder={isArabic ? "ملاحظات التوصيل (اختياري)" : "Additional Directions (Optional)"} className="w-full p-4 border border-border bg-background text-foreground focus:outline-none focus:border-ring md:col-span-3 resize-none h-24" />
            </div>

            <div className="mt-4 p-4 border border-border bg-secondary">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareLocation}
                  onChange={(e) => { setShareLocation(e.target.checked); if (e.target.checked && !geo) requestLocation(); }}
                  className="mt-1 accent-ring w-4 h-4"
                />
                <span className="text-sm text-foreground">
                  {isArabic ? "📍 مشاركة موقعي الدقيق لتوصيل أسرع (موصى به)" : "📍 Share my exact location for faster delivery (recommended)"}
                  <span className="block text-xs text-muted-foreground mt-1">
                    {isArabic ? "يُستخدم فقط لمساعدة السائق في الوصول إليك." : "Only used to help our driver find you."}
                  </span>
                </span>
              </label>
              {shareLocation && (
                <div className="mt-2 text-xs pl-7">
                  {geoStatus === 'fetching' && <span className="text-muted-foreground">{isArabic ? "جارٍ تحديد موقعك…" : "Getting your location…"}</span>}
                  {geoStatus === 'ok' && geo && (
                    <span className={geo.accuracy > 100 ? "text-amber-700" : "text-green-700"}>
                      {isArabic ? `✓ تم تحديد الموقع (±${geo.accuracy} م)` : `✓ Location captured (±${geo.accuracy} m)`}{" · "}
                      <a href={mapsUrlFor(geo)} target="_blank" rel="noopener noreferrer" className="underline">{isArabic ? "عرض على الخريطة" : "View on map"}</a>
                      {geo.accuracy > 100 && (
                        <span className="block mt-1">{isArabic ? "الموقع تقريبي. للحصول على موقع دقيق، اطلب من هاتفك مع تشغيل GPS." : "This looks approximate. For a precise pin, order from your phone with location/GPS on."}</span>
                      )}
                    </span>
                  )}
                  {(geoStatus === 'denied' || geoStatus === 'error') && (
                    <span className="text-red-600">
                      {geoStatus === 'denied'
                        ? (isArabic ? "تم رفض إذن الموقع. اسمح بالوصول إلى الموقع لهذا الموقع من إعدادات المتصفح، أو ألغِ تحديد هذا الخيار." : "Location permission is blocked. Allow location for this site in your browser settings, or untick this box.")
                        : (isArabic ? "تعذر تحديد موقعك." : "Couldn't get your location.")}{" "}
                      <button type="button" onClick={() => requestLocation()} className="underline font-bold">{isArabic ? "حاول مرة أخرى" : "Try again"}</button>
                    </span>
                  )}
                  {geoStatus === 'unsupported' && <span className="text-muted-foreground">{isArabic ? "متصفحك لا يدعم تحديد الموقع." : "Your browser doesn't support location sharing."}</span>}
                </div>
              )}
            </div>
          </section>

          {/* Payment Method */}
          <section>
            <h2 className="text-sm font-bold tracking-widest uppercase mb-4 text-muted-foreground border-b border-border pb-2">
              {isArabic ? "طريقة الدفع" : "Payment Method"}
            </h2>
            <div className="space-y-3">
              {['KNET', 'Visa / Mastercard', 'Cash on Delivery'].map(method => (
                <label key={method} className={`flex items-center p-4 border cursor-pointer transition-colors ${paymentMethod === method ? 'border-ring bg-secondary' : 'border-border'}`}>
                  <input type="radio" name="payment" value={method} checked={paymentMethod === method} onChange={(e) => setPaymentMethod(e.target.value)} className="mr-4 accent-ring" />
                  <span className="font-medium text-foreground">{method}</span>
                </label>
              ))}
            </div>
          </section>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-ring text-white py-4 text-sm tracking-widest uppercase font-bold hover:bg-black transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : (isArabic ? `دفع ${grandTotal.toFixed(2)} د.ك` : `Pay ${grandTotal.toFixed(2)} KWD`)}
          </button>
        </form>
      </div>

      {/* Order Summary */}
      <div className="w-full lg:w-96 flex-shrink-0">
        <div className="bg-secondary p-6 border border-border sticky top-24">
          <h2 className="text-xl font-serif mb-6 text-foreground border-b border-border pb-4">{isArabic ? "ملخص الطلب" : "Order Summary"}</h2>
          
          <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2">
            {items.map(item => {
              const sku = item.variant ? item.variant.sku : item.product.sku;
              const price = item.variant ? (item.variant.salePrice || item.variant.price) : (item.product.salePrice || item.product.price);
              
              return (
                <div key={sku} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground font-bold">{item.quantity}x</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">{item.product.name}</span>
                      {item.variant && <span className="text-xs text-muted-foreground">{item.variant.size}</span>}
                    </div>
                  </div>
                  <span className="text-foreground font-medium">{(price * item.quantity).toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border pt-4 space-y-2 text-sm text-foreground">
            <div className="flex justify-between">
              <span>{isArabic ? "المجموع الفرعي" : "Subtotal"}</span>
              <span>{cartTotal.toFixed(2)} KWD</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{isArabic ? "التوصيل" : "Delivery"}</span>
              <span>{deliveryFee === 0 ? (isArabic ? "مجاني" : "Free") : `${deliveryFee.toFixed(2)} KWD`}</span>
            </div>
            {amountToFreeDelivery > 0 && (
              <p className="text-xs text-ring">
                {isArabic
                  ? `أضف ${amountToFreeDelivery.toFixed(2)} د.ك للحصول على توصيل مجاني (للطلبات بقيمة ${formatAmount(delivery.freeThreshold)} د.ك فأكثر)`
                  : `Add ${amountToFreeDelivery.toFixed(2)} KWD more for free delivery (orders of ${formatAmount(delivery.freeThreshold)} KWD and above)`}
              </p>
            )}
          </div>

          
            {/* Coupon UI */}
            <div className="pt-4 border-t border-border mt-4">
              <div className="flex gap-2">
                <input type="text" placeholder={isArabic ? "كود الخصم" : "Coupon Code"} value={couponCode} onChange={e => setCouponCode(e.target.value)} className="flex-1 bg-secondary border border-border p-2 text-sm" />
                <button type="button" onClick={applyCoupon} className="bg-ring text-white px-4 py-2 text-sm font-medium hover:bg-ring/90">{isArabic ? "تطبيق" : "Apply"}</button>
              </div>
              {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}
              {appliedCoupon && (
                <div className="flex justify-between items-center mt-3 text-sm text-ring font-medium bg-ring/10 p-2 rounded">
                  <span>{isArabic ? "تم تطبيق الكوبون:" : "Coupon applied:"} {appliedCoupon.code}</span>
                  <button type="button" onClick={() => setAppliedCoupon(null)} className="text-muted-foreground hover:text-foreground text-xs underline">Remove</button>
                </div>
              )}
            </div>

            <div className="border-t border-black mt-4 pt-4 flex justify-between items-end font-bold text-foreground">
              <span className="uppercase tracking-wider">{isArabic ? "الإجمالي" : "Total"}</span>
              <div className="text-right">
                {appliedCoupon && <div className="text-sm line-through text-muted-foreground font-normal">{(cartTotal + deliveryFeeFor(cartTotal, delivery)).toFixed(2)} KWD</div>}
                <span className="text-xl">{grandTotal.toFixed(2)} KWD</span>
              </div>
            </div>

        </div>
      </div>
    </div>
  );
}
