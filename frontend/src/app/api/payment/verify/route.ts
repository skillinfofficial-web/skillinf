import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';

const CF_BASE =
  process.env.CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const { orderId, offerCode } = await req.json();
    if (!orderId) {
      return NextResponse.json({ success: false, message: 'orderId required.' }, { status: 400 });
    }

    const appId     = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    if (!appId || !secretKey) {
      return NextResponse.json(
        { success: false, message: 'Cashfree keys not configured.' },
        { status: 500 },
      );
    }

    // 1 — Fetch order status from Cashfree
    const cfRes = await fetch(`${CF_BASE}/orders/${orderId}`, {
      headers: {
        'x-client-id':     appId,
        'x-client-secret': secretKey,
        'x-api-version':   '2023-08-01',
      },
    });

    const cfData = await cfRes.json();

    // 2 — Accept PAID or ACTIVE (sandbox sometimes returns ACTIVE after success)
    const isPaid =
      cfData.order_status === 'PAID' || cfData.order_status === 'ACTIVE';

    if (!isPaid) {
      return NextResponse.json({
        success: false,
        message: `Payment not confirmed. Status: ${cfData.order_status}`,
      });
    }

    const db = await getDatabase();

    // 3 — Mark user: paymentDone=true, certificateUnlocked=true
    await db.collection('users').updateOne(
      { _id: new ObjectId(auth.userId) },
      { $set: { paymentDone: true, certificateUnlocked: true } },
    );

    // 4 — Increment usedCount on the offer code (only after confirmed payment)
    if (offerCode && typeof offerCode === 'string' && offerCode.trim()) {
      await db.collection('offerCodes').updateOne(
        { code: offerCode.trim().toUpperCase() },
        { $inc: { usedCount: 1 } },
      );
    }

    return NextResponse.json({ success: true, message: 'Payment verified. Certificate unlocked!' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Verification error';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
