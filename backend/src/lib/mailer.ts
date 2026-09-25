import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: MailOptions) {
  const { data, error } = await resend.emails.send({
    from: 'Skillinf <onboarding@resend.dev>',  // TODO: switch to notifications@skillinf.in after verifying domain on resend.com/domains
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });

  if (error) {
    console.error('[Mailer] Send FAILED — to:', to, '| error:', error.message);
    throw new Error(error.message);
  }

  console.log('[Mailer] Email sent:', data?.id, '→', to);
  return data;
}
