import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// GET /api/domains — returns all domains sorted alphabetically
// Used by the sign-up page Course Domain dropdown
export async function GET() {
  try {
    const db   = await getDatabase();
    const docs = await db.collection('Domains').find({}).sort({ name: 1 }).toArray();
    // Return objects { name } to match backend API format
    const domains = docs.map((d) => ({ name: d.name as string }));
    return NextResponse.json({ success: true, domains });
  } catch (err) {
    console.error('[GET /api/domains (frontend)]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
