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

    // Accept LinkedIn posts (/posts/) and articles (/pulse/)
    const isLinkedinPost    = url.includes('linkedin.com/posts/');
    const isLinkedinArticle = url.includes('linkedin.com/pulse/');
    if (!isLinkedinPost && !isLinkedinArticle) {
      return NextResponse.json({
        success: false,
        message: 'Please enter a valid LinkedIn post URL (linkedin.com/posts/…) or article URL (linkedin.com/pulse/…).',
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

    // Send email notification to admins (fire-and-forget, non-blocking)
    const istTime = nowIST;

    void sendMail({
      to: ['arunkumar.s202006@gmail.com', 'skillinfofficial@gmail.com'],
      subject: `🔔 New LinkedIn Verification Request — ${user.name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
          <div style="background:#0077b5;padding:20px 24px;">
            <h2 style="color:#fff;margin:0;font-size:20px;">🔔 New LinkedIn Verification Request</h2>
          </div>
          <div style="padding:24px;background:#fff;">
            <table style="width:100%;border-collapse:collapse;font-size:15px;">
              <tr>
                <td style="padding:10px 0;color:#555;width:120px;">👤 <strong>Name</strong></td>
                <td style="padding:10px 0;color:#222;">${user.name}</td>
              </tr>
              <tr style="background:#f5f5f5;">
                <td style="padding:10px 8px;color:#555;">📧 <strong>Email</strong></td>
                <td style="padding:10px 8px;color:#222;">${user.email}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#555;">🔗 <strong>LinkedIn URL</strong></td>
                <td style="padding:10px 0;"><a href="${url.trim()}" style="color:#0077b5;word-break:break-all;">${url.trim()}</a></td>
              </tr>
              <tr style="background:#f5f5f5;">
                <td style="padding:10px 8px;color:#555;">🕐 <strong>Time</strong></td>
                <td style="padding:10px 8px;color:#222;">${istTime} IST</td>
              </tr>
            </table>
            <div style="margin-top:24px;padding:12px 16px;background:#e8f4fd;border-left:4px solid #0077b5;border-radius:4px;font-size:14px;color:#333;">
              Please review and approve/reject this request in the <strong>admin panel</strong>.
            </div>
            <div style="margin-top:16px;text-align:center;">
              <a href="https://skillinf-backend.onrender.com/admin/linkedin-verify"
                 style="display:inline-block;background:#0077b5;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;">
                Verify in Admin Panel →
              </a>
            </div>
          </div>
          <div style="padding:12px 24px;background:#f0f0f0;font-size:12px;color:#888;text-align:center;">
            Skillinf — Automated Notification System
          </div>
        </div>
      `,
    }).catch(err => console.error('[LinkedIn Notify Email]', err));

    return NextResponse.json({
      success: true,
      message: 'Submitted! Your post is under admin review. Verification done within 3–4 hours.',
    });
  } catch (e) {
    console.error('[POST /api/user/linkedin]', e);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
