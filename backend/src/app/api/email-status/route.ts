import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const RESEND_DAILY_QUOTA  = 100;
const RESEND_MONTHLY_QUOTA = 3000;

// GET /api/email-status  — backend admin version of email stats
export async function GET() {
  try {
    const db  = await getDatabase();
    const now = new Date();

    const istDateStr  = new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
    const istMonthStr = istDateStr.slice(0, 7);

    const [totalAll, totalToday, totalMonth, byType] = await Promise.all([
      db.collection('email_logs').countDocuments({}),
      db.collection('email_logs').countDocuments({ istDate: istDateStr }),
      db.collection('email_logs').countDocuments({ istMonth: istMonthStr }),
      db.collection('email_logs').aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray(),
    ]);

    // Check Resend API key status
    let resendStatus = 'unknown';
    try {
      const r = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      });
      resendStatus = r.ok ? 'active' : 'error';
    } catch {
      resendStatus = 'error';
    }

    return NextResponse.json({
      success: true,
      resendStatus,
      totalAll,
      totalToday,
      totalMonth,
      byType: byType.map(b => ({ type: b._id as string, count: b.count as number })),
      quota: {
        daily:   { used: totalToday,  limit: RESEND_DAILY_QUOTA,   remaining: Math.max(0, RESEND_DAILY_QUOTA  - totalToday) },
        monthly: { used: totalMonth,  limit: RESEND_MONTHLY_QUOTA, remaining: Math.max(0, RESEND_MONTHLY_QUOTA - totalMonth) },
      },
      istDate:  istDateStr,
      istMonth: istMonthStr,
    });
  } catch (err) {
    console.error('[GET /api/email-status]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
