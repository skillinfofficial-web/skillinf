import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';

type ContentType = 'internship' | 'program' | 'project';

const collectionMap: Record<ContentType, string> = {
  internship: 'internships',
  program: 'programs',
  project: 'projects',
};

function getCollection(type: string | null) {
  if (!type || !(type in collectionMap)) return null;
  return collectionMap[type as ContentType];
}

function calculateFinalPrice(pricing: { type: string; originalPrice?: number; offerPercentage?: number }) {
  if (pricing.type === 'free') return { type: 'free', originalPrice: null, offerPercentage: 0, finalPrice: null };
  const original = pricing.originalPrice ?? 0;
  const offer = pricing.offerPercentage ?? 0;
  return { type: 'paid', originalPrice: original, offerPercentage: offer, finalPrice: parseFloat((original - (original * offer) / 100).toFixed(2)) };
}

// ── GET /api/content/[id]?type=internship ─────────────────────
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const type = req.nextUrl.searchParams.get('type');
    const collection = getCollection(type);
    if (!collection) return NextResponse.json({ success: false, message: 'Invalid type.' }, { status: 400 });
    if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, message: 'Invalid ID.' }, { status: 400 });

    const db = await getDatabase();
    const item = await db.collection(collection).findOne({ _id: new ObjectId(id) });
    if (!item) return NextResponse.json({ success: false, message: 'Not found.' }, { status: 404 });

    return NextResponse.json({ success: true, item: { ...item, _id: item._id.toString() } });
  } catch (err) {
    console.error('[GET /api/content/[id]]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── PUT /api/content/[id]?type=internship ─────────────────────
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const type = req.nextUrl.searchParams.get('type');
    const collection = getCollection(type);
    if (!collection) return NextResponse.json({ success: false, message: 'Invalid type.' }, { status: 400 });
    if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, message: 'Invalid ID.' }, { status: 400 });

    const data = await req.json();
    const now = new Date();

    // Build update document based on type
    let update: Record<string, unknown>;
    if (type === 'project') {
      update = {
        name: data.name?.trim(),
        images: data.images,
        link: data.link?.trim(),
        trending: Boolean(data.trending),
        skills: data.skills?.map((s: string) => s.trim()),
        updatedAt: now,
      };
    } else {
      const pricingResult = data.pricing ? calculateFinalPrice(data.pricing) : undefined;
      update = {
        name: data.name?.trim(),
        images: data.images,
        duration: Number(data.duration),
        time: Number(data.time),
        teachingSection: data.teachingSection,
        projectCount: Number(data.projectCount),
        mentorship: data.mentorship,
        trending: Boolean(data.trending),
        ...(pricingResult && { pricing: pricingResult }),
        skills: data.skills?.map((s: string) => s.trim()),
        projects: data.projects?.map((p: string) => p.trim()),
        updatedAt: now,
      };
    }

    const db = await getDatabase();
    const result = await db.collection(collection).updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    );

    if (result.matchedCount === 0) return NextResponse.json({ success: false, message: 'Not found.' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Updated successfully.' });
  } catch (err) {
    console.error('[PUT /api/content/[id]]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── DELETE /api/content/[id]?type=internship ──────────────────
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const type = req.nextUrl.searchParams.get('type');
    const collection = getCollection(type);
    if (!collection) return NextResponse.json({ success: false, message: 'Invalid type.' }, { status: 400 });
    if (!ObjectId.isValid(id)) return NextResponse.json({ success: false, message: 'Invalid ID.' }, { status: 400 });

    const db = await getDatabase();
    const result = await db.collection(collection).deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return NextResponse.json({ success: false, message: 'Not found.' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Deleted successfully.' });
  } catch (err) {
    console.error('[DELETE /api/content/[id]]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
