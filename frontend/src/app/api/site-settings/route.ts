import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

const SETTINGS_ID = 'global' as unknown as import('mongodb').ObjectId;
const DEFAULTS = {
  maintenanceMode: false,
  maintenanceMessage: "We are currently performing scheduled maintenance. We'll be back shortly!\n\nFor urgent queries, contact us at support@skillinf.in",
};

export async function GET() {
  try {
    const db  = await getDatabase();
    const doc = await db.collection('site_settings').findOne({ _id: SETTINGS_ID });
    return NextResponse.json({ success: true, settings: { ...DEFAULTS, ...(doc ?? {}) } });
  } catch {
    // On error, return defaults so the site doesn't break
    return NextResponse.json({ success: true, settings: DEFAULTS });
  }
}
