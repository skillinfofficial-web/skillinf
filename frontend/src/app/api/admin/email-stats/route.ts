import { NextResponse } from 'next/server';
import { getEmailStats } from '@/lib/mailer';

// GET /api/admin/email-stats
export async function GET() {
  try {
    const stats = await getEmailStats();
    if (!stats) return NextResponse.json({ success: false, message: 'Failed to load stats.' }, { status: 500 });
    return NextResponse.json({ success: true, ...stats });
  } catch (err) {
    console.error('[GET /api/admin/email-stats]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
