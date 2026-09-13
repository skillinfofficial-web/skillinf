import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDatabase } from '@/lib/mongodb';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json({ success: false, message: 'Email and password are required.' }, { status: 400 });
    }

    const db   = await getDatabase();
    const user = await db.collection('users').findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return NextResponse.json({ success: false, message: 'No account found with this email.' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password.trim(), user.mobileHash as string);
    if (!valid) {
      return NextResponse.json({ success: false, message: 'Incorrect password. Use your registered mobile number.' }, { status: 401 });
    }

    const token = signToken({ userId: user._id.toString(), email: user.email as string, name: user.name as string });
    const res   = NextResponse.json({ success: true, message: 'Signed in successfully.' });
    setAuthCookie(res, token);
    return res;
  } catch (e) {
    console.error('[POST /api/auth/login]', e);
    return NextResponse.json({ success: false, message: 'Server error. Please try again.' }, { status: 500 });
  }
}
