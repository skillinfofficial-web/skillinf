import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

const COLLECTION = 'SiteSettings';
const KEY        = 'announcementBar';

const DEFAULT_MESSAGE =
  '🎓 Registrations Open — Next Internship Batch Starting Soon · Register Now → · Apply Before Slots End';

// ── GET /api/announcement ────────────────────────────────────────────────────
export async function GET() {
  try {
    const db  = await getDatabase();
    const doc = await db.collection(COLLECTION).findOne({ key: KEY });
    return NextResponse.json({
      success: true,
      message: doc?.message ?? DEFAULT_MESSAGE,
      enabled: doc?.enabled !== false, // default true
    });
  } catch (err) {
    console.error('[GET /api/announcement]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── PUT /api/announcement ────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const { message, enabled } = await req.json();
    if (typeof message !== 'string' || !message.trim())
      return NextResponse.json({ success: false, message: 'Message text is required.' }, { status: 400 });

    const db = await getDatabase();
    await db.collection(COLLECTION).updateOne(
      { key: KEY },
      {
        $set: {
          key: KEY,
          message: message.trim(),
          enabled: enabled !== false,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
    return NextResponse.json({ success: true, message: 'Announcement updated.' });
  } catch (err) {
    console.error('[PUT /api/announcement]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
