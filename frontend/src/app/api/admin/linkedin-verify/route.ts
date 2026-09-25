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

    const newVerified = action === 'verify' ? true : false;
    const newStatus   = action === 'verify' ? 'approved' : 'rejected';

    // Update user record
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { linkedinVerified: newVerified, updatedAt: now } }
    );

    // Update linkedin_verify record
    await db.collection('linkedin_verify').updateOne(
      { userId },
      { $set: { status: newStatus, updatedAt: now } }
    );

    // Fetch student details for email notification
    const record = await db.collection('linkedin_verify').findOne({ userId });
    const studentName  = (record?.name  as string | undefined) ?? 'Student';
    const studentEmail = (record?.email as string | undefined) ?? '';

    // Send email to student (fire-and-forget, non-blocking)
    if (studentEmail) {
      if (action === 'verify') {
        void sendMail({
          to: studentEmail,
          subject: '✅ LinkedIn Offer Letter Submission Verified — Skillinf',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
              <div style="background:#0a7c3e;padding:20px 24px;">
                <h2 style="color:#fff;margin:0;font-size:20px;">✅ LinkedIn Verification — Approved</h2>
              </div>
              <div style="padding:28px 24px;background:#fff;">
                <p style="font-size:16px;color:#222;margin:0 0 16px;">Hi <strong>${studentName}</strong>,</p>
                <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 16px;">
                  Great news! Your <strong>LinkedIn offer letter submission has been successfully verified</strong> by the admin.
                </p>
                <div style="background:#e8f9ef;border-left:4px solid #0a7c3e;border-radius:4px;padding:14px 16px;margin:20px 0;font-size:14px;color:#1a5c30;">
                  🎉 <strong>Step 1 is now unlocked.</strong> You can continue your course and keep learning and growing!
                </div>
                <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 20px;">
                  Log in to your dashboard to see your progress and continue your further course journey.
                </p>
                <div style="text-align:center;margin-top:24px;">
                  <a href="https://www.skillinf.in/dashboard"
                     style="display:inline-block;background:#0a7c3e;color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-weight:700;font-size:15px;">
                    Go to Dashboard →
                  </a>
                </div>
              </div>
              <div style="padding:12px 24px;background:#f0f0f0;font-size:12px;color:#888;text-align:center;">
                Skillinf — Learn • Build • Grow &nbsp;|&nbsp; <a href="https://www.skillinf.in" style="color:#0a7c3e;text-decoration:none;">www.skillinf.in</a>
              </div>
            </div>
          `,
        }).catch(err => console.error('[LinkedIn Verify Email - approved]', err));
      } else {
        void sendMail({
          to: studentEmail,
          subject: '❌ LinkedIn Verification Failed — Action Required | Skillinf',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
              <div style="background:#c0392b;padding:20px 24px;">
                <h2 style="color:#fff;margin:0;font-size:20px;">❌ LinkedIn Verification — Failed</h2>
              </div>
              <div style="padding:28px 24px;background:#fff;">
                <p style="font-size:16px;color:#222;margin:0 0 16px;">Hi <strong>${studentName}</strong>,</p>
                <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 16px;">
                  Unfortunately, your <strong>LinkedIn offer letter verification could not be completed</strong> due to some issue with the submission.
                </p>
                <div style="background:#fdf0ee;border-left:4px solid #c0392b;border-radius:4px;padding:14px 16px;margin:20px 0;font-size:14px;color:#7b241c;">
                  ⚠️ Please <strong>log in to your profile</strong>, review the submission, and re-submit the correct LinkedIn post URL.
                </div>
                <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 8px;">
                  Common reasons for failure:
                </p>
                <ul style="font-size:14px;color:#555;line-height:1.8;padding-left:20px;margin:0 0 20px;">
                  <li>The LinkedIn post URL is invalid or inaccessible</li>
                  <li>The post does not contain the required offer letter tag</li>
                  <li>The post is set to private (change to public and re-submit)</li>
                </ul>
                <div style="text-align:center;margin-top:24px;">
                  <a href="https://www.skillinf.in/dashboard"
                     style="display:inline-block;background:#c0392b;color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-weight:700;font-size:15px;">
                    Go to Profile & Re-submit →
                  </a>
                </div>
              </div>
              <div style="padding:12px 24px;background:#f0f0f0;font-size:12px;color:#888;text-align:center;">
                Skillinf — Learn • Build • Grow &nbsp;|&nbsp; <a href="https://www.skillinf.in" style="color:#c0392b;text-decoration:none;">www.skillinf.in</a>
              </div>
            </div>
          `,
        }).catch(err => console.error('[LinkedIn Verify Email - rejected]', err));
      }
    }

    return NextResponse.json({
      success: true,
      message: action === 'verify'
        ? 'LinkedIn verified — Step 1 is now unlocked for this student.'
        : 'LinkedIn rejected — student will need to re-submit.',
    });
  } catch (e) {
    console.error('[PATCH /api/admin/linkedin-verify]', e);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
