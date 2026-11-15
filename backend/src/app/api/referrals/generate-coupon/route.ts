import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// Builds a coupon code from the referrer's name: "JOHN_REF1", "ALICE_REF1" etc.
// Uppercases, strips non-alpha chars, takes first 8 chars, appends _REF1.
function buildCode(name: string): string {
  const slug = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
  return `${slug || 'USER'}_REF1`;
}

// POST /api/referrals/generate-coupon
// Body: { email: string; name: string; discountPercent: number }
// Creates a one-time-use offer code for the referrer and returns it.
export async function POST(req: NextRequest) {
  try {
    const { email, name, discountPercent } = await req.json() as {
      email: string;
      name: string;
      discountPercent: number;
    };

    if (!email || !name) {
      return NextResponse.json({ success: false, message: 'email and name are required.' }, { status: 400 });
    }
    const pct = Number(discountPercent);
    if (!pct || pct < 1 || pct > 100) {
      return NextResponse.json({ success: false, message: 'discountPercent must be 1–100.' }, { status: 400 });
    }

    const db   = await getDatabase();
    let   code = buildCode(name);

    // If a code with this slug already exists, make it unique by appending a counter
    const existing = await db.collection('offerCodes').findOne({ code });
    if (existing) {
      let n = 2;
      while (await db.collection('offerCodes').findOne({ code: `${buildCode(name)}${n}` })) n++;
      code = `${buildCode(name)}${n}`;
    }

    const now = new Date();
    const doc = {
      code,
      label:           `Referral reward — ${name}`,
      discountPercent: pct,
      limitType:       'count',
      maxCount:        1,          // one-time use only
      usedCount:       0,
      active:          true,
      referrerEmail:   email,
      referrerName:    name,
      createdAt:       now,
      updatedAt:       now,
    };

    await db.collection('offerCodes').insertOne(doc);
    return NextResponse.json({ success: true, code, discountPercent: pct });
  } catch (e) {
    console.error('[POST /api/referrals/generate-coupon]', e);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

