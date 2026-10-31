import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * POST /api/event-certificates/download-track
 * Body: { certId: string; email: string }
 *
 * First call for a given (certId, email) pair → records it and returns { success: true, allowed: true }.
 * Subsequent calls with the same pair → returns { success: true, allowed: false }.
 */
export async function POST(req: NextRequest) {
  try {
    const { certId, email } = await req.json();
    if (!certId || !email) {
      return NextResponse.json({ success: false, message: 'Missing certId or email.' }, { status: 400 });
    }

    // Validate certId is a valid ObjectId
    if (!ObjectId.isValid(certId)) {
      return NextResponse.json({ success: false, message: 'Invalid certId.' }, { status: 400 });
    }

    const normalised = email.trim().toLowerCase();
    const db = await getDatabase();

    const existing = await db.collection('certificate_downloads').findOne({
      certId: certId.toString(),
      email:  normalised,
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        allowed: false,
        message:  'A certificate for this email address has already been downloaded. Each email may download the certificate only once.',
      });
    }

    // Record the download
    await db.collection('certificate_downloads').insertOne({
      certId:      certId.toString(),
      email:       normalised,
      downloadedAt: new Date(),
    });

    return NextResponse.json({ success: true, allowed: true });
  } catch (e) {
    console.error('[POST /api/event-certificates/download-track]', e);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

