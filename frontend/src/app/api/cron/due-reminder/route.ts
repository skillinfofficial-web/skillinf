import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { sendMail } from '@/lib/mailer';

/* ─────────────────────────────────────────────────────────────────
   GET /api/cron/due-reminder
   Scheduled daily via vercel.json (runs at 08:00 IST = 02:30 UTC).
   Sends reminder emails to students whose next unsubmitted step is
   due TOMORROW in IST.
───────────────────────────────────────────────────────────────── */

const CRON_SECRET = process.env.CRON_SECRET ?? '';
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +05:30

/** Return a Date representing midnight IST for a given UTC Date */
function toISTMidnight(d: Date): Date {
  const istMs = d.getTime() + IST_OFFSET_MS;
  const istDate = new Date(istMs);
  // Zero out time portion while keeping calendar day
  return new Date(
    Date.UTC(istDate.getUTCFullYear(), istDate.getUTCMonth(), istDate.getUTCDate())
  );
}

function addCalendarDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function fmtIST(d: Date): string {
  return new Date(d.getTime() + IST_OFFSET_MS).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function buildReminderEmail(
  name: string,
  step: number,
  dueDate: Date,
  domain: string
): string {
  const dueFmt = fmtIST(dueDate);
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Inter,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:32px 40px;text-align:center;">
          <p style="color:#fef3c7;font-size:0.78rem;font-weight:700;letter-spacing:0.1em;margin:0 0 8px;">SKILLINF INTERNSHIP</p>
          <h1 style="color:#fff;font-size:1.5rem;font-weight:800;margin:0;">⏰ Deadline Reminder</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <p style="font-size:1rem;color:#0f172a;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
          <p style="font-size:0.95rem;color:#334155;line-height:1.7;margin:0 0 24px;">
            This is a friendly reminder that your <strong>Week ${step} project submission</strong>
            for your <strong>${domain}</strong> internship is due <strong>tomorrow (${dueFmt})</strong>.
          </p>

          <!-- Due date card -->
          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;width:100%;">
            <tr>
              <td style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px;padding:16px 24px;">
                <p style="margin:0;font-size:0.8rem;color:#b45309;font-weight:700;letter-spacing:0.05em;">
                  WEEK ${step} — DUE TOMORROW (IST)
                </p>
                <p style="margin:6px 0 0;font-size:1.1rem;font-weight:800;color:#92400e;">${dueFmt}</p>
              </td>
            </tr>
          </table>

          <p style="font-size:0.9rem;color:#475569;line-height:1.65;margin:0 0 28px;">
            Please log in to your dashboard, upload your project link
            (Google Drive / GitHub) and click <strong>"Submit for Review"</strong>
            before midnight IST to avoid missing your step verification.
          </p>

          <a href="https://skillinf.in/dashboard"
            style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);
                   color:#fff;text-decoration:none;padding:14px 32px;
                   border-radius:12px;font-size:0.95rem;font-weight:700;">
            Submit My Project →
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="font-size:0.75rem;color:#94a3b8;margin:0;">
            Skillinf &nbsp;·&nbsp;
            <a href="https://skillinf.in" style="color:#f59e0b;text-decoration:none;">skillinf.in</a>
            &nbsp;·&nbsp; You received this because you are enrolled in a Skillinf internship.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function GET(req: NextRequest) {
  // Verify cron secret — Vercel sends it as Authorization: Bearer <secret>
  const authHeader = req.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const db = await getDatabase();

    // "Today" and "tomorrow" in IST (midnight-aligned)
    const nowIST      = toISTMidnight(new Date());
    const tomorrowIST = addCalendarDays(nowIST, 1); // the day we're warning about
    const dayAfterIST = addCalendarDays(nowIST, 2); // upper bound (exclusive)

    // All LinkedIn-verified users with at least one incomplete step
    const users = await db.collection('users').find({
      linkedinVerified: true,
      $or: [
        { 'steps.step1': { $ne: true } },
        { 'steps.step2': { $ne: true } },
        { 'steps.step3': { $ne: true } },
        { 'steps.step4': { $ne: true } },
      ],
    }).toArray();

    // Course data indexed by domain name
    const courses = await db.collection('CompanyInternships').find({}).toArray();
    const courseMap = new Map(
      courses.map(c => [c.name as string, c.weeks as { week: number; deadlineDays: number }[]])
    );

    let emailsSent = 0;
    const results: string[] = [];

    for (const user of users) {
      const email  = user.email  as string;
      const name   = user.name   as string;
      const domain = user.domain as string;
      const weeks  = courseMap.get(domain);
      if (!weeks || weeks.length < 4) continue;

      // Registered-at in IST midnight
      const rawReg     = user.registeredAt ?? user.createdAt ?? new Date();
      const registeredIST = toISTMidnight(new Date(rawReg as string));

      // Cumulative due dates (IST midnight of each step's deadline)
      let cumulativeDays = 0;
      const dueDates: Date[] = weeks.map(w => {
        cumulativeDays += w.deadlineDays;
        return addCalendarDays(registeredIST, cumulativeDays);
      });

      for (let i = 0; i < 4; i++) {
        const stepNum    = i + 1;
        const stepKey    = `step${stepNum}`;
        const reminderKey = `duedateReminderStep${stepNum}`;

        // Skip if step already completed or project already submitted
        if (user.steps?.[stepKey])            continue;
        if (user.submissions?.[stepKey])       continue;

        // Skip if reminder already sent for this step
        if (user[reminderKey])                 continue;

        const dueIST = dueDates[i];

        // Is this step due TOMORROW in IST?
        if (dueIST >= tomorrowIST && dueIST < dayAfterIST) {
          try {
            await sendMail({
              to: email,
              subject: `⏰ Reminder: Your Week ${stepNum} Project is Due Tomorrow! | Skillinf`,
              html: buildReminderEmail(name, stepNum, dueIST, domain),
            });

            // Flag so we never send again for this step
            await db.collection('users').updateOne(
              { _id: user._id },
              { $set: { [reminderKey]: true, updatedAt: new Date() } }
            );

            emailsSent++;
            results.push(`✅ ${email} — Step ${stepNum} due ${fmtIST(dueIST)}`);
          } catch (err) {
            results.push(`❌ ${email} — Step ${stepNum}: ${(err as Error).message}`);
          }

          // Remind for the FIRST pending step only — avoid spamming
          break;
        }
      }
    }

    console.log(`[due-reminder cron] IST today: ${fmtIST(nowIST)} | emails sent: ${emailsSent}`);
    return NextResponse.json({
      success: true,
      istToday:    fmtIST(nowIST),
      istTomorrow: fmtIST(tomorrowIST),
      emailsSent,
      details: results,
    });
  } catch (err) {
    console.error('[GET /api/cron/due-reminder]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
