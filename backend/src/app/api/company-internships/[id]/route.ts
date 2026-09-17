import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const YOUTUBE_REGEX =
  /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)[\w-]{11}|youtu\.be\/[\w-]{11})(?:[?&].*)?$/;

function isValidYouTubeUrl(url: string): boolean {
  return YOUTUBE_REGEX.test(url.trim());
}

interface WeekPayload {
  week: number;
  deadlineDays: number;
  tutorialUrl: string;
  keyFeatures: string[];
  whatYouLearn: string;
}

function validateWeek(w: WeekPayload, weekNum: number): string | null {
  if (!Number.isInteger(w.deadlineDays) || w.deadlineDays < 1)
    return `Week ${weekNum}: Deadline Days must be a positive integer.`;
  if (!w.tutorialUrl?.trim() || !isValidYouTubeUrl(w.tutorialUrl))
    return `Week ${weekNum}: Enter a valid YouTube URL.`;
  if (!w.keyFeatures || w.keyFeatures.length < 4)
    return `Week ${weekNum}: At least 4 key features are required.`;
  if (w.keyFeatures.some((f) => !f.trim()))
    return `Week ${weekNum}: All key feature fields must be filled.`;
  if (!w.whatYouLearn?.trim())
    return `Week ${weekNum}: "What You Learn" is required.`;
  if (w.whatYouLearn.length > 250)
    return `Week ${weekNum}: "What You Learn" must be 250 characters or fewer.`;
  return null;
}

// ── GET /api/company-internships/[id] ────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id))
      return NextResponse.json({ success: false, message: 'Invalid ID.' }, { status: 400 });

    const db = await getDatabase();
    const doc = await db.collection('CompanyInternships').findOne({ _id: new ObjectId(id) });
    if (!doc)
      return NextResponse.json({ success: false, message: 'Not found.' }, { status: 404 });

    return NextResponse.json({ success: true, item: { ...doc, _id: doc._id.toString() } });
  } catch (err) {
    console.error('[GET /api/company-internships/[id]]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── PUT /api/company-internships/[id] ────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id))
      return NextResponse.json({ success: false, message: 'Invalid ID.' }, { status: 400 });

    const data = await req.json();
    if (!data.name?.trim())
      return NextResponse.json({ success: false, message: 'Internship name is required.' }, { status: 400 });
    if (!data.weeks || data.weeks.length !== 4)
      return NextResponse.json({ success: false, message: 'All 4 weeks must be completed.' }, { status: 400 });

    for (let i = 0; i < 4; i++) {
      const err = validateWeek(data.weeks[i], i + 1);
      if (err) return NextResponse.json({ success: false, message: err }, { status: 400 });
    }

    const db = await getDatabase();
    const update = {
      name: data.name.trim(),
      weeks: data.weeks.map((w: WeekPayload, i: number) => ({
        week: i + 1,
        deadlineDays: Number(w.deadlineDays),
        tutorialUrl: w.tutorialUrl.trim(),
        keyFeatures: w.keyFeatures.map((f: string) => f.trim()),
        whatYouLearn: w.whatYouLearn.trim(),
      })),
      updatedAt: new Date(),
    };

    const result = await db
      .collection('CompanyInternships')
      .updateOne({ _id: new ObjectId(id) }, { $set: update });

    if (result.matchedCount === 0)
      return NextResponse.json({ success: false, message: 'Not found.' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Updated successfully.' });
  } catch (err) {
    console.error('[PUT /api/company-internships/[id]]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── DELETE /api/company-internships/[id] ─────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id))
      return NextResponse.json({ success: false, message: 'Invalid ID.' }, { status: 400 });

    const db = await getDatabase();
    const result = await db
      .collection('CompanyInternships')
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0)
      return NextResponse.json({ success: false, message: 'Not found.' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Deleted successfully.' });
  } catch (err) {
    console.error('[DELETE /api/company-internships/[id]]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
