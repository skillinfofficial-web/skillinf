import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// GET — all users who completed e-certificate payment
export async function GET() {
  try {
    const db = await getDatabase();
    const users = await db.collection('users')
      .find({ paymentDone: true })
      .project({ name: 1, email: 1, domain: 1, paymentDone: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      users: users.map(u => ({
        id:        u._id.toString(),
        name:      u.name ?? '—',
        email:     u.email ?? '—',
        domain:    u.domain ?? '—',
        eCertPaid: u.paymentDone === true,
        createdAt: u.createdAt ?? null,
      })),
    });
  } catch (e) {
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 });
  }
}
