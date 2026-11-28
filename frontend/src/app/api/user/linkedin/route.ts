import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { getAuthUser } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';


export async function POST(req: Request) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });

    const { url } = await req.json();
    if (!url?.trim()) return NextResponse.json({ success: false, message: 'Please enter a LinkedIn URL.' }, { status: 400 });

    // Accept LinkedIn posts (/posts/), articles (/pulse/), and short links (lnkd.in/p/)
    const isLinkedinPost    = url.includes('linkedin.com/posts/');
    const isLinkedinArticle = url.includes('linkedin.com/pulse/');
    const isLinkedinShort   = /https?:\/\/(?:www\.)?lnkd\.in\/p\/[A-Za-z0-9_-]+\/?/.test(url);
    if (!isLinkedinPost && !isLinkedinArticle && !isLinkedinShort) {
      return NextResponse.json({
        success: false,
        message: 'Please enter a valid LinkedIn URL — post (linkedin.com/posts/…), article (linkedin.com/pulse/…), or short link (lnkd.in/p/…).',
      }, { status: 400 });
    }

    const db = await getDatabase();

    // Fetch user for name/email
    const user = await db.collection('users').findOne({ _id: new ObjectId(auth.userId) });
    if (!user) return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });

    const now    = new Date();
    const nowIST  = now.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });

    // Upsert into linkedin_verify collection (one entry per user)
    await db.collection('linkedin_verify').updateOne(
      { userId: auth.userId },
      {
        $set: {
          userId:       auth.userId,
          name:         user.name as string,
          email:        user.email as string,
          linkedinUrl:  url.trim(),
          status:       'pending',
          updatedAt:    now,
          updatedAtIST: nowIST,
        },
        $setOnInsert: { createdAt: now, createdAtIST: nowIST },
      },
      { upsert: true }
    );

    // Update user record
    await db.collection('users').updateOne(
      { _id: new ObjectId(auth.userId) },
      {
        $set: {
          linkedinPostUrl:  url.trim(),
          linkedinVerified: 'pending',
          updatedAt:        now,
          updatedAtIST:     nowIST,
        },
      }
    );

    // Send email notification to admins — awaited so Cloudflare Workers does not kill it
    const istTime = nowIST;
    let mailSent = false;
    let mailError: string | undefined;

    console.log('[LinkedIn] Sending admin notification email... RESEND_API_KEY set?', !!process.env.RESEND_API_KEY);

    try {
      await sendMail({
        to: 'skillinfofficial@gmail.com',
      subject: `🔔 New LinkedIn Verification Request — ${user.name as string}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:0;background:#ffffff;">

          <!-- Header -->
          <div style="background:#1565c0;padding:28px 32px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:0.3px;">
              🔔 New LinkedIn Verification Request
            </h1>
          </div>

          <!-- Body table -->
          <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;padding:0 0 24px;">
            <table style="width:100%;border-collapse:collapse;font-size:15px;">
              <tr>
                <td style="padding:14px 24px;width:140px;color:#374151;font-weight:600;border-bottom:1px solid #f3f4f6;">
                  👤 Name
                </td>
                <td style="padding:14px 24px;color:#111827;border-bottom:1px solid #f3f4f6;">
                  ${user.name as string}
                </td>
              </tr>
              <tr style="background:#f9fafb;">
                <td style="padding:14px 24px;color:#374151;font-weight:600;border-bottom:1px solid #f3f4f6;">
                  📧 Email
                </td>
                <td style="padding:14px 24px;border-bottom:1px solid #f3f4f6;">
                  <a href="mailto:${user.email as string}" style="color:#1565c0;text-decoration:none;">
                    ${user.email as string}
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 24px;color:#374151;font-weight:600;border-bottom:1px solid #f3f4f6;">
                  🔗 LinkedIn URL
                </td>
                <td style="padding:14px 24px;border-bottom:1px solid #f3f4f6;">
                  <a href="${url.trim()}" style="color:#1565c0;word-break:break-all;text-decoration:none;">
                    ${url.trim()}
                  </a>
                </td>
              </tr>
              <tr style="background:#f9fafb;">
                <td style="padding:14px 24px;color:#374151;font-weight:600;">
                  🕐 Time
                </td>
                <td style="padding:14px 24px;color:#111827;">
                  ${istTime} IST
                </td>
              </tr>
            </table>

            <!-- Note -->
            <div style="margin:24px 24px 0;padding:14px 18px;background:#e3f2fd;border-left:4px solid #1565c0;border-radius:6px;font-size:14px;color:#1e3a5f;line-height:1.6;">
              Please review and approve/reject this request in the <strong>admin panel</strong>.
            </div>

            <!-- CTA button -->
            <div style="text-align:center;margin-top:24px;">
              <a href="https://www.skillinf.in/admin-panel"
                 style="display:inline-block;background:#1565c0;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;letter-spacing:0.3px;">
                Verify in Admin Panel →
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding:16px 32px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              Skillinf — Automated Notification System
            </p>
          </div>

        </div>
      `,
      type: 'linkedin_verification_request',
      });
      mailSent = true;
      console.log('[LinkedIn] Admin notification email sent successfully.');
    } catch (mailErr) {
      // Log but do NOT fail the user's submission — email is non-critical
      mailError = (mailErr as Error)?.message ?? String(mailErr);
      console.error('[LinkedIn Notify Email] FAILED:', mailError);
    }

    return NextResponse.json({
      success: true,
      mailSent,
      ...(mailError ? { mailError } : {}),
      message: 'Submitted! Your post is under admin review. Verification done within 3–4 hours.',
    });
  } catch (e) {
    console.error('[POST /api/user/linkedin]', e);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
