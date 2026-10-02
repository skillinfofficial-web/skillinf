import { Resend } from 'resend';
import { getDatabase } from '@/lib/mongodb';

const resend = new Resend(process.env.RESEND_API_KEY);

// Resend free plan: 3,000 emails/month, 100/day
// Update this if you upgrade your Resend plan
const RESEND_DAILY_QUOTA  = 100;
const RESEND_MONTHLY_QUOTA = 3000;

export interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
  type?: string; // e.g. 'approval', 'rejection_reminder', 'due_reminder', 'welcome', etc.
}

export async function sendMail({ to, subject, html, type = 'general' }: MailOptions) {
  const { data, error } = await resend.emails.send({
    from: 'Skillinf Notifications <notifications@skillinf.in>',
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });

  if (error) {
    console.error('[Mailer] Send FAILED — to:', to, '| error:', error.message);
    throw new Error(error.message);
  }

  console.log('[Mailer] Email sent:', data?.id, '→', to);

  // ── Log to MongoDB (fire-and-forget, never throws) ──────────────────────
  const nowIST = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
  const now = new Date();
  // IST date string for grouping: "2026-10-02"
  const istDateStr = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  // IST month string for grouping: "2026-10"
  const istMonthStr = istDateStr.slice(0, 7);

  try {
    const db = await getDatabase();
    await db.collection('email_logs').insertOne({
      resendId:   data?.id ?? null,
      to:         Array.isArray(to) ? to : [to],
      subject,
      type,
      sentAt:     now,
      sentAtIST:  nowIST,
      istDate:    istDateStr,   // "2026-10-02" for daily grouping
      istMonth:   istMonthStr,  // "2026-10"   for monthly grouping
    });
  } catch (logErr) {
    console.warn('[Mailer] Failed to log email to DB (non-fatal):', logErr);
  }

  return data;
}

// ── Email quota helpers ───────────────────────────────────────────────────────

export async function getEmailStats() {
  try {
    const db = await getDatabase();
    const now = new Date();
    const istDateStr  = new Date(now.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const istMonthStr = istDateStr.slice(0, 7);

    const [totalAll, totalToday, totalMonth, byType] = await Promise.all([
      db.collection('email_logs').countDocuments({}),
      db.collection('email_logs').countDocuments({ istDate: istDateStr }),
      db.collection('email_logs').countDocuments({ istMonth: istMonthStr }),
      db.collection('email_logs').aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray(),
    ]);

    return {
      totalAll,
      totalToday,
      totalMonth,
      byType: byType.map(b => ({ type: b._id as string, count: b.count as number })),
      quota: {
        daily:   { used: totalToday,  limit: RESEND_DAILY_QUOTA,   remaining: Math.max(0, RESEND_DAILY_QUOTA  - totalToday) },
        monthly: { used: totalMonth,  limit: RESEND_MONTHLY_QUOTA, remaining: Math.max(0, RESEND_MONTHLY_QUOTA - totalMonth) },
      },
      istDate:  istDateStr,
      istMonth: istMonthStr,
    };
  } catch (err) {
    console.error('[getEmailStats]', err);
    return null;
  }
}
