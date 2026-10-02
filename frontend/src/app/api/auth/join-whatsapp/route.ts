import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const db = await getDatabase();
    await db.collection('users').updateMany(
      { email: user.email },
      { $set: { hasJoinedWhatsapp: true, updatedAt: new Date(), updatedAtIST: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) } }
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[POST /api/auth/join-whatsapp]', e);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
