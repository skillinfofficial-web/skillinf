import { NextResponse } from 'next/server';

const CF_BASE =
  process.env.CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';

export async function POST(req: Request) {
  try {
    const { amount, itemName, itemType, customerName, customerEmail, customerPhone } =
      await req.json();

    const appId     = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    if (!appId || !secretKey) {
      return NextResponse.json(
        { error: 'Cashfree keys not configured. Add CASHFREE_APP_ID and CASHFREE_SECRET_KEY to .env.local' },
        { status: 500 },
      );
    }

    const orderId = `skillinf_${Date.now()}`;

    const cfRes = await fetch(`${CF_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: 'INR',
        order_note: `${itemType}: ${itemName}`,
        customer_details: {
          customer_id: `cust_${Date.now()}`,
          customer_name: customerName || 'Student',
          customer_email: customerEmail || 'student@example.com',
          customer_phone: customerPhone?.replace(/\D/g, '').slice(-10) || '9999999999',
        },
      }),
    });

    const data = await cfRes.json();

    if (!cfRes.ok || data.message) {
      return NextResponse.json(
        { error: data.message || 'Cashfree order creation failed' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      orderId,
      paymentSessionId: data.payment_session_id,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Order creation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
