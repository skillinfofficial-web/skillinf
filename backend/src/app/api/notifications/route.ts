import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// GET — returns current counts for new applications and physical cert requests
export async function GET() {
  try {
    const db = await getDatabase();
    const [applicationCount, physicalCertCount, linkedinPendingCount] = await Promise.all([
      db.collection('users').countDocuments({}),
      db.collection('users').countDocuments({ 'physicalCertificate.paid': true }),
      db.collection('users').countDocuments({ linkedinVerified: 'pending' }),
    ]);

    return NextResponse.json({
      success: true,
      counts: { applicationCount, physicalCertCount, linkedinPendingCount },
    });
  } catch (e) {
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 });
  }
}
