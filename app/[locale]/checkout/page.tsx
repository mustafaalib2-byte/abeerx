"use client";

import { useCart } from "@/features/cart/CartContext";
import { useState } from "react";
import Link from "next/link";
import { db } from "@/firebase/clientApp";
import { ref, push, set } from "firebase/database";
import { use } from "react";

export default function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { items, cartTotal, clearCart } = useCart();
  const isArabic = locale === 'ar';
  
  const [formData, setFormData] = useState({
    name: '', mobile: '', email: '', area: '', block: '', street: '', house: '', notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('KNET'); // KNET, Visa/Mastercard, Cash on Delivery
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, type: string, value: number, min: number} | null>(null);

  const applyCoupon = async () => {
    setCouponError('');
    if (!couponCode) return;
    try {
      const code = couponCode.toUpperCase().replace(/\s+/g, '');
      const snap = await fetch(`https://abeerx-a9260-default-rtdb.firebaseio.com/coupons/${code}.json`).then(r => r.json());
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
    if (cartTotal < appliedCoupon.min) return cartTotal; // Security check
    if (appliedCoupon.type === 'percentage') {
      return Math.max(0, cartTotal - (cartTotal * (appliedCoupon.value / 100)));
    }
    return Math.max(0, cartTotal - appliedCoupon.value);
  };
  
  const finalTotal = calculateFinalTotal();


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return alert("Your cart is empty!");
    
    setIsSubmitting(true);
    
    try {
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
        total: finalTotal, discount: appliedCoupon ? { code: appliedCoupon.code, value: cartTotal - finalTotal } : null, subtotal: cartTotal,
        customer: {
          name: formData.name,
          mobile: formData.mobile,
          email: formData.email,
          area: formData.area,
          address: `Block ${formData.block}, St ${formData.street}, House/Bldg ${formData.house}`,
          notes: formData.notes
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
            {isSubmitting ? "Processing..." : (isArabic ? `دفع ${(finalTotal + (finalTotal >= 20 ? 0 : 2.90)).toFixed(2)} د.ك` : `Pay ${(finalTotal + (finalTotal >= 20 ? 0 : 2.90)).toFixed(2)} KWD`)}
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
              <span>{cartTotal >= 20 ? "Free" : "2.90 KWD"}</span>
            </div>
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
                {appliedCoupon && <div className="text-sm line-through text-muted-foreground font-normal">{(cartTotal + (cartTotal >= 20 ? 0 : 2.90)).toFixed(2)} KWD</div>}
                <span className="text-xl">{(finalTotal + (finalTotal >= 20 ? 0 : 2.90)).toFixed(2)} KWD</span>
              </div>
            </div>

        </div>
      </div>
    </div>
  );
}
