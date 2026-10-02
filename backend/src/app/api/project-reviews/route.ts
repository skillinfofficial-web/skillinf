import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { sendMail } from '@/lib/mailer';

const istNow = () => new Date().toLocaleString('en-IN', {
  timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short',
  year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
});

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

// ── Approval email HTML ───────────────────────────────────────
function buildApprovalEmail(name: string, step: number, allDone: boolean): string {
  const nextStep = step + 1;
  const bodyText = allDone
    ? `Congratulations! You have successfully completed <strong>all 4 weeks</strong> of your internship. Your e-certificate is now unlocked — log in to download it.`
    : `Your <strong>Week ${step} project</strong> has been reviewed and verified by your mentor.<br/><br/>
       🔓 <strong>Week ${nextStep} is now unlocked!</strong> Log in to your dashboard to access the next step.`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Inter,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#6366f1 0%,#4338ca 100%);padding:32px 40px;text-align:center;">
          <p style="color:#c7d2fe;font-size:0.78rem;font-weight:700;letter-spacing:0.1em;margin:0 0 8px;">SKILLINF INTERNSHIP</p>
          <h1 style="color:#fff;font-size:1.5rem;font-weight:800;margin:0;">Project Verified ✅</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <p style="font-size:1rem;color:#0f172a;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
          <p style="font-size:0.95rem;color:#334155;line-height:1.7;margin:0 0 24px;">${bodyText}</p>

          ${!allDone ? `
          <!-- Step badge -->
          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr>
              <td style="background:#ede9fe;border:1.5px solid #c4b5fd;border-radius:12px;padding:16px 24px;">
                <p style="margin:0;font-size:0.8rem;color:#7c3aed;font-weight:700;letter-spacing:0.05em;">WEEK ${step} — COMPLETED</p>
                <p style="margin:6px 0 0;font-size:1.1rem;font-weight:800;color:#4c1d95;">Week ${nextStep} Now Available 🚀</p>
              </td>
            </tr>
          </table>` : `
          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr>
              <td style="background:#ecfdf5;border:1.5px solid #6ee7b7;border-radius:12px;padding:16px 24px;">
                <p style="margin:0;font-size:0.8rem;color:#059669;font-weight:700;letter-spacing:0.05em;">ALL 4 WEEKS COMPLETED 🎓</p>
                <p style="margin:6px 0 0;font-size:1.1rem;font-weight:800;color:#065f46;">Your Certificate is Unlocked!</p>
              </td>
            </tr>
          </table>`}

          <a href="https://skillinf.in/dashboard"
            style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4338ca);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:0.95rem;font-weight:700;">
            Go to Dashboard →
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="font-size:0.75rem;color:#94a3b8;margin:0;">
            Skillinf &nbsp;·&nbsp; <a href="https://skillinf.in" style="color:#6366f1;text-decoration:none;">skillinf.in</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
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

      const users = await db
        .collection('users')
        .find({ email: review.email as string })
        .toArray();

      const userDoc = users.find((u) => u.domain === review.domain) ?? users[0];
      if (!userDoc) return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });

      const updatedSteps = { ...userDoc.steps, [stepKey]: true };
      const allDone = updatedSteps.step1 && updatedSteps.step2 && updatedSteps.step3 && updatedSteps.step4;

      await db.collection('users').updateOne(
        { _id: userDoc._id },
        { $set: { [`steps.${stepKey}`]: true, certificateUnlocked: allDone, updatedAt: new Date(), updatedAtIST: istNow() } }
      );

      await db.collection('project_reviews').updateOne(
        { _id: new ObjectId(reviewId) },
        { $set: { status: 'approved', updatedAt: new Date(), updatedAtIST: istNow() } }
      );

      // Send approval email (non-blocking — don't fail the request if email fails)
      const emailSubject = allDone
        ? '🎓 All Steps Complete — Your Certificate is Unlocked! | Skillinf'
        : `✅ Week ${review.step} Project Verified — Week ${review.step + 1} Unlocked! | Skillinf`;
      try {
        await sendMail({
          to: review.email as string,
          subject: emailSubject,
          html: buildApprovalEmail(review.name as string, review.step as number, allDone),
        });
      } catch (mailErr) {
        console.warn('[project-reviews] Email send failed (non-fatal):', mailErr);
      }

      return NextResponse.json({
        success: true,
        message: `Step ${review.step} approved — ${allDone ? 'all steps complete! Certificate unlocked.' : `Week ${review.step + 1} unlocked`} for ${review.name}. Email sent.`,
      });
    }

    // ── REJECT ─────────────────────────────────────────────────
    await db.collection('project_reviews').updateOne(
      { _id: new ObjectId(reviewId) },
      { $set: { status: 'rejected', updatedAt: new Date(), updatedAtIST: istNow() } }
    );

    const users2 = await db.collection('users').find({ email: review.email as string }).toArray();
    const userDoc2 = users2.find((u) => u.domain === review.domain) ?? users2[0];
    if (userDoc2) {
      await db.collection('users').updateOne(
        { _id: userDoc2._id },
        { $set: { [`submissions.step${review.step}`]: null, updatedAt: new Date(), updatedAtIST: istNow() } }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Step ${review.step} rejected — user can resubmit.`,
      // Return mobile so frontend can open WhatsApp
      mobileNumber: (review.mobileNumber as string) ?? '',
      name: review.name as string,
      step: review.step as number,
    });
  } catch (err) {
    console.error('[PATCH /api/project-reviews]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
