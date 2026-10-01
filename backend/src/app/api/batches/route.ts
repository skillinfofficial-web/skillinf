import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// ── GET /api/batches ──────────────────────────────────────────
export async function GET() {
  try {
    const db = await getDatabase();
    const batches = await db
      .collection('batches')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json({
      success: true,
      batches: batches.map((b) => ({ ...b, _id: b._id.toString() })),
    });
  } catch (err) {
    console.error('[GET /api/batches]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── POST /api/batches ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { batchName, startDate, endDate, whatsappLink } = await req.json();

    if (!batchName?.trim())
      return NextResponse.json({ success: false, message: 'Batch name is required.' }, { status: 400 });
    if (!startDate)
      return NextResponse.json({ success: false, message: 'Start date is required.' }, { status: 400 });
    if (!endDate)
      return NextResponse.json({ success: false, message: 'End date is required.' }, { status: 400 });
    if (new Date(endDate) < new Date(startDate))
      return NextResponse.json({ success: false, message: 'End date must be after start date.' }, { status: 400 });
    if (!whatsappLink?.trim())
      return NextResponse.json({ success: false, message: 'WhatsApp group link is required.' }, { status: 400 });
    try { new URL(whatsappLink); } catch {
      return NextResponse.json({ success: false, message: 'Enter a valid WhatsApp group URL.' }, { status: 400 });
    }

    const db = await getDatabase();
    const now = new Date();
    const doc = {
      batchName: batchName.trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      whatsappLink: whatsappLink.trim(),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    const result = await db.collection('batches').insertOne(doc);
    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
      message: 'Batch created successfully.',
    });
  } catch (err) {
    console.error('[POST /api/batches]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── DELETE /api/batches ───────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id)
      return NextResponse.json({ success: false, message: 'ID is required.' }, { status: 400 });
    const db = await getDatabase();
    const result = await db.collection('batches').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0)
      return NextResponse.json({ success: false, message: 'Batch not found.' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Batch deleted.' });
  } catch (err) {
    console.error('[DELETE /api/batches]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
