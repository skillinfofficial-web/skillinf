import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

type ContentType = 'internship' | 'program' | 'project';

const collectionMap: Record<ContentType, string> = {
  internship: 'internships',
  program: 'programs',
  project: 'projects',
};

interface PricingPayload {
  type: 'free' | 'paid';
  originalPrice?: number;
  offerPercentage?: number;
}

interface ContentPayload {
  type: ContentType;
  name: string;
  slug: string;
  description?: string;
  images: string[];
  link?: string;
  trending?: boolean;
  published?: boolean;
  duration?: number;
  time?: number;
  teachingSection?: string;
  projectCount?: number;
  mentorship?: string;
  pricing?: PricingPayload;
  skills: string[];
  projects?: string[];
}

function validatePayload(data: ContentPayload): string | null {
  if (!data.name?.trim()) return 'Name is required.';
  if (!data.images || data.images.length < 1) return 'Upload at least one WebP image.';
  if (data.images.length > 4) return 'Maximum 4 images allowed.';
  if (!data.skills || data.skills.length < 3) return 'At least 3 skills are required.';
  if (data.skills.some((s) => !s.trim())) return 'All skill fields must be filled.';

  if (data.type === 'project') {
    if (!data.link?.trim()) return 'Project link is required.';
    try { new URL(data.link); } catch { return 'Enter a valid project URL.'; }
  }

  if (data.type === 'internship' || data.type === 'program') {
    if (!data.duration || data.duration < 1) return 'Duration must be a valid number.';
    if (!data.time || data.time < 1) return 'Time must be a valid number.';
    if (!data.projectCount || data.projectCount < 1) return 'Project Count must be a valid number.';
    if (!data.projects || data.projects.length < 2) return 'At least 2 projects to build are required.';
    if (data.projects.some((p) => !p.trim())) return 'All project fields must be filled.';
    if (data.pricing?.type === 'paid') {
      if (data.pricing.originalPrice === undefined || data.pricing.originalPrice < 0)
        return 'Price must be 0 or more.';
      const off = data.pricing.offerPercentage ?? 0;
      if (off < 0 || off > 100) return 'Offer must be between 0 and 100.';
    }
  }
  return null;
}

function calculateFinalPrice(pricing: PricingPayload) {
  if (pricing.type === 'free') return { type: 'free', originalPrice: null, offerPercentage: 0, finalPrice: null };
  const original = pricing.originalPrice ?? 0;
  const offer = pricing.offerPercentage ?? 0;
  return { type: 'paid', originalPrice: original, offerPercentage: offer, finalPrice: parseFloat((original - (original * offer) / 100).toFixed(2)) };
}

// ── GET /api/content?type=internship ──────────────────────────
export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get('type') as ContentType | null;
    if (!type || !collectionMap[type]) {
      return NextResponse.json({ success: false, message: 'Invalid type. Use internship, program, or project.' }, { status: 400 });
    }
    const db = await getDatabase();
    const items = await db.collection(collectionMap[type]).find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ success: true, items: items.map((d) => ({ ...d, _id: d._id.toString() })) });
  } catch (err) {
    console.error('[GET /api/content]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── POST /api/content ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const data: ContentPayload = await req.json();
    const validationError = validatePayload(data);
    if (validationError) return NextResponse.json({ success: false, message: validationError }, { status: 400 });

    const db = await getDatabase();
    const now = new Date();
    let document: Record<string, unknown>;

    if (data.type === 'project') {
      document = { type: data.type, name: data.name.trim(), slug: data.slug?.trim(), description: data.description?.trim() ?? '', images: data.images, link: data.link!.trim(), trending: Boolean(data.trending), published: Boolean(data.published), skills: data.skills.map((s) => s.trim()), createdAt: now, updatedAt: now };
    } else {
      const pricingResult = data.pricing ? calculateFinalPrice(data.pricing) : { type: 'free', originalPrice: null, offerPercentage: 0, finalPrice: null };
      document = { type: data.type, name: data.name.trim(), slug: data.slug?.trim(), description: data.description?.trim() ?? '', images: data.images, duration: Number(data.duration), time: Number(data.time), teachingSection: data.teachingSection, projectCount: Number(data.projectCount), mentorship: data.mentorship, trending: Boolean(data.trending), published: Boolean(data.published), pricing: pricingResult, skills: data.skills.map((s) => s.trim()), projects: data.projects!.map((p) => p.trim()), createdAt: now, updatedAt: now };
    }

    const result = await db.collection(collectionMap[data.type]).insertOne(document);
    return NextResponse.json({ success: true, id: result.insertedId.toString(), message: `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} created successfully` });
  } catch (err) {
    console.error('[POST /api/content]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
