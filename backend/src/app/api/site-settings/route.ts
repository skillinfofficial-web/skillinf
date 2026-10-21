import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

const SETTINGS_ID = 'global' as unknown as import('mongodb').ObjectId;
const DEFAULTS = {
  maintenanceMode: false,
  maintenanceMessage: 'We are currently performing scheduled maintenance. We\'ll be back shortly!\n\nFor urgent queries, contact us at support@skillinf.in',
};

// GET — fetch current site settings
export async function GET() {
  try {
    const db  = await getDatabase();
    const doc = await db.collection('site_settings').findOne({ _id: SETTINGS_ID });
    return NextResponse.json({ success: true, settings: { ...DEFAULTS, ...(doc ?? {}) } });
  } catch (e) {
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 });
  }
}

// PUT — admin updates site settings
export async function PUT(req: Request) {
  try {
    const body = await req.json() as Partial<typeof DEFAULTS>;
    const db   = await getDatabase();
    await db.collection('site_settings').updateOne(
      { _id: SETTINGS_ID },
      { $set: { ...body, updatedAt: new Date() } },
      { upsert: true },
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 });
  }
}
