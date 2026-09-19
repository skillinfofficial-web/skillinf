import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });

    const db   = await getDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(auth.userId) });
    if (!user) return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });

    // Fetch other enrollments for the same email
    const allEnrolls = await db.collection('users').find({ email: user.email }).toArray();
    const otherInternships = allEnrolls
      .filter(u => u._id.toString() !== auth.userId)
      .map(u => ({ id: u._id.toString(), domain: u.domain as string }));

    // Return user doc without the bcrypt hash — mobileNumber (plain) is kept for payment prefill
    const { mobileHash: _mh, ...safeUser } = user;
    return NextResponse.json({ 
      success: true, 
      user: { ...safeUser, _id: safeUser._id.toString() },
      otherInternships 
    });
  } catch (e) {
    console.error('[GET /api/auth/me]', e);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
