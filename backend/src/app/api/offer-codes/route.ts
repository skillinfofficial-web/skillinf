import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// ─── Generate a 7-char unique offer code ───────────────────────────────────
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── GET — list all offer codes ────────────────────────────────────────────
export async function GET() {
  try {
    const db = await getDatabase();
    const codes = await db
      .collection('offerCodes')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json({ success: true, data: codes });
  } catch (e) {
    console.error('[GET /api/offer-codes]', e);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ─── POST — create a new offer code ────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { discountPercent, limitType, limitValue } = body;

    if (!discountPercent || discountPercent < 1 || discountPercent > 100)
      return NextResponse.json({ success: false, message: 'Discount must be 1–100%.' }, { status: 400 });

    if (!limitType || !['time', 'count'].includes(limitType))
      return NextResponse.json({ success: false, message: 'limitType must be "time" or "count".' }, { status: 400 });

    if (limitType === 'count' && (!limitValue || limitValue < 1))
      return NextResponse.json({ success: false, message: 'Count must be at least 1.' }, { status: 400 });

    if (limitType === 'time') {
      if (!limitValue)
        return NextResponse.json({ success: false, message: 'End date/time is required.' }, { status: 400 });
      const endDate = new Date(limitValue);
      if (isNaN(endDate.getTime()) || endDate <= new Date())
        return NextResponse.json({ success: false, message: 'End date/time must be in the future.' }, { status: 400 });
    }

    const db = await getDatabase();

    // Generate a unique code
    let code = '';
    let attempts = 0;
    while (attempts < 10) {
      const candidate = generateCode();
      const existing = await db.collection('offerCodes').findOne({ code: candidate });
      if (!existing) { code = candidate; break; }
      attempts++;
    }
    if (!code)
      return NextResponse.json({ success: false, message: 'Failed to generate unique code. Try again.' }, { status: 500 });

    const now = new Date();
    const doc = {
      code,
      discountPercent: Number(discountPercent),
      limitType,
      active: true,
      usedCount: 0,
      createdAt: now,
      ...(limitType === 'time'
        ? { startTime: now, endTime: new Date(limitValue) }
        : { maxCount: Number(limitValue) }),
    };

    await db.collection('offerCodes').insertOne(doc);
    return NextResponse.json({ success: true, code, data: doc });
  } catch (e) {
    console.error('[POST /api/offer-codes]', e);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ─── PATCH — toggle active status (activate / deactivate) ───────────────────
export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id)
      return NextResponse.json({ success: false, message: 'id is required.' }, { status: 400 });

    const body = await req.json();
    const { active } = body;
    if (typeof active !== 'boolean')
      return NextResponse.json({ success: false, message: 'active (boolean) is required.' }, { status: 400 });

    const db = await getDatabase();
    await db.collection('offerCodes').updateOne(
      { _id: new ObjectId(id) },
      { $set: { active } }
    );
    return NextResponse.json({ success: true, active });
  } catch (e) {
    console.error('[PATCH /api/offer-codes]', e);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ─── DELETE — deactivate an offer code ──────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id)
      return NextResponse.json({ success: false, message: 'id is required.' }, { status: 400 });

    const db = await getDatabase();
    await db.collection('offerCodes').updateOne(
      { _id: new ObjectId(id) },
      { $set: { active: false } }
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[DELETE /api/offer-codes]', e);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
