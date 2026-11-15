import { NextRequest, NextResponse } from 'next/server';
import { sendMail } from '@/lib/mailer';

// POST /api/referrals/send-coupon-mail
// Body: { email: string; name: string; code: string; discountPercent: number }
export async function POST(req: NextRequest) {
  try {
    const { email, name, code, discountPercent } = await req.json() as {
      email: string;
      name: string;
      code: string;
      discountPercent: number;
    };

    if (!email || !name || !code || !discountPercent) {
      return NextResponse.json({ success: false, message: 'email, name, code and discountPercent are required.' }, { status: 400 });
    }

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Inter,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%);padding:36px 40px;text-align:center;">
          <p style="color:#ede9fe;font-size:0.78rem;font-weight:700;letter-spacing:0.1em;margin:0 0 10px;">SKILLINF — EXCLUSIVE OFFER</p>
          <h1 style="color:#fff;font-size:1.6rem;font-weight:800;margin:0;">Your Referral Reward is Here!</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <p style="font-size:1rem;color:#0f172a;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
          <p style="font-size:0.95rem;color:#334155;line-height:1.75;margin:0 0 24px;">
            Thank you for spreading the word about Skillinf! As a token of our appreciation
            for your referrals, we have generated an <strong>exclusive ${discountPercent}% discount coupon</strong>
            just for you. Use it to unlock your internship certificate at a special price.
          </p>

          <!-- Coupon card -->
          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;width:100%;">
            <tr>
              <td style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border:2px dashed #7c3aed;border-radius:16px;padding:24px 32px;text-align:center;">
                <p style="margin:0 0 6px;font-size:0.78rem;font-weight:700;color:#7c3aed;letter-spacing:0.12em;text-transform:uppercase;">Your Exclusive Coupon Code</p>
                <p style="margin:0 0 8px;font-size:2rem;font-weight:900;color:#4f46e5;letter-spacing:0.2em;font-family:monospace;">${code}</p>
                <p style="margin:0;font-size:0.88rem;font-weight:700;color:#6d28d9;">${discountPercent}% OFF — One-Time Use</p>
              </td>
            </tr>
          </table>

          <!-- Urgency -->
          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;width:100%;">
            <tr>
              <td style="background:#fef2f2;border:1.5px solid #fca5a5;border-radius:12px;padding:14px 20px;">
                <p style="margin:0;font-size:0.88rem;font-weight:700;color:#b91c1c;">
                  Hurry up! This is a one-time-use code — once redeemed it cannot be used again.
                </p>
              </td>
            </tr>
          </table>

          <p style="font-size:0.9rem;color:#475569;line-height:1.65;margin:0 0 28px;">
            Log in to your Skillinf dashboard, go to <strong>Get Your Certificate</strong>, enter the
            coupon code at checkout and claim your verified digital certificate at <strong>${discountPercent}% off</strong>.
          </p>

          <div style="text-align:center;margin-bottom:28px;">
            <a href="https://www.skillinf.in/dashboard"
              style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);
                     color:#fff;text-decoration:none;padding:16px 40px;
                     border-radius:14px;font-size:1rem;font-weight:800;letter-spacing:0.02em;">
              Claim My Certificate Now
            </a>
          </div>

          <p style="font-size:0.88rem;color:#64748b;line-height:1.65;margin:0;text-align:center;font-weight:700;letter-spacing:0.04em;">
            Learn &nbsp;&bull;&nbsp; Grow &nbsp;&bull;&nbsp; Build
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="font-size:0.75rem;color:#94a3b8;margin:0;">
            Skillinf &nbsp;&middot;&nbsp;
            <a href="https://www.skillinf.in" style="color:#7c3aed;text-decoration:none;">skillinf.in</a>
            &nbsp;&middot;&nbsp; You received this because you referred friends to Skillinf.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await sendMail({
      to: email,
      subject: `Your ${discountPercent}% Off Coupon Code — Claim Your Skillinf Certificate!`,
      html,
      type: 'referral_coupon',
    });

    return NextResponse.json({ success: true, message: 'Coupon email sent successfully.' });
  } catch (e) {
    console.error('[POST /api/referrals/send-coupon-mail]', e);
    return NextResponse.json({ success: false, message: 'Failed to send email. Check server logs.' }, { status: 500 });
  }
}

