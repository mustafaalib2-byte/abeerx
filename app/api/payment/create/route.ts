import { NextResponse } from 'next/server';

const MYFATOORAH_API_URL = process.env.MYFATOORAH_API_URL || 'https://apitest.myfatoorah.com';
const MYFATOORAH_TOKEN = process.env.MYFATOORAH_TOKEN || '';

export async function POST(request: Request) {
  try {
    const orderData = await request.json();

    if (!MYFATOORAH_TOKEN) {
      // Return a mocked success for development if no token is provided
      console.warn("MyFatoorah token not configured. Returning mock payment URL.");
      return NextResponse.json({ 
        paymentUrl: `/en/checkout/success?paymentId=mock_${Date.now()}&orderId=${orderData.id}` 
      });
    }

    const payload = {
      CustomerName: orderData.customer.name || 'Guest Customer',
      DisplayCurrencyIso: 'KWD',
      CustomerMobile: orderData.customer.mobile || '',
      CustomerEmail: orderData.customer.email || 'guest@abeerx.com',
      InvoiceValue: orderData.total,
      CallBackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/verify?orderId=${orderData.id}`,
      ErrorUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/en/checkout?error=payment_failed`,
      Language: 'en',
      CustomerReference: orderData.orderNum,
      InvoiceItems: orderData.items.map((item: any) => ({
        ItemName: item.item,
        Quantity: item.qty,
        UnitPrice: item.rate
      }))
    };

    const response = await fetch(`${MYFATOORAH_API_URL}/v2/SendPayment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MYFATOORAH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.IsSuccess) {
      return NextResponse.json({ paymentUrl: data.Data.InvoiceURL });
    } else {
      console.error("MyFatoorah Error:", data);
      return NextResponse.json({ error: 'Payment gateway error' }, { status: 400 });
    }
  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
