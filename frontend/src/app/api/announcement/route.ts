import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

const COLLECTION = 'SiteSettings';
const KEY        = 'announcementBar';

const DEFAULT_MESSAGE =
  '🎓 Registrations Open — Next Internship Batch Starting Soon · Register Now → · Apply Before Slots End';

// GET /api/announcement — used by the AnnouncementBar component
export async function GET() {
  try {
    const db  = await getDatabase();
    const doc = await db.collection(COLLECTION).findOne({ key: KEY });
    return NextResponse.json({
      success: true,
      message: (doc?.message as string) ?? DEFAULT_MESSAGE,
      enabled: doc?.enabled !== false,
    });
  } catch (err) {
    console.error('[GET /api/announcement (frontend)]', err);
    // On error, return defaults so the bar still works
    return NextResponse.json({
      success: true,
      message: DEFAULT_MESSAGE,
      enabled: true,
    });
  }
}
