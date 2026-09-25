import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify SMTP connection on first import — logs any auth errors immediately
transporter.verify((error) => {
  if (error) {
    console.error('[Mailer] SMTP connection FAILED:', error.message);
  } else {
    console.log('[Mailer] SMTP ready — sending from:', process.env.GMAIL_USER);
  }
});

export interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: MailOptions) {
  try {
    const result = await transporter.sendMail({
      from: `"Skillinf Notifications" <${process.env.GMAIL_USER}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
    });
    console.log('[Mailer] Email sent:', result.messageId, '→', to);
    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Mailer] Send FAILED — to:', to, '| error:', msg);
    throw err;
  }
}
