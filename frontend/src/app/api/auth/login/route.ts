import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDatabase } from '@/lib/mongodb';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password, domainId } = await req.json();

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json({ success: false, message: 'Email and password are required.' }, { status: 400 });
    }

    const db = await getDatabase();
    const emailNorm = email.trim().toLowerCase();

    // ── Find ALL enrollments for this email ─────────────────────────────────
    const allUsers = await db.collection('users')
      .find({ email: emailNorm })
      .sort({ createdAt: -1 })
      .toArray();

    if (allUsers.length === 0) {
      return NextResponse.json({ success: false, message: 'No account found with this email.' }, { status: 401 });
    }

    // ── Verify mobile (password) against the first record ──────────────────
    const valid = await bcrypt.compare(password.trim(), allUsers[0].mobileHash as string);
    if (!valid) {
      return NextResponse.json({ success: false, message: 'Incorrect password. Use your registered mobile number.' }, { status: 401 });
    }

    // ── Multiple domains: need user to pick one ─────────────────────────────
    if (allUsers.length > 1 && !domainId) {
      return NextResponse.json({
        success: false,
        requireDomainSelect: true,
        message: 'You have multiple domain enrollments. Please select which internship to sign into.',
        domains: allUsers.map(u => ({
          id:     u._id.toString(),
          domain: u.domain as string,
        })),
      }, { status: 200 });
    }

    // ── Pick the correct user record ────────────────────────────────────────
    let user = allUsers[0];
    if (domainId) {
      const picked = allUsers.find(u => u._id.toString() === domainId);
      if (!picked) return NextResponse.json({ success: false, message: 'Invalid domain selection.' }, { status: 400 });
      user = picked;
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
