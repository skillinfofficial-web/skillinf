import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });

    const { step, driveLink } = await req.json();

    if (!step || ![1, 2, 3, 4].includes(Number(step))) {
      return NextResponse.json({ success: false, message: 'Invalid step number.' }, { status: 400 });
    }
    if (!driveLink?.trim()) {
      return NextResponse.json({ success: false, message: 'Please paste your Google Drive link.' }, { status: 400 });
    }
    // Basic URL check
    try { new URL(driveLink.trim()); } catch {
      return NextResponse.json({ success: false, message: 'Please enter a valid URL.' }, { status: 400 });
    }

    const stepKey  = `step${step}` as 'step1' | 'step2' | 'step3' | 'step4';
    const db       = await getDatabase();
    const user     = await db.collection('users').findOne({ _id: new ObjectId(auth.userId) });
    if (!user) return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });

    // Ensure previous step is done (step 1 requires linkedinVerified === true)
    if (step === 1 && user.linkedinVerified !== true) {
      return NextResponse.json({ success: false, message: 'Complete LinkedIn verification first.' }, { status: 403 });
    }
    if (step > 1) {
      const prevKey = `step${step - 1}` as keyof typeof user.steps;
      if (!user.steps?.[prevKey]) {
        return NextResponse.json({ success: false, message: `Complete Step ${step - 1} first.` }, { status: 403 });
      }
    }

    // Check if all steps will be complete after this submission
    const updatedSteps    = { ...user.steps, [stepKey]: true };
    const allDone         = updatedSteps.step1 && updatedSteps.step2 && updatedSteps.step3 && updatedSteps.step4;

    await db.collection('users').updateOne(
      { _id: new ObjectId(auth.userId) },
      {
        $set: {
          [`steps.${stepKey}`]:       true,
          [`submissions.${stepKey}`]: driveLink.trim(),
          certificateUnlocked:        allDone,
          updatedAt:                  new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: `Step ${step} submitted successfully!${allDone ? ' 🎉 All steps complete — your certificate is unlocked!' : ''}`,
      certificateUnlocked: allDone,
    });
  } catch (e) {
    console.error('[POST /api/user/submit]', e);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
