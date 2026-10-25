import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const istNow = () =>
  new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short',
    year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
  });

// ── GET /api/careers ──────────────────────────────────────────
export async function GET() {
  try {
    const db   = await getDatabase();
    const jobs = await db.collection('careers').find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({
      success: true,
      jobs: jobs.map(j => ({ ...j, _id: j._id.toString() })),
    });
  } catch (err) {
    console.error('[GET /api/careers]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── POST /api/careers  (create job) ──────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title, department, location, type, experience,
      salary, description, responsibilities, requirements,
      niceToHave, benefits, applyEmail, status,
    } = body;

    if (!title?.trim() || !department?.trim() || !description?.trim() || !applyEmail?.trim()) {
      return NextResponse.json(
        { success: false, message: 'title, department, description and applyEmail are required.' },
        { status: 400 }
      );
    }

    const doc = {
      title:           title.trim(),
      department:      department.trim(),
      location:        location?.trim() || 'Remote',
      type:            type?.trim()     || 'Full-time',
      experience:      experience?.trim() || '',
      salary:          salary?.trim()   || '',
      description:     description.trim(),
      responsibilities: responsibilities?.trim() || '',
      requirements:    requirements?.trim()    || '',
      niceToHave:      niceToHave?.trim()      || '',
      benefits:        benefits?.trim()         || '',
      applyEmail:      applyEmail.trim(),
      status:          status === 'closed' ? 'closed' : 'open',
      createdAt:       new Date(),
      updatedAt:       new Date(),
      createdAtIST:    istNow(),
    };

    const db  = await getDatabase();
    const res = await db.collection('careers').insertOne(doc);
    return NextResponse.json({ success: true, message: 'Job posted successfully.', id: res.insertedId.toString() });
  } catch (err) {
    console.error('[POST /api/careers]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── PATCH /api/careers  (toggle status / update) ─────────────
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, message: 'id is required.' }, { status: 400 });

    const set: Record<string, unknown> = { updatedAt: new Date(), updatedAtIST: istNow() };
    if (status) set.status = status;
    Object.keys(updates).forEach(k => { if (updates[k] !== undefined) set[k] = updates[k]; });

    const db = await getDatabase();
    await db.collection('careers').updateOne({ _id: new ObjectId(id) }, { $set: set });
    return NextResponse.json({ success: true, message: 'Job updated.' });
  } catch (err) {
    console.error('[PATCH /api/careers]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── DELETE /api/careers ───────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, message: 'id is required.' }, { status: 400 });

    const db = await getDatabase();
    await db.collection('careers').deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true, message: 'Job deleted.' });
  } catch (err) {
    console.error('[DELETE /api/careers]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
