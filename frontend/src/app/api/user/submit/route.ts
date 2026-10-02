import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { istTimestamps } from '@/lib/ist';

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });

    const { step, driveLink } = await req.json();

    if (!step || ![1, 2, 3, 4].includes(Number(step))) {
      return NextResponse.json({ success: false, message: 'Invalid step number.' }, { status: 400 });
    }
    if (!driveLink?.trim()) {
      return NextResponse.json({ success: false, message: 'Please paste your Google Drive / project link.' }, { status: 400 });
    }
    try { new URL(driveLink.trim()); } catch {
      return NextResponse.json({ success: false, message: 'Please enter a valid URL.' }, { status: 400 });
    }

    const stepKey = `step${step}` as 'step1' | 'step2' | 'step3' | 'step4';
    const db      = await getDatabase();
    const user    = await db.collection('users').findOne({ _id: new ObjectId(auth.userId) });
    if (!user) return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });

    // Gate checks
    if (step === 1 && user.linkedinVerified !== true) {
      return NextResponse.json({ success: false, message: 'Complete LinkedIn verification first.' }, { status: 403 });
    }
    if (step > 1) {
      const prevKey = `step${step - 1}` as keyof typeof user.steps;
      if (!user.steps?.[prevKey]) {
        return NextResponse.json({ success: false, message: `Complete Step ${step - 1} first.` }, { status: 403 });
      }
    }
    // Already submitted and pending or done
    if (user.steps?.[stepKey]) {
      return NextResponse.json({ success: false, message: `Step ${step} is already completed.` }, { status: 400 });
    }

    // Save drive link as pending submission (step NOT marked true yet — admin must verify)
    await db.collection('users').updateOne(
      { _id: new ObjectId(auth.userId) },
      {
        $set: {
          [`submissions.${stepKey}`]: driveLink.trim(),
          updatedAt:    new Date(),
          updatedAtIST: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
        },
      }
    );

    // Insert into project_reviews collection for admin review
    await db.collection('project_reviews').updateOne(
      { userId: auth.userId, step: Number(step) },
      {
        $set: {
          userId:       auth.userId,
          name:         user.name as string,
          email:        user.email as string,
          mobileNumber: (user.mobileNumber as string) ?? '',
          domain:       user.domain as string,
          step:         Number(step),
          driveLink:    driveLink.trim(),
          status:       'pending',
          updatedAt:    new Date(),
          updatedAtIST: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: `Step ${step} submitted for review! Admin will verify and unlock your next step.`,
    });
  } catch (e) {
    console.error('[POST /api/user/submit]', e);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
