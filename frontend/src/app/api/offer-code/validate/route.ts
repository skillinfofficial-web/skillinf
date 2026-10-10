import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// POST /api/offer-code/validate  — validate an offer code (public, no auth needed)
export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    if (!code || typeof code !== 'string')
      return NextResponse.json({ success: false, message: 'Offer code is required.' }, { status: 400 });

    const db = await getDatabase();
    const oc = await db.collection('offerCodes').findOne({ code: code.trim().toUpperCase() });

    if (!oc)
      return NextResponse.json({ success: false, message: 'Invalid offer code. Please check and try again.' });

    // Check active flag
    if (!oc.active)
      return NextResponse.json({ success: false, message: 'This offer code has been deactivated.' });

    // Check time expiry
    if (oc.limitType === 'time' && oc.endTime) {
      if (new Date(oc.endTime) < new Date())
        return NextResponse.json({ success: false, message: 'This offer code has expired.' });
    }

    // Check count expiry
    if (oc.limitType === 'count' && oc.maxCount !== undefined) {
      if (oc.usedCount >= oc.maxCount)
        return NextResponse.json({ success: false, message: 'This offer code has reached its maximum usage limit.' });
    }

    return NextResponse.json({
      success: true,
      discountPercent: oc.discountPercent,
      message: `🎉 Offer applied! You get ${oc.discountPercent}% off.`,
    });
  } catch (e) {
    console.error('[POST /api/offer-code/validate]', e);
    return NextResponse.json({ success: false, message: 'Server error. Please try again.' }, { status: 500 });
  }
}
