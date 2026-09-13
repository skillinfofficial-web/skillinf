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
    if (!auth) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });

    const { orderId, address, mobile, district, pincode } = await req.json();
    if (!orderId || !address || !mobile || !district || !pincode) {
      return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
    }

    const appId     = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    if (!appId || !secretKey) return NextResponse.json({ success: false, message: 'Cashfree not configured.' }, { status: 500 });

    /* Verify payment with Cashfree */
    const cfRes  = await fetch(`${CF_BASE}/orders/${orderId}`, {
      headers: { 'x-client-id': appId, 'x-client-secret': secretKey, 'x-api-version': '2023-08-01' },
    });
    const cfData = await cfRes.json();
    const isPaid = cfData.order_status === 'PAID' || cfData.order_status === 'ACTIVE';
    if (!isPaid) {
      return NextResponse.json({ success: false, message: `Payment not confirmed. Status: ${cfData.order_status}` });
    }

    const db = await getDatabase();

    /* Save physical cert details + mark paymentDone + certificateUnlocked */
    await db.collection('users').updateOne(
      { _id: new ObjectId(auth.userId) },
      {
        $set: {
          physicalCertificate: {
            address: address.trim(),
            mobile:  mobile.trim(),
            district: district.trim(),
            pincode: pincode.trim(),
            paid: true,
            orderId,
            registeredAt: new Date(),
          },
          paymentDone:          true,
          certificateUnlocked:  true,
        },
      },
    );

    return NextResponse.json({ success: true, message: 'Physical certificate registered! It will be delivered to your address within 2–3 days.' });
  } catch (e) {
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 });
  }
}
