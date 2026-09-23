import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: MailOptions) {
  return transporter.sendMail({
    from: `"Skillinf Notifications" <${process.env.GMAIL_USER}>`,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
  });
}
