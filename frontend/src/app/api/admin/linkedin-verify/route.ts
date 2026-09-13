import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';

// GET /api/admin/linkedin-verify — all submissions
export async function GET() {
  try {
    const db      = await getDatabase();
    const records = await db.collection('linkedin_verify').find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({
      success: true,
      records: records.map(r => ({ ...r, _id: r._id.toString() })),
    });
  } catch (e) {
    console.error('[GET /api/admin/linkedin-verify]', e);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// PATCH /api/admin/linkedin-verify — approve or reject
export async function PATCH(req: NextRequest) {
  try {
    const { userId, action } = await req.json() as { userId: string; action: 'verify' | 'unverify' };
    if (!userId || !['verify', 'unverify'].includes(action)) {
      return NextResponse.json({ success: false, message: 'Invalid payload.' }, { status: 400 });
    }

    const db  = await getDatabase();
    const now = new Date();

    const newVerified = action === 'verify' ? true : false;
    const newStatus   = action === 'verify' ? 'approved' : 'rejected';

    // Update user record
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { linkedinVerified: newVerified, updatedAt: now } }
    );

    // Update linkedin_verify record
    await db.collection('linkedin_verify').updateOne(
      { userId },
      { $set: { status: newStatus, updatedAt: now } }
    );

    return NextResponse.json({
      success: true,
      message: action === 'verify'
        ? 'LinkedIn verified — Step 1 is now unlocked for this student.'
        : 'LinkedIn rejected — student will need to re-submit.',
    });
  } catch (e) {
    console.error('[PATCH /api/admin/linkedin-verify]', e);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
