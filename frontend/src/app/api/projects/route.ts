import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// GET /api/projects — returns all projects sorted by newest first
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
    console.error('[GET /api/projects (frontend)]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
