import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// Simple admin password guard
function isAdmin(req: Request) {
  const auth = req.headers.get('x-admin-key');
  return auth === (process.env.ADMIN_KEY ?? 'skillinf-admin-2024');
}

export async function GET(req: Request) {
  if (!isAdmin(req))
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const db = await getDatabase();

    // All users who have a referral code
    const allUsers = await db
      .collection('users')
      .find({ myReferralCode: { $exists: true, $ne: null } })
      .project({ name: 1, email: 1, myReferralCode: 1, domain: 1, createdAt: 1 })
      .toArray();

    // Build a map: referralCode -> { referrer info, referredCount, referredList }
    const codeMap = new Map<
      string,
      { name: string; email: string; code: string; domain: string; createdAt: Date; referredCount: number; referredUsers: { name: string; email: string; domain: string; joinedAt: Date }[] }
    >();

    for (const u of allUsers) {
      const code = u.myReferralCode as string;
      if (!codeMap.has(code)) {
        codeMap.set(code, {
          name: u.name as string,
          email: u.email as string,
          code,
          domain: u.domain as string,
          createdAt: u.createdAt as Date,
          referredCount: 0,
          referredUsers: [],
        });
      }
    }

    // Find all users who were referred
    const referredUsers = await db
      .collection('users')
      .find({ referredBy: { $exists: true, $ne: null } })
      .project({ name: 1, email: 1, domain: 1, referredBy: 1, createdAt: 1 })
      .toArray();

    for (const ru of referredUsers) {
      const refCode = ru.referredBy as string;
      const entry = codeMap.get(refCode);
      if (entry) {
        entry.referredCount += 1;
        entry.referredUsers.push({
          name: ru.name as string,
          email: ru.email as string,
          domain: ru.domain as string,
          joinedAt: ru.createdAt as Date,
        });
      }
    }

    // Return sorted by referredCount descending
    const result = Array.from(codeMap.values())
      .sort((a, b) => b.referredCount - a.referredCount);

    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    console.error('[GET /api/admin/referrals]', e);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
