import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// ── GET /api/platforms ────────────────────────────────────────
export async function GET() {
  try {
    const db = await getDatabase();
    const platforms = await db
      .collection('platforms')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json({
      success: true,
      platforms: platforms.map((p) => ({ ...p, _id: p._id.toString() })),
    });
  } catch (err) {
    console.error('[GET /api/platforms]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── POST /api/platforms ───────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { name, image } = await req.json();
    if (!name?.trim())
      return NextResponse.json({ success: false, message: 'Platform name is required.' }, { status: 400 });
    if (!image)
      return NextResponse.json({ success: false, message: 'Platform image is required.' }, { status: 400 });

    const db = await getDatabase();
    const now = new Date();
    const result = await db.collection('platforms').insertOne({
      name: name.trim(),
      image,          // base64 WebP string
      createdAt: now,
      updatedAt: now,
    });
    return NextResponse.json({ success: true, id: result.insertedId.toString(), message: 'Platform added successfully.' });
  } catch (err) {
    console.error('[POST /api/platforms]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── DELETE /api/platforms ─────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id)
      return NextResponse.json({ success: false, message: 'ID is required.' }, { status: 400 });
    const db = await getDatabase();
    const result = await db.collection('platforms').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0)
      return NextResponse.json({ success: false, message: 'Platform not found.' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Platform deleted.' });
  } catch (err) {
    console.error('[DELETE /api/platforms]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
