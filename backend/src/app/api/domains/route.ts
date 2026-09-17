import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// ── GET /api/domains ─────────────────────────────────────────────────────────
export async function GET() {
  try {
    const db   = await getDatabase();
    const docs = await db.collection('Domains').find({}).sort({ name: 1 }).toArray();
    const domains = docs.map((d) => ({ name: d.name as string }));
    return NextResponse.json({ success: true, domains });
  } catch (err) {
    console.error('[GET /api/domains]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── POST /api/domains ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name?.trim())
      return NextResponse.json({ success: false, message: 'Domain name is required.' }, { status: 400 });

    const trimmed = name.trim();
    const db      = await getDatabase();

    const existing = await db.collection('Domains').findOne({
      name: { $regex: new RegExp(`^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });
    if (existing)
      return NextResponse.json({ success: false, message: 'Domain already exists.' }, { status: 409 });

    await db.collection('Domains').insertOne({ name: trimmed, createdAt: new Date() });
    return NextResponse.json({ success: true, message: 'Domain added successfully.' });
  } catch (err) {
    console.error('[POST /api/domains]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── PUT /api/domains — rename a domain ───────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const { oldName, newName } = await req.json();
    if (!oldName || !newName?.trim())
      return NextResponse.json({ success: false, message: 'oldName and newName are required.' }, { status: 400 });

    const trimmed = newName.trim();
    const db      = await getDatabase();

    const existing = await db.collection('Domains').findOne({
      name: { $regex: new RegExp(`^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });
    if (existing && existing.name !== oldName)
      return NextResponse.json({ success: false, message: 'A domain with that name already exists.' }, { status: 409 });

    const result = await db.collection('Domains').updateOne(
      { name: oldName },
      { $set: { name: trimmed, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0)
      return NextResponse.json({ success: false, message: 'Domain not found.' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Domain updated.' });
  } catch (err) {
    console.error('[PUT /api/domains]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── DELETE /api/domains ──────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name)
      return NextResponse.json({ success: false, message: 'Domain name required.' }, { status: 400 });

    const db = await getDatabase();
    await db.collection('Domains').deleteOne({ name });
    return NextResponse.json({ success: true, message: 'Domain deleted.' });
  } catch (err) {
    console.error('[DELETE /api/domains]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
