import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });

    const body = await req.json() as { week: number; passed: boolean; score: number };
    const { week, passed, score } = body;

    if (typeof week !== 'number' || week < 1 || week > 20) {
      return NextResponse.json({ success: false, message: 'Invalid week.' }, { status: 400 });
    }
    if (typeof passed !== 'boolean') {
      return NextResponse.json({ success: false, message: 'Invalid passed value.' }, { status: 400 });
    }

    const db  = await getDatabase();
    const now = new Date();

    // Increment attempts counter atomically, only update passed=true if truly passed
    // (once passed, never downgrade back to false on a later failed retry)
    const weekKey = `week_${week}`;

    // Fetch current doc to know existing state
    const existing = await db.collection('users').findOne(
      { _id: new ObjectId(auth.userId) },
      { projection: { [`quizStatus.${weekKey}.passed`]: 1, [`quizStatus.${weekKey}.attempts`]: 1 } }
    );

    if (!existing) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentWeekData = (existing.quizStatus as any)?.[weekKey];
    const alreadyPassed   = currentWeekData?.passed === true;
    const prevAttempts    = typeof currentWeekData?.attempts === 'number' ? currentWeekData.attempts : 0;

    const updateFields: Record<string, unknown> = {
      [`quizStatus.${weekKey}.score`]:         score,
      [`quizStatus.${weekKey}.attempts`]:      prevAttempts + 1,
      [`quizStatus.${weekKey}.lastAttemptAt`]: now,
      updatedAt:    now,
      updatedAtIST: now.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
      }),
    };

    // Only set passed=true if passed; never set passed=false if they already passed once
    if (passed) {
      updateFields[`quizStatus.${weekKey}.passed`]   = true;
      updateFields[`quizStatus.${weekKey}.passedAt`] = alreadyPassed
        ? currentWeekData.passedAt   // keep original pass timestamp
        : now;
    } else if (!alreadyPassed) {
      // Not yet passed and failed again — record false
      updateFields[`quizStatus.${weekKey}.passed`] = false;
    }
    // If alreadyPassed and they failed a retry → do nothing to passed/passedAt

    await db.collection('users').updateOne(
      { _id: new ObjectId(auth.userId) },
      { $set: updateFields }
    );

    return NextResponse.json({ success: true, alreadyPassed });
  } catch (e) {
    console.error('[POST /api/quiz/result]', e);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
