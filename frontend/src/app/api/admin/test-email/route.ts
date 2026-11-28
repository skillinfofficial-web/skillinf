import { NextResponse } from 'next/server';
import { sendMail } from '@/lib/mailer';

/**
 * GET /api/admin/test-email
 * Quick diagnostic — sends a test email to both admin addresses.
 * Hit this URL in browser while checking Cloudflare Worker logs to confirm
 * whether Resend is working.
 *
 * REMOVE or PROTECT this route before going to full production.
 */
export async function GET() {
  const apiKeySet = !!process.env.RESEND_API_KEY;
  const apiKeyPrefix = process.env.RESEND_API_KEY?.slice(0, 8) ?? '(not set)';

  console.log('[test-email] RESEND_API_KEY set?', apiKeySet, '| prefix:', apiKeyPrefix);

  if (!apiKeySet) {
    return NextResponse.json({
      success: false,
      error: 'RESEND_API_KEY environment variable is NOT set on this Worker.',
      fix: 'Add RESEND_API_KEY in Cloudflare Dashboard > Workers & Pages > skillinf > Settings > Variables and Secrets, then redeploy.',
    }, { status: 500 });
  }

  try {
    const now = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });

    await sendMail({
      to: ['arunkumar.s202006@gmail.com', 'skillinfofficial@gmail.com'],
      subject: `✅ Skillinf Email Test — ${now} IST`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#f0fdf4;border:2px solid #86efac;border-radius:12px;">
          <h2 style="color:#166534;margin:0 0 16px;">✅ Test Email — Resend is working!</h2>
          <p style="color:#374151;font-size:15px;">
            This is a diagnostic test email sent from <strong>Skillinf</strong> at <strong>${now} IST</strong>.
          </p>
          <p style="color:#374151;font-size:14px;">
            If you received this, your Resend API key is valid and emails are being delivered to Gmail addresses correctly.
          </p>
          <p style="color:#6b7280;font-size:12px;margin-top:24px;">
            Skillinf — Automated Notification System
          </p>
        </div>
      `,
      type: 'test',
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent! Check arunkumar.s202006@gmail.com and skillinfofficial@gmail.com.',
      apiKeyPrefix,
      sentAt: now,
    });
  } catch (err) {
    const message = (err as Error)?.message ?? String(err);
    console.error('[test-email] FAILED:', message);
    return NextResponse.json({
      success: false,
      error: message,
      apiKeyPrefix,
      possibleFixes: [
        '1. RESEND_API_KEY might be wrong or expired — regenerate at resend.com',
        '2. Resend free plan: you can only send to emails on your verified domain OR manually added test addresses',
        '3. skillinf.in domain may not be verified in Resend dashboard',
        '4. Daily quota (100/day) or monthly quota (3000/month) may be exhausted',
        '5. The "from" domain notifications@skillinf.in must be verified in Resend',
      ],
    }, { status: 500 });
  }
}
