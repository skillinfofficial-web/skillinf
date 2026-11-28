import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { sendMail } from '@/lib/mailer';
import { toISTMidnight, addCalendarDays, fmtISTLong } from '@/lib/ist';
import {
  buildReminderEmail,
  buildDueTodayEmail,
  buildOverdueEmail,
  buildOverdueWarningEmail,
  evaluateStudentDueReminder,
  toISTDateKey,
} from '@/lib/dueReminder';

const istNow = () => new Date().toLocaleString('en-IN', {
  timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short',
  year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
});

function fmtIST(d: Date): string {
  return fmtISTLong(d);
}

export async function GET(req: NextRequest) {
  // Verify cron secret at request time so Cloudflare Worker secrets are available
  const cronSecret = process.env.CRON_SECRET ?? '';
  const authHeader = req.headers.get('authorization');
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const db = await getDatabase();

    // "Today" and "tomorrow" in IST (midnight-aligned)
    const nowIST      = toISTMidnight(new Date());
    const tomorrowIST = addCalendarDays(nowIST, 1);
    const todayKey    = toISTDateKey(nowIST);

    // Only LinkedIn-verified students with at least one incomplete step
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
    let skippedPastEndDate = 0;
    const results: string[] = [];

    for (const user of users) {
      const email  = user.email  as string;
      const name   = user.name   as string;
      const domain = user.domain as string;
      const weeks  = courseMap.get(domain);
      if (!weeks || weeks.length < 4) continue;

      const evalResult = evaluateStudentDueReminder(user as Record<string, unknown>, weeks, nowIST);

      if (evalResult.action === 'skip_past_end_date') {
        skippedPastEndDate++;
        continue;
      }
      if (evalResult.action === 'none' || !evalResult.pendingStep || !evalResult.dueDate) {
        continue;
      }

      const { pendingStep, dueDate, nextStep, nextDueDate, isNextDueToday } = evalResult;
      const updateSet: Record<string, unknown> = {
        lastDueReminderDateIST: todayKey,
        updatedAt: new Date(),
        updatedAtIST: istNow(),
      };

      try {
        if (evalResult.action === 'due_tomorrow') {
          await sendMail({
            to: email,
            subject: `Reminder: Your Week ${pendingStep} Project is Due Tomorrow! | Skillinf`,
            html: buildReminderEmail(name, pendingStep, dueDate, domain),
            type: 'due_reminder',
          });
          updateSet[`duedateReminderStep${pendingStep}`] = true;
          results.push(`DUE TOMORROW — ${email} | Week ${pendingStep} due ${fmtIST(dueDate)}`);
        } else if (evalResult.action === 'due_today') {
          await sendMail({
            to: email,
            subject: `Action Needed: Your Week ${pendingStep} Project is Due Today! | Skillinf`,
            html: buildDueTodayEmail(name, pendingStep, dueDate, domain),
            type: 'due_today_reminder',
          });
          updateSet[`dueTodayReminderStep${pendingStep}`] = true;
          results.push(`DUE TODAY — ${email} | Week ${pendingStep} due ${fmtIST(dueDate)}`);
        } else if (evalResult.action === 'overdue_next_due' && nextStep && nextDueDate) {
          await sendMail({
            to: email,
            subject: `Urgent: Week ${pendingStep} Due Crossed — Week ${nextStep} Due ${isNextDueToday ? 'Today' : 'Tomorrow'} | Skillinf`,
            html: buildOverdueWarningEmail(name, pendingStep, nextStep, nextDueDate, domain, Boolean(isNextDueToday)),
            type: 'due_overdue_next_reminder',
          });
          const flagKey = isNextDueToday
            ? `overdueOnNextStep${pendingStep}_to_${nextStep}`
            : `overdueBeforeNextStep${pendingStep}_to_${nextStep}`;
          updateSet[flagKey] = true;
          updateSet.lastOverdueReminderDateIST = todayKey;
          results.push(
            `CROSSED + NEXT DUE — ${email} | Week ${pendingStep} crossed, Week ${nextStep} due ${fmtIST(nextDueDate)}`
          );
        } else if (evalResult.action === 'overdue') {
          await sendMail({
            to: email,
            subject: `Overdue Reminder: Please Upload Your Week ${pendingStep} Project | Skillinf`,
            html: buildOverdueEmail(name, pendingStep, dueDate, domain),
            type: 'due_overdue_reminder',
          });
          updateSet.lastOverdueReminderDateIST = todayKey;
          results.push(`OVERDUE — ${email} | Week ${pendingStep} due was ${fmtIST(dueDate)}`);
        }

        await db.collection('users').updateOne(
          { _id: user._id },
          { $set: updateSet }
        );
        emailsSent++;
      } catch (err) {
        results.push(`ERROR — ${email} | Step ${pendingStep}: ${(err as Error).message}`);
      }
    }

    console.log(`[due-reminder cron] IST today: ${fmtIST(nowIST)} | emails sent: ${emailsSent} | skipped past endDate: ${skippedPastEndDate}`);
    return NextResponse.json({
      success: true,
      istToday: fmtIST(nowIST),
      istTomorrow: fmtIST(tomorrowIST),
      emailsSent,
      skippedPastEndDate,
      details: results,
    });
  } catch (err) {
    console.error('[GET /api/cron/due-reminder]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
