import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { COURSE_SEEDS } from '@/lib/courseSeeds';

// GET /api/admin/seed-courses
// Call this once to populate the courseDomains collection.
export async function GET() {
  try {
    const db         = await getDatabase();
    const collection = db.collection('courseDomains');

    let inserted = 0;
    let skipped  = 0;

    for (const seed of COURSE_SEEDS) {
      const existing = await collection.findOne({ domain: seed.domain });
      if (existing) { skipped++; continue; }
      await collection.insertOne({ ...seed, createdAt: new Date() });
      inserted++;
    }

    return NextResponse.json({ success: true, inserted, skipped, total: COURSE_SEEDS.length });
  } catch (e) {
    console.error('[GET /api/admin/seed-courses]', e);
    return NextResponse.json({ success: false, message: 'Seeding failed.' }, { status: 500 });
  }
}
