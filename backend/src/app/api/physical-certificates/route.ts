import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// GET — all users who paid for physical certificate
export async function GET() {
  try {
    const db = await getDatabase();
    const users = await db.collection('users')
      .find({ 'physicalCertificate.paid': true })
      .project({
        name: 1, email: 1,
        'physicalCertificate.address': 1,
        'physicalCertificate.mobile': 1,
        'physicalCertificate.district': 1,
        'physicalCertificate.pincode': 1,
        'physicalCertificate.paid': 1,
        'physicalCertificate.registeredAt': 1,
      })
      .sort({ 'physicalCertificate.registeredAt': -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      members: users.map(u => ({
        id:           u._id.toString(),
        name:         u.name,
        email:        u.email,
        mobile:       u.physicalCertificate?.mobile ?? '—',
        address:      u.physicalCertificate?.address ?? '—',
        district:     u.physicalCertificate?.district ?? '—',
        pincode:      u.physicalCertificate?.pincode ?? '—',
        paid:         u.physicalCertificate?.paid ?? false,
        registeredAt: u.physicalCertificate?.registeredAt ?? null,
      })),
    });
  } catch (e) {
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 });
  }
}
