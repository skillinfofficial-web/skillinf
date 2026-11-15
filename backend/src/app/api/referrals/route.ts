import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// GET — referral stats for admin management section
export async function GET() {
  try {
    const db = await getDatabase();

    // All users that have a referral code
    const allUsers = await db.collection('users')
      .find({ myReferralCode: { $exists: true, $ne: null } })
      .sort({ createdAt: -1 })
      .toArray();

    // Deduplicate by email (same person, multiple domains → same referral code)
    const seen = new Map<string, {
      email: string; name: string; myReferralCode: string;
      referredCount: number; referredMembers: string[];
    }>();

    for (const u of allUsers) {
      const email = u.email as string;
      if (!seen.has(email)) {
        seen.set(email, {
          email,
          name: u.name as string,
          myReferralCode: u.myReferralCode as string,
          referredCount: 0,
          referredMembers: [],
        });
      }
    }

    // Count referrals per code — also fetch full referred user docs for step data
    const referred = await db.collection('users')
      .find({ referredBy: { $exists: true, $ne: null } })
      .project({
        email: 1, name: 1, referredBy: 1, domain: 1,
        linkedinVerified: 1,
        'steps.step1': 1, 'steps.step2': 1,
        'steps.step3': 1, 'steps.step4': 1,
        paymentDone: 1,
      })
      .toArray();

    for (const r of referred) {
      const code = r.referredBy as string;
      for (const entry of seen.values()) {
        if (entry.myReferralCode === code) {
          entry.referredCount++;
          const refEmail = r.email as string;
          if (!entry.referredMembers.find((m: string | object) =>
            typeof m === 'string' ? m === refEmail : (m as { email: string }).email === refEmail
          )) {
            // Push full member detail object instead of just email
            (entry.referredMembers as unknown as object[]).push({
              email:            refEmail,
              name:             (r.name as string) || refEmail,
              domain:           (r.domain as string) || '',
              linkedinVerified: !!(r.linkedinVerified === true || r.linkedinVerified === 'approved'),
              step1:            !!(r.steps?.step1),
              step2:            !!(r.steps?.step2),
              step3:            !!(r.steps?.step3),
              step4:            !!(r.steps?.step4),
              eCertPaid:        !!(r.paymentDone),
            });
          }
        }
      }
    }

    const data = Array.from(seen.values()).sort((a, b) => b.referredCount - a.referredCount);
    return NextResponse.json({ success: true, referrals: data });
  } catch (e) {
    console.error('[GET /api/referrals]', e);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
