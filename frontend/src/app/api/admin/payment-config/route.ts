import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

const DEFAULT_CONFIG = { eCertPrice: 149, physicalCertPrice: 300 };

/* GET — fetch current prices */
export async function GET() {
  try {
    const db  = await getDatabase();
    const cfg = await db.collection('payment_config').findOne({ _id: 'prices' as unknown as import('mongodb').ObjectId });
    return NextResponse.json({ success: true, config: cfg ?? DEFAULT_CONFIG });
  } catch (e) {
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 });
  }
}

/* PUT — admin updates prices */
export async function PUT(req: Request) {
  try {
    const { eCertPrice, physicalCertPrice } = await req.json();
    if (typeof eCertPrice !== 'number' || typeof physicalCertPrice !== 'number') {
      return NextResponse.json({ success: false, message: 'Invalid prices.' }, { status: 400 });
    }
    const db = await getDatabase();
    await db.collection('payment_config').updateOne(
      { _id: 'prices' as unknown as import('mongodb').ObjectId },
      { $set: { eCertPrice, physicalCertPrice, updatedAt: new Date() } },
      { upsert: true },
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 });
  }
}
