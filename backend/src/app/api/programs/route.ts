import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// ── GET /api/programs ─────────────────────────────────────────
export async function GET() {
  try {
    const db = await getDatabase();
    const items = await db.collection('programs').find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({
      success: true,
      programs: items.map((d) => ({ ...d, _id: d._id.toString() })),
    });
  } catch (err) {
    console.error('[GET /api/programs]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── POST /api/programs ────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { name, startDate, endDate, platformName, platformImage, link } = await req.json();
    if (!name?.trim())
      return NextResponse.json({ success: false, message: 'Program name is required.' }, { status: 400 });
    if (!startDate)
      return NextResponse.json({ success: false, message: 'Start date is required.' }, { status: 400 });
    if (!endDate)
      return NextResponse.json({ success: false, message: 'End date is required.' }, { status: 400 });
    if (new Date(endDate) < new Date(startDate))
      return NextResponse.json({ success: false, message: 'End date must be after start date.' }, { status: 400 });
    if (!platformName?.trim())
      return NextResponse.json({ success: false, message: 'Platform is required.' }, { status: 400 });
    if (!link?.trim())
      return NextResponse.json({ success: false, message: 'Event/program link is required.' }, { status: 400 });
    try { new URL(link); } catch {
      return NextResponse.json({ success: false, message: 'Enter a valid URL (include https://).' }, { status: 400 });
    }

    const db = await getDatabase();
    const now = new Date();
    const result = await db.collection('programs').insertOne({
      name: name.trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      platformName: platformName.trim(),
      platformImage: platformImage ?? null, // base64 WebP from platforms collection
      link: link.trim(),
      createdAt: now,
      updatedAt: now,
    });
    return NextResponse.json({ success: true, id: result.insertedId.toString(), message: 'Program created.' });
  } catch (err) {
    console.error('[POST /api/programs]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── PUT /api/programs  (edit) ─────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const { id, name, startDate, endDate, platformName, platformImage, link } = await req.json();
    if (!id)
      return NextResponse.json({ success: false, message: 'ID is required.' }, { status: 400 });
    if (!name?.trim())
      return NextResponse.json({ success: false, message: 'Program name is required.' }, { status: 400 });
    if (!startDate || !endDate)
      return NextResponse.json({ success: false, message: 'Both dates are required.' }, { status: 400 });
    if (!link?.trim())
      return NextResponse.json({ success: false, message: 'Link is required.' }, { status: 400 });
    try { new URL(link); } catch {
      return NextResponse.json({ success: false, message: 'Enter a valid URL.' }, { status: 400 });
    }

    const db = await getDatabase();
    const result = await db.collection('programs').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name: name.trim(),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          platformName: platformName?.trim() ?? '',
          platformImage: platformImage ?? null,
          link: link.trim(),
          updatedAt: new Date(),
        },
      }
    );
    if (result.matchedCount === 0)
      return NextResponse.json({ success: false, message: 'Program not found.' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Program updated.' });
  } catch (err) {
    console.error('[PUT /api/programs]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── DELETE /api/programs ──────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id)
      return NextResponse.json({ success: false, message: 'ID is required.' }, { status: 400 });
    const db = await getDatabase();
    const result = await db.collection('programs').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0)
      return NextResponse.json({ success: false, message: 'Program not found.' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Program deleted.' });
  } catch (err) {
    console.error('[DELETE /api/programs]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
