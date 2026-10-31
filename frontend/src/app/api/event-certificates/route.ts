import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDatabase();
    const docs = await db.collection('event_certificates').find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({
      success: true,
      data: docs.map(d => ({ ...d, _id: d._id.toString() })),
    });
  } catch (e) {
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = await getDatabase();
    const now = new Date();
    const result = await db.collection('event_certificates').insertOne({ ...body, createdAt: now, updatedAt: now });
    return NextResponse.json({ success: true, id: result.insertedId.toString() });
  } catch (e) {
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 });
  }
}

