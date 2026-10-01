import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDatabase();
    const programs = await db
      .collection('programs')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json({
      success: true,
      programs: programs.map((p) => ({ ...p, _id: p._id.toString() })),
    });
  } catch (err) {
    console.error('[GET /api/programs (frontend)]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
