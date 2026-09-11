import { NextResponse } from 'next/server';
import { db } from '@/firebase/clientApp';
import { ref, update, get, child } from 'firebase/database';

const MYFATOORAH_API_URL = process.env.MYFATOORAH_API_URL || 'https://apitest.myfatoorah.com';
const MYFATOORAH_TOKEN = process.env.MYFATOORAH_TOKEN || '';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get('paymentId');
  const orderId = searchParams.get('orderId');

  if (!paymentId || !orderId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/en/checkout?error=invalid_callback`);
  }

  try {
    let isSuccess = false;

    if (paymentId.startsWith('mock_')) {
      // Handle mock payment for development
      isSuccess = true;
    } else {
      // Verify real payment securely server-to-server
      const payload = {
        KeyType: 'PaymentId',
        Key: paymentId
      };

      const response = await fetch(`${MYFATOORAH_API_URL}/v2/GetPaymentStatus`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MYFATOORAH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.IsSuccess && data.Data.InvoiceStatus === 'Paid') {
        isSuccess = true;
      }
    }

    if (isSuccess && db) {
      // Find the Web Order in Firebase and update its status
      const dbRef = ref(db);
      const ordersSnap = await get(child(dbRef, `abeerx/webOrders`));
      
      if (ordersSnap.exists()) {
        const orders = ordersSnap.val();
        // The pos stores orders as nodes, we need to find the one matching orderId
        const orderNodeKey = Object.keys(orders).find(key => String(orders[key].id) === orderId);
        
        if (orderNodeKey) {
          await update(ref(db, `abeerx/webOrders/${orderNodeKey}`), {
            status: 'Completed',
            paymentId: paymentId
          });
        }
      }

      // Redirect to success page
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/en/checkout/success?orderId=${orderId}`);
    } else {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/en/checkout?error=payment_failed`);
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/en/checkout?error=server_error`);
  }
}
