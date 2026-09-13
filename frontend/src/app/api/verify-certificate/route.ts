import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';

// GET /api/verify-certificate?id=<objectId>
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')?.trim();

    if (!id) {
      return NextResponse.json({ success: false, message: 'Certificate ID is required.' }, { status: 400 });
    }

    // Validate ObjectId format before querying
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid certificate ID format.' }, { status: 400 });
    }

    const db   = await getDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(id) });

    if (!user) {
      return NextResponse.json({ success: false, message: 'No record found for this certificate ID.' }, { status: 404 });
    }

    // Return safe public fields only — no password hash, no email exposure
    return NextResponse.json({
      success:  true,
      verified: true,
      data: {
        certificateId: id,
        name:      user.name,
        domain:    user.domain,
        startDate: user.startDate,
        endDate:   user.endDate,
        completedSteps: [
          user.steps?.step1, user.steps?.step2,
          user.steps?.step3, user.steps?.step4,
        ].filter(Boolean).length,
        certificateUnlocked: user.certificateUnlocked ?? false,
        issuedAt: user.createdAt ?? null,
      },
    });
  } catch (e) {
    console.error('[GET /api/verify-certificate]', e);
    return NextResponse.json({ success: false, message: 'Server error. Please try again.' }, { status: 500 });
  }
}
