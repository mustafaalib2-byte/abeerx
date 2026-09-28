import { NextResponse } from 'next/server';
import { db } from '@/firebase/clientApp';
import { ref, update, get, query, orderByChild, equalTo } from 'firebase/database';

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
      // Find the Web Order in Firebase and update its status.
      // This used to pull the ENTIRE abeerx/webOrders node (every order ever
      // placed, growing forever) just to find the one row whose `id` field
      // matched, on every single payment callback. Switched to a server-side
      // indexed query so Firebase only sends back the matching order.
      // (For best performance, add `"abeerx/webOrders": { ".indexOn": ["id"] }`
      // to the Realtime Database rules — the query still works without it,
      // Firebase just falls back to an un-indexed scan on its side, but the
      // bandwidth savings here don't depend on that.)
      const ordersQuery = query(ref(db, 'abeerx/webOrders'), orderByChild('id'), equalTo(Number(orderId)));
      const ordersSnap = await get(ordersQuery);

      if (ordersSnap.exists()) {
        const orders = ordersSnap.val();
        const orderNodeKey = Object.keys(orders)[0];

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
