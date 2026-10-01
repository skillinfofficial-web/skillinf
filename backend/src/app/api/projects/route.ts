import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// ── GET /api/projects ─────────────────────────────────────────
export async function GET() {
  try {
    const db = await getDatabase();
    const items = await db
      .collection('projects')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json({
      success: true,
      items: items.map((d) => ({ ...d, _id: d._id.toString() })),
    });
  } catch (err) {
    console.error('[GET /api/projects]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── POST /api/projects ────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { name, domain, image, githubLink } = await req.json();

    if (!name?.trim()) return NextResponse.json({ success: false, message: 'Project name is required.' }, { status: 400 });
    if (!domain?.trim()) return NextResponse.json({ success: false, message: 'Domain is required.' }, { status: 400 });
    if (!image) return NextResponse.json({ success: false, message: 'Project image is required.' }, { status: 400 });
    if (!githubLink?.trim()) return NextResponse.json({ success: false, message: 'GitHub link is required.' }, { status: 400 });
    try { new URL(githubLink); } catch { return NextResponse.json({ success: false, message: 'Enter a valid GitHub URL.' }, { status: 400 }); }

    const db = await getDatabase();
    const now = new Date();
    const doc = {
      name: name.trim(),
      domain: domain.trim(),
      image, // base64 WebP string
      githubLink: githubLink.trim(),
      createdAt: now,
      updatedAt: now,
    };
    const result = await db.collection('projects').insertOne(doc);
    return NextResponse.json({ success: true, id: result.insertedId.toString(), message: 'Project created successfully.' });
  } catch (err) {
    console.error('[POST /api/projects]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── DELETE /api/projects ──────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, message: 'ID is required.' }, { status: 400 });
    const db = await getDatabase();
    const result = await db.collection('projects').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return NextResponse.json({ success: false, message: 'Project not found.' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Project deleted.' });
  } catch (err) {
    console.error('[DELETE /api/projects]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
