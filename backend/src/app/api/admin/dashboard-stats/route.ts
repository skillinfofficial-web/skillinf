import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

const COLLECTION = 'SiteSettings';
const KEY        = 'adminReadTimestamps';

// Default: epoch 0 = everything ever is "unread" on first use
const EPOCH = new Date(0);

async function getTimestamps(db: Awaited<ReturnType<typeof getDatabase>>) {
  const doc = await db.collection(COLLECTION).findOne({ key: KEY });
  return {
    registrations:  doc?.registrations  ? new Date(doc.registrations)  : EPOCH,
    linkedinPending:doc?.linkedinPending ? new Date(doc.linkedinPending): EPOCH,
    eCertPending:   doc?.eCertPending   ? new Date(doc.eCertPending)   : EPOCH,
    physicalCert:   doc?.physicalCert   ? new Date(doc.physicalCert)   : EPOCH,
  };
}

// ── GET /api/admin/dashboard-stats ───────────────────────────────────────────
export async function GET() {
  try {
    const db = await getDatabase();
    const ts = await getTimestamps(db);

    const [
      totalUsers,
      // Unread = arrived AFTER admin last marked as read
      unreadRegistrations,
      unreadLinkedinPending,
      unreadECertPending,
      unreadPhysicalCert,
      // Totals (all-time)
      totalPendingLinkedin,
      totalPendingECert,
      totalPendingPhysical,
      totalLinkedinVerified,
      totalCertUnlocked,
      recentRegistrations,
    ] = await Promise.all([
      db.collection('users').countDocuments({}),

      // New registrations since last read
      db.collection('users').countDocuments({
        createdAt: { $gt: ts.registrations },
      }),
      // LinkedIn pending submitted since last read
      db.collection('users').countDocuments({
        linkedinVerified: 'pending',
        updatedAt: { $gt: ts.linkedinPending },
      }),
      // E-cert paid since last read (payment done but cert not issued)
      db.collection('users').countDocuments({
        paymentDone: true,
        certificateUnlocked: false,
        updatedAt: { $gt: ts.eCertPending },
      }),
      // Physical cert requested since last read
      db.collection('users').countDocuments({
        'physicalCertificate.paid': true,
        updatedAt: { $gt: ts.physicalCert },
      }),

      // All-time totals for management sections
      db.collection('users').countDocuments({ linkedinVerified: 'pending' }),
      db.collection('users').countDocuments({ paymentDone: true, certificateUnlocked: false }),
      db.collection('users').countDocuments({ 'physicalCertificate.paid': true }),
      db.collection('users').countDocuments({ linkedinVerified: true }),
      db.collection('users').countDocuments({ certificateUnlocked: true }),

      db.collection('users')
        .find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .project({ name: 1, email: 1, domain: 1, createdAt: 1, linkedinVerified: 1 })
        .toArray(),
    ]);

    // Step completion
    const stepAgg = await db.collection('users').aggregate([
      { $group: {
        _id: null,
        step1: { $sum: { $cond: ['$steps.step1', 1, 0] } },
        step2: { $sum: { $cond: ['$steps.step2', 1, 0] } },
        step3: { $sum: { $cond: ['$steps.step3', 1, 0] } },
        step4: { $sum: { $cond: ['$steps.step4', 1, 0] } },
      }},
    ]).toArray();
    const steps = stepAgg[0] ?? { step1: 0, step2: 0, step3: 0, step4: 0 };

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        // Unread counts (shown as badges)
        unread: {
          registrations:   unreadRegistrations,
          linkedinPending: unreadLinkedinPending,
          eCertPending:    unreadECertPending,
          physicalCert:    unreadPhysicalCert,
        },
        // All-time totals for management cards
        totals: {
          pendingLinkedin:      totalPendingLinkedin,
          pendingECert:         totalPendingECert,
          pendingPhysical:      totalPendingPhysical,
          linkedinVerified:     totalLinkedinVerified,
          certUnlocked:         totalCertUnlocked,
        },
        stepCompletion: {
          step1: steps.step1, step2: steps.step2,
          step3: steps.step3, step4: steps.step4,
        },
        // Last-read timestamps so UI can show "last checked at…"
        lastRead: {
          registrations:   ts.registrations.toISOString(),
          linkedinPending: ts.linkedinPending.toISOString(),
          eCertPending:    ts.eCertPending.toISOString(),
          physicalCert:    ts.physicalCert.toISOString(),
        },
      },
      recentRegistrations: recentRegistrations.map((u) => ({
        id:               u._id.toString(),
        name:             u.name as string,
        email:            u.email as string,
        domain:           u.domain as string,
        createdAt:        u.createdAt instanceof Date ? u.createdAt.toISOString() : (u.createdAt as string),
        linkedinVerified: u.linkedinVerified,
      })),
    });
  } catch (err) {
    console.error('[GET /api/admin/dashboard-stats]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── POST /api/admin/dashboard-stats — mark categories as read ────────────────
// Body: { categories: ['registrations', 'linkedinPending', 'eCertPending', 'physicalCert'] }
export async function POST(req: Request) {
  try {
    const { categories } = await req.json() as { categories: string[] };
    const now = new Date();
    const db  = await getDatabase();

    const update: Record<string, Date> = {};
    for (const cat of categories) {
      if (['registrations', 'linkedinPending', 'eCertPending', 'physicalCert'].includes(cat)) {
        update[cat] = now;
      }
    }
    if (Object.keys(update).length === 0)
      return NextResponse.json({ success: false, message: 'No valid categories.' }, { status: 400 });

    await db.collection(COLLECTION).updateOne(
      { key: KEY },
      { $set: { key: KEY, ...update } },
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/admin/dashboard-stats]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
