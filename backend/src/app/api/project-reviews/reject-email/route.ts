import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { sendMail } from '@/lib/mailer';

const REJECT_SUBJECT = 'Project Submission Rejected — Action Required | Skillinf';

function buildRejectEmail(name: string, step: number, customContent: string): string {
  // Convert plain text line-breaks to <br> for HTML
  const htmlContent = customContent
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Inter,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%);padding:32px 40px;text-align:center;">
          <p style="color:#fecaca;font-size:0.78rem;font-weight:700;letter-spacing:0.1em;margin:0 0 8px;">SKILLINF INTERNSHIP</p>
          <h1 style="color:#fff;font-size:1.5rem;font-weight:800;margin:0;">Project Review — Week ${step} ❌</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <p style="font-size:1rem;color:#0f172a;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
          <p style="font-size:0.95rem;color:#334155;line-height:1.7;margin:0 0 24px;">${htmlContent}</p>

          <!-- Action card -->
          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;width:100%;">
            <tr>
              <td style="background:#fef2f2;border:1.5px solid #fca5a5;border-radius:12px;padding:16px 24px;">
                <p style="margin:0;font-size:0.8rem;color:#dc2626;font-weight:700;letter-spacing:0.05em;">WEEK ${step} — NEEDS RESUBMISSION</p>
                <p style="margin:6px 0 0;font-size:0.9rem;color:#7f1d1d;line-height:1.6;">
                  Please log in to your dashboard, review the feedback above, and resubmit your project with the necessary corrections.
                </p>
              </td>
            </tr>
          </table>

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

// POST /api/project-reviews/reject-email
export async function POST(req: NextRequest) {
  try {
    const { reviewId, content } = await req.json();

    if (!reviewId || !content?.trim()) {
      return NextResponse.json(
        { success: false, message: 'reviewId and content are required.' },
        { status: 400 }
      );
    }

    const db     = await getDatabase();
    const review = await db.collection('project_reviews').findOne({ _id: new ObjectId(reviewId) });
    if (!review) {
      return NextResponse.json({ success: false, message: 'Review not found.' }, { status: 404 });
    }

    await sendMail({
      to:      review.email as string,
      subject: REJECT_SUBJECT,
      html:    buildRejectEmail(review.name as string, review.step as number, content.trim()),
      type:    'project_rejection',
    });

    return NextResponse.json({
      success: true,
      message: `Rejection email sent to ${review.name} (${review.email}).`,
    });
  } catch (err) {
    console.error('[POST /api/project-reviews/reject-email]', err);
    return NextResponse.json({ success: false, message: 'Failed to send email.' }, { status: 500 });
  }
}
