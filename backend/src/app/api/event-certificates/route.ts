import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// ── GET /api/event-certificates ──────────────────────────────
export async function GET() {
  try {
    const db    = await getDatabase();
    const items = await db.collection('event_certificates').find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({
      success: true,
      data: items.map((d) => ({ ...d, _id: d._id.toString() })),
    });
  } catch (err) {
    console.error('[GET /api/event-certificates]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── POST /api/event-certificates ─────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { programId, programName, templates, participants, prizes, contents } = body;

    if (!programId?.trim())
      return NextResponse.json({ success: false, message: 'Program is required.' }, { status: 400 });
    if (!Array.isArray(templates) || templates.length === 0)
      return NextResponse.json({ success: false, message: 'At least one certificate template is required.' }, { status: 400 });
    if (!Array.isArray(participants))
      return NextResponse.json({ success: false, message: 'Participants list is required.' }, { status: 400 });

    const db  = await getDatabase();
    const now = new Date();
    const result = await db.collection('event_certificates').insertOne({
      programId:    programId.trim(),
      programName:  programName?.trim() ?? '',
      templates,       // [{ label, imageUrl, order }]
      participants,    // string[] of emails
      prizes,          // [{ label, email, templateIndex }]
      contents,        // [{ templateIndex, topText, topColor, bodyText, bodyColor, nameColor, nameYPct, topFontSize, nameFontSize, bodyFontSize }]
      createdAt: now,
      updatedAt: now,
    });
    return NextResponse.json({ success: true, id: result.insertedId.toString(), message: 'Event certificate config created.' });
  } catch (err) {
    console.error('[POST /api/event-certificates]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── PUT /api/event-certificates ──────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, programId, programName, templates, participants, prizes, contents } = body;

    if (!id)
      return NextResponse.json({ success: false, message: 'ID is required.' }, { status: 400 });
    if (!programId?.trim())
      return NextResponse.json({ success: false, message: 'Program is required.' }, { status: 400 });
    if (!Array.isArray(templates) || templates.length === 0)
      return NextResponse.json({ success: false, message: 'At least one template is required.' }, { status: 400 });

    const db     = await getDatabase();
    const result = await db.collection('event_certificates').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          programId:   programId.trim(),
          programName: programName?.trim() ?? '',
          templates,
          participants,
          prizes,
          contents,
          updatedAt: new Date(),
        },
      }
    );
    if (result.matchedCount === 0)
      return NextResponse.json({ success: false, message: 'Record not found.' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Event certificate config updated.' });
  } catch (err) {
    console.error('[PUT /api/event-certificates]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── DELETE /api/event-certificates ───────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id)
      return NextResponse.json({ success: false, message: 'ID is required.' }, { status: 400 });
    const db     = await getDatabase();
    const result = await db.collection('event_certificates').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0)
      return NextResponse.json({ success: false, message: 'Record not found.' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Deleted.' });
  } catch (err) {
    console.error('[DELETE /api/event-certificates]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
