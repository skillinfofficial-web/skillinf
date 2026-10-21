import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

// POST — verify a sub-admin credential
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Missing fields.' }, { status: 400 });
    }

    const db  = await getDatabase();
    const doc = await db.collection('admin_credentials').findOne({ email: email.toLowerCase() });

    if (!doc) {
      return NextResponse.json({ success: false, message: 'Invalid credentials.' }, { status: 401 });
    }

    const match = await bcrypt.compare(password, doc.passwordHash);
    if (!match) {
      return NextResponse.json({ success: false, message: 'Invalid credentials.' }, { status: 401 });
    }

    return NextResponse.json({
      success:     true,
      label:       doc.label,
      email:       doc.email,
      permissions: doc.permissions,
    });
  } catch (e) {
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 });
  }
}
