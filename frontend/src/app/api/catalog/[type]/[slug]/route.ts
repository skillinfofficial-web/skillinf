import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';

const collectionMap: Record<string, string> = {
  internship: 'internships',
  program: 'programs',
  project: 'projects',
};

// GET /api/catalog/[type]/[slug]
// Tries slug first, falls back to MongoDB _id so cards with no slug still work
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string; slug: string }> }
) {
  try {
    const { type, slug } = await params;
    const collection = collectionMap[type];
    if (!collection) {
      return NextResponse.json({ success: false, message: 'Invalid type.' }, { status: 400 });
    }

    const db = await getDatabase();
    const filter = { published: { $ne: false } };

    // 1. Try by slug
    let item = await db.collection(collection).findOne({ slug, ...filter });

    // 2. Fallback: try by MongoDB _id (for items that have no slug yet)
    if (!item) {
      try {
        const oid = new ObjectId(slug);
        item = await db.collection(collection).findOne({ _id: oid, ...filter });
      } catch {
        // slug is not a valid ObjectId — ignore
      }
    }

    if (!item) {
      return NextResponse.json({ success: false, message: 'Not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      item: { ...item, _id: item._id.toString() },
    });
  } catch (err) {
    console.error('[GET /api/catalog/[type]/[slug]]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
