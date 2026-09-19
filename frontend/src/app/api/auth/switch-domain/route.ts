import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { getAuthUser, signToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });

    const { targetDomainId } = await req.json();
    if (!targetDomainId) return NextResponse.json({ success: false, message: 'Target domain ID required.' }, { status: 400 });

    const db = await getDatabase();
    
    // Get current user to check email
    const currentUser = await db.collection('users').findOne({ _id: new ObjectId(auth.userId) });
    if (!currentUser) return NextResponse.json({ success: false, message: 'Current user not found.' }, { status: 404 });

    // Find the target enrollment
    const targetUser = await db.collection('users').findOne({ _id: new ObjectId(targetDomainId) });
    if (!targetUser) return NextResponse.json({ success: false, message: 'Target enrollment not found.' }, { status: 404 });

    // Security check: Must belong to the exact same email address
    if (currentUser.email !== targetUser.email) {
      return NextResponse.json({ success: false, message: 'Cannot switch to a different user account.' }, { status: 403 });
    }

    // Issue new token for the target enrollment
    const token = signToken({ 
      userId: targetUser._id.toString(), 
      email: targetUser.email as string, 
      name: targetUser.name as string 
    });

    const res = NextResponse.json({ success: true, message: 'Switched successfully.' });
    setAuthCookie(res, token);
    return res;

  } catch (e) {
    console.error('[POST /api/auth/switch-domain]', e);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
