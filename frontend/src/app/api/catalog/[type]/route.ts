import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

const collectionMap: Record<string, string> = {
  internship: 'internships',
  program: 'programs',
  project: 'projects',
};

// GET /api/catalog/[type]?trending=true
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const collection = collectionMap[type];
    if (!collection) {
      return NextResponse.json({ success: false, message: 'Invalid type.' }, { status: 400 });
    }

    const trendingOnly = req.nextUrl.searchParams.get('trending') === 'true';
    const query = trendingOnly
      ? { published: { $ne: false }, trending: true }
      : { published: { $ne: false } };

    const db = await getDatabase();
    const items = await db
      .collection(collection)
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      items: items.map((d) => ({ ...d, _id: d._id.toString() })),
    });
  } catch (err) {
    console.error('[GET /api/catalog/[type]]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
