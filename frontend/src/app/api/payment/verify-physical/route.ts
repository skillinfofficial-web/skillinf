import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';

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

    /* Fetch user for name + email */
    const user = await db.collection('users').findOne({ _id: new ObjectId(auth.userId) });

    /* Save physical cert details + mark paymentDone + certificateUnlocked */
    const registeredAt = new Date();
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
            registeredAt,
          },
          paymentDone:          true,
          certificateUnlocked:  true,
        },
      },
    );

    /* Send admin notification email (fire-and-forget) */
    const istTime = registeredAt.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });

    const userName  = (user?.name  as string) || 'Unknown';
    const userEmail = (user?.email as string) || 'Unknown';

    void sendMail({
      to: ['arunkumar.s202006@gmail.com', 'skillinfofficial@gmail.com'],
      subject: `📦 New Physical Certificate Request — ${userName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
          <div style="background:#f59e0b;padding:20px 24px;">
            <h2 style="color:#fff;margin:0;font-size:20px;">📦 New Physical Certificate Request</h2>
            <p style="color:#fff;margin:6px 0 0;font-size:13px;opacity:0.9;">Payment confirmed ✅ — ship the certificate to the address below</p>
          </div>
          <div style="padding:24px;background:#fff;">
            <table style="width:100%;border-collapse:collapse;font-size:15px;">
              <tr>
                <td style="padding:10px 0;color:#555;width:130px;">👤 <strong>Name</strong></td>
                <td style="padding:10px 0;color:#222;">${userName}</td>
              </tr>
              <tr style="background:#f5f5f5;">
                <td style="padding:10px 8px;color:#555;">📧 <strong>Email</strong></td>
                <td style="padding:10px 8px;color:#222;">${userEmail}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#555;">📱 <strong>Mobile</strong></td>
                <td style="padding:10px 0;color:#222;">${mobile.trim()}</td>
              </tr>
              <tr style="background:#f5f5f5;">
                <td style="padding:10px 8px;color:#555;">📍 <strong>Address</strong></td>
                <td style="padding:10px 8px;color:#222;">${address.trim()}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#555;">🏙️ <strong>District</strong></td>
                <td style="padding:10px 0;color:#222;">${district.trim()}</td>
              </tr>
              <tr style="background:#f5f5f5;">
                <td style="padding:10px 8px;color:#555;">📮 <strong>Pincode</strong></td>
                <td style="padding:10px 8px;color:#222;">${pincode.trim()}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#555;">🧾 <strong>Order ID</strong></td>
                <td style="padding:10px 0;color:#222;font-family:monospace;">${orderId}</td>
              </tr>
              <tr style="background:#f5f5f5;">
                <td style="padding:10px 8px;color:#555;">🕐 <strong>Time</strong></td>
                <td style="padding:10px 8px;color:#222;">${istTime} IST</td>
              </tr>
            </table>
            <div style="margin-top:24px;padding:12px 16px;background:#fff8e1;border-left:4px solid #f59e0b;border-radius:4px;font-size:14px;color:#333;">
              Ship the physical certificate to the address above.
            </div>
            <div style="margin-top:16px;text-align:center;">
              <a href="https://skillinf-backend.onrender.com/admin/physical-certificates"
                 style="display:inline-block;background:#f59e0b;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;">
                View in Admin Panel →
              </a>
            </div>
          </div>
          <div style="padding:12px 24px;background:#f0f0f0;font-size:12px;color:#888;text-align:center;">
            Skillinf — Automated Notification System
          </div>
        </div>
      `,
    }).catch(err => console.error('[PhysicalCert Notify Email]', err));

    return NextResponse.json({ success: true, message: 'Physical certificate registered! It will be delivered to your address within 2–3 days.' });
  } catch (e) {
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 });
  }
}
