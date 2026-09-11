import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name, email, mobile, mode,
      startDate, endDate,
      itemName, itemType, itemId,
      amount, paymentId,
      createdAt,
    } = body;

    /* Basic guard */
    if (!name || !email || !mobile || !mode || !startDate || !endDate) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const db = await getDatabase();

    const doc = {
      name:      name.trim(),
      email:     email.trim().toLowerCase(),
      mobile:    mobile.trim(),
      mode,                        // 'certificate' | 'learn'
      startDate,
      endDate,
      itemName,
      itemType,                    // 'internship' | 'program'
      itemId,
      amount,
      paymentId: paymentId ?? null,
      createdAt: createdAt ? new Date(createdAt) : new Date(),
    };

    const result = await db.collection('payment').insertOne(doc);

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
