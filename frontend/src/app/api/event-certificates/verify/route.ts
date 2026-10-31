import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const { certId, email } = await req.json();
    if (!certId || !email) {
      return NextResponse.json({ success: false, message: 'Missing certId or email.' }, { status: 400 });
    }

    const db = await getDatabase();
    const doc = await db.collection('event_certificates').findOne({ _id: new ObjectId(certId) });
    if (!doc) {
      return NextResponse.json({ success: false, message: 'Event not found.' }, { status: 404 });
    }

    const normalised = email.trim().toLowerCase();

    // Check prizes first (higher precedence)
    const prize = (doc.prizes as Array<{ prizeLabel: string; email: string; templateIndex: number }> | undefined)
      ?.find(p => p.email.trim().toLowerCase() === normalised);

    if (prize) {
      return NextResponse.json({
        success: true,
        found: true,
        tier: prize.prizeLabel,
        templateIndex: prize.templateIndex,
        eventName: doc.programName,
        message: `Congratulations! You participated in ${doc.programName} and received the ${prize.prizeLabel}.`,
      });
    }

    // Check participants
    const isParticipant = (doc.participants as string[] | undefined)
      ?.some(e => e.trim().toLowerCase() === normalised);

    if (isParticipant) {
      return NextResponse.json({
        success: true,
        found: true,
        tier: 'Participant',
        templateIndex: 0,
        eventName: doc.programName,
        message: `Congratulations! You participated in ${doc.programName} and received a Participation Certificate.`,
      });
    }

    return NextResponse.json({
      success: true,
      found: false,
      message: 'This email is not registered for this event.',
    });
  } catch (e) {
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 });
  }
}

