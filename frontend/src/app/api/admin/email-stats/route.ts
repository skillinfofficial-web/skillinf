import { NextResponse } from 'next/server';
import { getEmailStats } from '@/lib/mailer';

// GET /api/admin/email-stats
export async function GET() {
  try {
    const stats = await getEmailStats();
    if (!stats) return NextResponse.json({ success: false, message: 'Failed to load stats.' }, { status: 500 });

    // Also try to fetch real Resend API stats (emails sent in last 24h)
    // Resend doesn't have a public quota/usage API, so we rely on our DB logs.
    // But we can at least verify the API key is active.
    let resendStatus = 'active';
    try {
      const r = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      });
      resendStatus = r.ok ? 'active' : 'error';
    } catch {
      resendStatus = 'unknown';
    }

    return NextResponse.json({ success: true, resendStatus, ...stats });
  } catch (err) {
    console.error('[GET /api/admin/email-stats]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
