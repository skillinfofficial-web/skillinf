import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { sendMail } from '@/lib/mailer';

// GET /api/admin/linkedin-verify — all submissions
export async function GET() {
  try {
    const db      = await getDatabase();
    const records = await db.collection('linkedin_verify').find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({
      success: true,
      records: records.map(r => ({ ...r, _id: r._id.toString() })),
    });
  } catch (e) {
    console.error('[GET /api/admin/linkedin-verify]', e);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// PATCH /api/admin/linkedin-verify — approve or reject
export async function PATCH(req: NextRequest) {
  try {
    const { userId, action } = await req.json() as { userId: string; action: 'verify' | 'unverify' };
    if (!userId || !['verify', 'unverify'].includes(action)) {
      return NextResponse.json({ success: false, message: 'Invalid payload.' }, { status: 400 });
    }

    const db  = await getDatabase();
    const now = new Date();

    const newVerified = action === 'verify';
    const newStatus   = action === 'verify' ? 'approved' : 'rejected';

    // Fetch student record FIRST (before update) so we always have name & email
    const record       = await db.collection('linkedin_verify').findOne({ userId });
    const studentName  = (record?.name  as string | undefined) ?? 'Student';
    const studentEmail = (record?.email as string | undefined) ?? '';

    // Update user and linkedin_verify collections
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { linkedinVerified: newVerified, updatedAt: now } }
    );
    await db.collection('linkedin_verify').updateOne(
      { userId },
      { $set: { status: newStatus, updatedAt: now } }
    );

    // Send email to student — track whether it was actually delivered
    let mailSent = false;
    if (studentEmail) {
      try {
        if (action === 'verify') {
          await sendMail({
            to: studentEmail,
            subject: 'LinkedIn Verification Update — Skillinf',
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:0;background:#ffffff;">
                <div style="background:#0a7c3e;padding:28px 32px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">
                    LinkedIn Verification Successful
                  </h1>
                </div>
                <div style="padding:32px 32px 24px;background:#ffffff;border:1px solid #e5e7eb;border-top:none;">
                  <p style="font-size:16px;color:#111827;margin:0 0 16px;">
                    Hi <strong>${studentName}</strong>,
                  </p>
                  <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
                    Your <strong>LinkedIn verification has been successfully completed</strong> by the admin.
                    You can now continue your course from <strong>Skillinf</strong>.
                  </p>
                  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin:24px 0;">
                    <p style="margin:0;font-size:14px;color:#15803d;font-weight:600;">
                      Step 1 is now unlocked! Log in to your dashboard to continue your course.
                    </p>
                  </div>
                  <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 28px;">
                    Keep learning, keep building, and keep growing with Skillinf!
                  </p>
                  <div style="text-align:center;margin-bottom:8px;">
                    <a href="https://www.skillinf.in/dashboard"
                       style="display:inline-block;background:#0a7c3e;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;">
                      Go to My Dashboard
                    </a>
                  </div>
                </div>
                <div style="padding:16px 32px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;">
                    Need help? Contact us at <a href="mailto:support@skillinf.in" style="color:#0a7c3e;text-decoration:none;">support@skillinf.in</a>
                  </p>
                  <p style="margin:6px 0 0;font-size:12px;color:#9ca3af;">Skillinf — Learn &bull; Build &bull; Grow</p>
                </div>
              </div>
            `,
          });
          mailSent = true;
          console.log('[LinkedIn Verify] Approved email sent to:', studentEmail);
        } else {
          await sendMail({
            to: studentEmail,
            subject: 'LinkedIn Verification Update — Action Required | Skillinf',
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:0;background:#ffffff;">
                <div style="background:#dc2626;padding:28px 32px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">
                    LinkedIn Verification Failed
                  </h1>
                </div>
                <div style="padding:32px 32px 24px;background:#ffffff;border:1px solid #e5e7eb;border-top:none;">
                  <p style="font-size:16px;color:#111827;margin:0 0 16px;">
                    Hi <strong>${studentName}</strong>,
                  </p>
                  <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
                    Your <strong>LinkedIn verification has failed</strong> due to some error in your submission.
                  </p>
                  <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px 20px;margin:24px 0;">
                    <p style="margin:0 0 8px;font-size:14px;color:#b91c1c;font-weight:600;">What to do next:</p>
                    <ul style="margin:0;padding-left:18px;font-size:14px;color:#7f1d1d;line-height:1.8;">
                      <li>Log in to your Skillinf profile</li>
                      <li>Check your LinkedIn article or post URL</li>
                      <li>Make sure the post is set to <strong>Public</strong></li>
                      <li>Re-submit the correct LinkedIn URL from your dashboard</li>
                    </ul>
                  </div>
                  <p style="font-size:15px;color:#374151;margin:0 0 28px;">
                    If you need any help, please reach out to our <strong>Skillinf customer support</strong> team at
                    <a href="mailto:support@skillinf.in" style="color:#dc2626;text-decoration:none;font-weight:600;">support@skillinf.in</a>
                  </p>
                  <div style="text-align:center;margin-bottom:8px;">
                    <a href="https://www.skillinf.in/dashboard"
                       style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;">
                      Go to My Dashboard &amp; Re-submit
                    </a>
                  </div>
                </div>
                <div style="padding:16px 32px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;">
                    Need help? Contact us at <a href="mailto:support@skillinf.in" style="color:#dc2626;text-decoration:none;">support@skillinf.in</a>
                  </p>
                  <p style="margin:6px 0 0;font-size:12px;color:#9ca3af;">Skillinf — Learn &bull; Build &bull; Grow</p>
                </div>
              </div>
            `,
          });
          mailSent = true;
          console.log('[LinkedIn Verify] Rejected email sent to:', studentEmail);
        }
      } catch (mailErr) {
        mailSent = false;
        console.error('[LinkedIn Verify] Email send FAILED for', studentEmail, ':', mailErr);
      }
    } else {
      console.warn('[LinkedIn Verify] No email found for userId:', userId, '— skipping email notification.');
    }

    const baseMsg = action === 'verify'
      ? 'LinkedIn verified — Step 1 is now unlocked for this student.'
      : 'LinkedIn rejected — student will need to re-submit.';
    const mailNote = studentEmail
      ? (mailSent ? ' Mail sent to student.' : ' Mail could not be sent — check server logs.')
      : ' No email on record — mail not sent.';

    return NextResponse.json({
      success: true,
      message: baseMsg + mailNote,
    });
  } catch (e) {
    console.error('[PATCH /api/admin/linkedin-verify]', e);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
