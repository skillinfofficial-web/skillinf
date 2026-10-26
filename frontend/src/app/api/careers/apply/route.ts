import { NextRequest, NextResponse } from 'next/server';
import { sendMail } from '@/lib/mailer';

function buildApplyEmail(data: {
  jobTitle: string; name: string; email: string; phone: string;
  experience: string; currentRole: string; portfolio: string;
  resumeLink: string; coverLetter: string;
}): string {
  const row = (label: string, value: string) => value?.trim()
    ? `<tr><td style="padding:8px 0;font-size:0.82rem;color:#64748b;font-weight:600;width:160px;vertical-align:top;">${label}</td><td style="padding:8px 0;font-size:0.875rem;color:#0f172a;">${value.replace(/\n/g, '<br/>')}</td></tr>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Inter,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1a3c34 0%,#2d6a4f 100%);padding:32px 40px;">
          <p style="color:rgba(255,255,255,0.6);font-size:0.75rem;font-weight:700;letter-spacing:0.12em;margin:0 0 6px;">NEW JOB APPLICATION</p>
          <h1 style="color:#fff;font-size:1.4rem;font-weight:800;margin:0 0 6px;">📋 ${data.jobTitle}</h1>
          <p style="color:rgba(255,255,255,0.7);font-size:0.85rem;margin:0;">Application received via Skillinf.in/careers</p>
        </td></tr>

        <!-- Applicant Details -->
        <tr><td style="padding:32px 40px;">
          <p style="font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;margin:0 0 16px;">APPLICANT DETAILS</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f1f5f9;">
            ${row('Full Name',       data.name)}
            ${row('Email',          data.email)}
            ${row('Phone',          data.phone)}
            ${row('Experience',     data.experience)}
            ${row('Current Role',   data.currentRole)}
            ${row('Portfolio / GitHub', data.portfolio)}
            ${row('Resume Link',    data.resumeLink)}
          </table>
        </td></tr>

        ${data.coverLetter?.trim() ? `
        <!-- Cover Letter -->
        <tr><td style="padding:0 40px 32px;">
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;">
            <p style="font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;margin:0 0 12px;">COVER LETTER</p>
            <p style="font-size:0.875rem;color:#334155;line-height:1.75;margin:0;">${data.coverLetter.replace(/\n/g, '<br/>')}</p>
          </div>
        </td></tr>` : ''}

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="font-size:0.75rem;color:#94a3b8;margin:0;">
            Skillinf &nbsp;·&nbsp; <a href="https://Skillinf.in" style="color:#2d6a4f;text-decoration:none;">Skillinf.in</a>
            &nbsp;·&nbsp; Reply directly to this email to respond to the applicant.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// POST /api/careers/apply
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobTitle, jobId, name, email, phone, experience, currentRole, portfolio, resumeLink, coverLetter } = body;

    if (!name?.trim() || !email?.trim() || !jobTitle?.trim()) {
      return NextResponse.json({ success: false, message: 'Name, email and job title are required.' }, { status: 400 });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: 'Please enter a valid email address.' }, { status: 400 });
    }

    await sendMail({
      to:      'careers@skillinf.in',
      subject: `Job Application at Skillinf | ${jobTitle}`,
      html:    buildApplyEmail({ jobTitle, name, email, phone, experience, currentRole, portfolio, resumeLink, coverLetter }),
      type:    'job_application',
    });

    console.log(`[careers/apply] Application from ${name} <${email}> for "${jobTitle}" (${jobId})`);

    return NextResponse.json({ success: true, message: 'Application submitted! We will get back to you soon.' });
  } catch (err) {
    console.error('[POST /api/careers/apply]', err);
    return NextResponse.json({ success: false, message: 'Failed to send application. Please try again.' }, { status: 500 });
  }
}
