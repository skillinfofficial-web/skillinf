import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// GET /api/careers — public endpoint to list open jobs
export async function GET() {
  try {
    const db   = await getDatabase();
    const jobs = await db
      .collection('careers')
      .find({ status: 'open' })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      jobs: jobs.map(j => ({ ...j, _id: j._id.toString() })),
    });
  } catch (err) {
    console.error('[GET /api/careers]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
