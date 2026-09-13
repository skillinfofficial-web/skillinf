import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });

    const { url } = await req.json();
    if (!url?.trim()) return NextResponse.json({ success: false, message: 'Please enter a LinkedIn URL.' }, { status: 400 });

    if (!url.includes('linkedin.com')) {
      return NextResponse.json({ success: false, message: 'Please enter a valid LinkedIn post or article URL.' }, { status: 400 });
    }

    const db = await getDatabase();

    // Fetch user for name/email
    const user = await db.collection('users').findOne({ _id: new ObjectId(auth.userId) });
    if (!user) return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });

    const now = new Date();

    // Upsert into linkedin_verify collection (one entry per user)
    await db.collection('linkedin_verify').updateOne(
      { userId: auth.userId },
      {
        $set: {
          userId:       auth.userId,
          name:         user.name as string,
          email:        user.email as string,
          linkedinUrl:  url.trim(),
          status:       'pending',
          updatedAt:    now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );

    // Update user record
    await db.collection('users').updateOne(
      { _id: new ObjectId(auth.userId) },
      {
        $set: {
          linkedinPostUrl:  url.trim(),
          linkedinVerified: 'pending',
          updatedAt:        now,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Submitted! Your post is under admin review. Verification done within 3–4 hours.',
    });
  } catch (e) {
    console.error('[POST /api/user/linkedin]', e);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
