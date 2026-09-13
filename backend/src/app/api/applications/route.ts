import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// GET — all registered users with their full progress data
export async function GET() {
  try {
    const db = await getDatabase();
    const users = await db.collection('users')
      .find({})
      .project({
        name: 1, email: 1, domain: 1,
        linkedinVerified: 1,
        steps: 1,
        paymentDone: 1,
        'physicalCertificate.paid': 1,
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      users: users.map(u => ({
        id:               u._id.toString(),
        name:             u.name ?? '—',
        email:            u.email ?? '—',
        domain:           u.domain ?? '—',
        linkedinVerified: u.linkedinVerified === true,
        step1:            u.steps?.step1 === true,
        step2:            u.steps?.step2 === true,
        step3:            u.steps?.step3 === true,
        step4:            u.steps?.step4 === true,
        eCertPaid:        u.paymentDone === true,
        physicalCertPaid: u.physicalCertificate?.paid === true,
        createdAt:        u.createdAt ?? null,
      })),
    });
  } catch (e) {
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 });
  }
}
