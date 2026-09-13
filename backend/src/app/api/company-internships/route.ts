import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// ── YouTube URL validation ────────────────────────────────────────────────────
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

interface CompanyInternshipPayload {
  name: string;
  weeks: WeekPayload[];
}

function validateWeek(w: WeekPayload, weekNum: number): string | null {
  if (!Number.isInteger(w.deadlineDays) || w.deadlineDays < 1)
    return `Week ${weekNum}: Deadline Days must be a positive integer.`;
  if (!w.tutorialUrl?.trim() || !isValidYouTubeUrl(w.tutorialUrl))
    return `Week ${weekNum}: Enter a valid YouTube URL (youtube.com/watch?v=... or youtu.be/...).`;
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

function validatePayload(data: CompanyInternshipPayload): string | null {
  if (!data.name?.trim()) return 'Internship name is required.';
  if (!data.weeks || data.weeks.length !== 4)
    return 'All 4 weeks must be completed.';
  for (let i = 0; i < 4; i++) {
    const err = validateWeek(data.weeks[i], i + 1);
    if (err) return err;
  }
  return null;
}

// ── GET /api/company-internships ─────────────────────────────────────────────
export async function GET() {
  try {
    const db = await getDatabase();
    const items = await db
      .collection('CompanyInternships')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json({
      success: true,
      items: items.map((d) => ({ ...d, _id: d._id.toString() })),
    });
  } catch (err) {
    console.error('[GET /api/company-internships]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── POST /api/company-internships ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const data: CompanyInternshipPayload = await req.json();
    const validationError = validatePayload(data);
    if (validationError)
      return NextResponse.json({ success: false, message: validationError }, { status: 400 });

    const now = new Date();
    const document = {
      name: data.name.trim(),
      weeks: data.weeks.map((w, i) => ({
        week: i + 1,
        deadlineDays: Number(w.deadlineDays),
        tutorialUrl: w.tutorialUrl.trim(),
        keyFeatures: w.keyFeatures.map((f) => f.trim()),
        whatYouLearn: w.whatYouLearn.trim(),
      })),
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDatabase();
    const result = await db.collection('CompanyInternships').insertOne(document);
    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
      message: 'Company internship created successfully.',
    });
  } catch (err) {
    console.error('[POST /api/company-internships]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
