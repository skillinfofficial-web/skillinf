import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// ── GET /api/project-reviews ──────────────────────────────────
export async function GET() {
  try {
    const db = await getDatabase();
    const reviews = await db
      .collection('project_reviews')
      .find({})
      .sort({ updatedAt: -1 })
      .toArray();
    return NextResponse.json({
      success: true,
      reviews: reviews.map((r) => ({ ...r, _id: r._id.toString() })),
    });
  } catch (err) {
    console.error('[GET /api/project-reviews]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── PATCH /api/project-reviews  (approve / reject) ───────────
export async function PATCH(req: NextRequest) {
  try {
    const { reviewId, action } = await req.json(); // action: 'approve' | 'reject'
    if (!reviewId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, message: 'Invalid request.' }, { status: 400 });
    }

    const db     = await getDatabase();
    const review = await db.collection('project_reviews').findOne({ _id: new ObjectId(reviewId) });
    if (!review) return NextResponse.json({ success: false, message: 'Review not found.' }, { status: 404 });

    if (action === 'approve') {
      const stepKey = `step${review.step}`;

      // Find ALL user docs with this email (multi-domain) and update the matching domain
      const users = await db
        .collection('users')
        .find({ email: review.email as string })
        .toArray();

      // Pick the user record matching the domain stored in the review
      const userDoc = users.find((u) => u.domain === review.domain) ?? users[0];
      if (!userDoc) return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });

      const updatedSteps = {
        ...userDoc.steps,
        [stepKey]: true,
      };
      const allDone =
        updatedSteps.step1 && updatedSteps.step2 && updatedSteps.step3 && updatedSteps.step4;

      await db.collection('users').updateOne(
        { _id: userDoc._id },
        {
          $set: {
            [`steps.${stepKey}`]: true,
            certificateUnlocked: allDone,
            updatedAt: new Date(),
          },
        }
      );

      await db.collection('project_reviews').updateOne(
        { _id: new ObjectId(reviewId) },
        { $set: { status: 'approved', updatedAt: new Date() } }
      );

      return NextResponse.json({ success: true, message: `Step ${review.step} approved — next step unlocked for ${review.name}.` });
    }

    // reject
    await db.collection('project_reviews').updateOne(
      { _id: new ObjectId(reviewId) },
      { $set: { status: 'rejected', updatedAt: new Date() } }
    );
    // Also clear the submission link so user can resubmit
    const users2 = await db.collection('users').find({ email: review.email as string }).toArray();
    const userDoc2 = users2.find((u) => u.domain === review.domain) ?? users2[0];
    if (userDoc2) {
      await db.collection('users').updateOne(
        { _id: userDoc2._id },
        { $set: { [`submissions.step${review.step}`]: null, updatedAt: new Date() } }
      );
    }

    return NextResponse.json({ success: true, message: `Step ${review.step} rejected — user can resubmit.` });
  } catch (err) {
    console.error('[PATCH /api/project-reviews]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
