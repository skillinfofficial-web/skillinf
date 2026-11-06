import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { sendMail } from '@/lib/mailer';
import { toISTMidnight, addCalendarDays, fmtISTLong } from '@/lib/ist';


const CRON_SECRET = process.env.CRON_SECRET ?? '';

const istNow = () => new Date().toLocaleString('en-IN', {
  timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short',
  year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
});

function fmtIST(d: Date): string {
  return fmtISTLong(d);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Email: normal reminder — this step is due tomorrow, previous step done
───────────────────────────────────────────────────────────────────────────── */
function buildReminderEmail(
  name: string,
  step: number,
  dueDate: Date,
  domain: string,
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
          <p style="color:#fef3c7;font-size:0.78rem;font-weight:700;letter-spacing:0.1em;margin:0 0 8px;">Skillinf INTERNSHIP</p>
          <h1 style="color:#fff;font-size:1.5rem;font-weight:800;margin:0;">Deadline Reminder</h1>
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

          <a href="https://Skillinf.in/dashboard"
            style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);
                   color:#fff;text-decoration:none;padding:14px 32px;
                   border-radius:12px;font-size:0.95rem;font-weight:700;">
            Submit My Project
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="font-size:0.75rem;color:#94a3b8;margin:0;">
            Skillinf &nbsp;&middot;&nbsp;
            <a href="https://Skillinf.in" style="color:#f59e0b;text-decoration:none;">Skillinf.in</a>
            &nbsp;&middot;&nbsp; You received this because you are enrolled in a Skillinf internship.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Email: overdue warning — previous step still pending while next is due
───────────────────────────────────────────────────────────────────────────── */
function buildOverdueWarningEmail(
  name: string,
  pendingStep: number,  // the step they haven't submitted yet
  nextStep: number,     // the step whose due date is tomorrow
  nextDueDate: Date,
  domain: string,
): string {
  const nextDueFmt = fmtIST(nextDueDate);
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Inter,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header (red — urgent) -->
        <tr><td style="background:linear-gradient(135deg,#ef4444 0%,#b91c1c 100%);padding:32px 40px;text-align:center;">
          <p style="color:#fee2e2;font-size:0.78rem;font-weight:700;letter-spacing:0.1em;margin:0 0 8px;">Skillinf INTERNSHIP — ACTION REQUIRED</p>
          <h1 style="color:#fff;font-size:1.5rem;font-weight:800;margin:0;">Week ${pendingStep} Still Pending!</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <p style="font-size:1rem;color:#0f172a;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
          <p style="font-size:0.95rem;color:#334155;line-height:1.7;margin:0 0 20px;">
            We noticed that you have <strong>not yet submitted your Week ${pendingStep} project</strong>
            for your <strong>${domain}</strong> internship.
          </p>
          <p style="font-size:0.95rem;color:#334155;line-height:1.7;margin:0 0 24px;">
            Your <strong>Week ${nextStep} deadline is also arriving tomorrow (${nextDueFmt})</strong>
            — but you still need to complete and submit Week ${pendingStep} first before
            Week ${nextStep} becomes available.
          </p>

          <!-- Warning card -->
          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;width:100%;">
            <tr>
              <td style="background:#fef2f2;border:1.5px solid #fca5a5;border-radius:12px;padding:16px 24px;">
                <p style="margin:0;font-size:0.8rem;color:#b91c1c;font-weight:700;letter-spacing:0.05em;">
                  ACTION NEEDED
                </p>
                <p style="margin:8px 0 4px;font-size:0.95rem;font-weight:700;color:#991b1b;">
                  Week ${pendingStep} — Project not submitted yet
                </p>
                <p style="margin:4px 0 0;font-size:0.85rem;color:#7f1d1d;">
                  Week ${nextStep} due tomorrow: ${nextDueFmt}
                </p>
              </td>
            </tr>
          </table>

          <p style="font-size:0.9rem;color:#475569;line-height:1.65;margin:0 0 28px;">
            Please log in to your dashboard now, submit your Week ${pendingStep} project link
            (Google Drive / GitHub) for admin review. Once verified, your Week ${nextStep}
            task will unlock automatically.
          </p>

          <a href="https://Skillinf.in/dashboard"
            style="display:inline-block;background:linear-gradient(135deg,#ef4444,#b91c1c);
                   color:#fff;text-decoration:none;padding:14px 32px;
                   border-radius:12px;font-size:0.95rem;font-weight:700;">
            Submit Week ${pendingStep} Now
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="font-size:0.75rem;color:#94a3b8;margin:0;">
            Skillinf &nbsp;&middot;&nbsp;
            <a href="https://Skillinf.in" style="color:#ef4444;text-decoration:none;">Skillinf.in</a>
            &nbsp;&middot;&nbsp; You received this because you are enrolled in a Skillinf internship.
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

      // Parse registration date → IST midnight
      const rawReg = user.registeredAt ?? user.createdAt ?? new Date();
      let registeredIST: Date;
      if (user.registeredAtIST) {
        const parsed = new Date(user.registeredAtIST as string);
        registeredIST = isNaN(parsed.getTime())
          ? toISTMidnight(new Date(rawReg as string))
          : toISTMidnight(parsed);
      } else {
        registeredIST = toISTMidnight(new Date(rawReg as string));
      }

      // Cumulative due dates (IST midnight of each step's deadline)
      let cumulativeDays = 0;
      const dueDates: Date[] = weeks.map(w => {
        cumulativeDays += w.deadlineDays;
        return addCalendarDays(registeredIST, cumulativeDays);
      });

      for (let i = 0; i < 4; i++) {
        const stepNum     = i + 1;
        const stepKey     = `step${stepNum}`;
        const reminderKey = `duedateReminderStep${stepNum}`;

        // Skip if this step is already completed
        if (user.steps?.[stepKey]) continue;

        // Skip if reminder already sent for this step
        if (user[reminderKey]) continue;

        const dueIST = dueDates[i];

        // Is this step due TOMORROW in IST?
        if (dueIST >= tomorrowIST && dueIST < dayAfterIST) {

          // ── Smart check: has the PREVIOUS step been submitted? ──
          // For step 1 there is no previous step — always send normal reminder.
          // For steps 2–4: check if the previous step's project was submitted.
          const prevStepKey        = i > 0 ? `step${stepNum - 1}` : null;
          const prevStepDone       = prevStepKey ? !!user.steps?.[prevStepKey]       : true;
          const prevStepSubmitted  = prevStepKey ? !!user.submissions?.[prevStepKey] : true;
          const prevComplete       = prevStepDone || prevStepSubmitted;

          try {
            if (!prevComplete) {
              // Previous step NOT submitted — send urgent overdue warning email
              await sendMail({
                to: email,
                subject: `Action Required: Week ${stepNum - 1} Still Pending — Week ${stepNum} Due Tomorrow | Skillinf`,
                html: buildOverdueWarningEmail(name, stepNum - 1, stepNum, dueIST, domain),
                type: 'due_reminder',
              });
              results.push(
                `OVERDUE WARNING — ${email} | Week ${stepNum - 1} pending, Week ${stepNum} due ${fmtIST(dueIST)}`
              );
            } else {
              // Previous step done — send normal due-tomorrow reminder
              await sendMail({
                to: email,
                subject: `Reminder: Your Week ${stepNum} Project is Due Tomorrow! | Skillinf`,
                html: buildReminderEmail(name, stepNum, dueIST, domain),
                type: 'due_reminder',
              });
              results.push(
                `REMINDER — ${email} | Week ${stepNum} due ${fmtIST(dueIST)}`
              );
            }

            // Flag so we never send again for this step
            await db.collection('users').updateOne(
              { _id: user._id },
              { $set: { [reminderKey]: true, updatedAt: new Date(), updatedAtIST: istNow() } }
            );

            emailsSent++;
          } catch (err) {
            results.push(`ERROR — ${email} | Step ${stepNum}: ${(err as Error).message}`);
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
