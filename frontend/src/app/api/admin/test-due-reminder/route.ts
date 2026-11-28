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
} from '@/lib/dueReminder';

/**
 * GET /api/admin/test-due-reminder
 * Diagnostic endpoint to verify deadline reminder rules & email templates:
 *   - Performs a read-only dry-run across LinkedIn-verified students (skips anyone past endDate)
 *   - Sends one sample reminder email to admin addresses (or ?to=email@example.com)
 *   - Supports ?variant=tomorrow|today|overdue|crossed_next (default: tomorrow)
 *   - Pass ?dryRun=1 to inspect the schedule without sending an email
 *
 * REMOVE or PROTECT this route once verification is complete.
 */
export async function GET(req: NextRequest) {
  const apiKeySet = !!process.env.RESEND_API_KEY;
  const cronSecretSet = !!process.env.CRON_SECRET;

  const { searchParams } = new URL(req.url);
  const dryRun = searchParams.get('dryRun') === '1';
  const variant = searchParams.get('variant') ?? 'tomorrow';
  const toParam = searchParams.get('to')?.trim();
  const recipients = toParam
    ? [toParam]
    : ['arunkumar.s202006@gmail.com', 'skillinfofficial@gmail.com'];

  try {
    const db = await getDatabase();
    const nowIST = toISTMidnight(new Date());
    const tomorrowIST = addCalendarDays(nowIST, 1);

    const [users, courses] = await Promise.all([
      db.collection('users').find({
        linkedinVerified: true,
        $or: [
          { 'steps.step1': { $ne: true } },
          { 'steps.step2': { $ne: true } },
          { 'steps.step3': { $ne: true } },
          { 'steps.step4': { $ne: true } },
        ],
      }).toArray(),
      db.collection('CompanyInternships').find({}).toArray(),
    ]);

    const courseMap = new Map(
      courses.map(c => [c.name as string, c.weeks as { week: number; deadlineDays: number }[]])
    );

    let skippedPastEndDate = 0;
    const dueMatchesToday: {
      email: string;
      name: string;
      domain: string;
      action: string;
      pendingStep?: number;
      nextStep?: number;
      reason: string;
    }[] = [];

    for (const user of users) {
      const weeks = courseMap.get(user.domain as string);
      if (!weeks || weeks.length < 4) continue;

      const evalResult = evaluateStudentDueReminder(user as Record<string, unknown>, weeks, nowIST);
      if (evalResult.action === 'skip_past_end_date') {
        skippedPastEndDate++;
        continue;
      }
      if (evalResult.action !== 'none') {
        dueMatchesToday.push({
          email: user.email as string,
          name: user.name as string,
          domain: user.domain as string,
          action: evalResult.action,
          pendingStep: evalResult.pendingStep,
          nextStep: evalResult.nextStep,
          reason: evalResult.reason,
        });
      }
    }

    let sampleEmailSent = false;
    if (!dryRun) {
      const yesterdayIST = addCalendarDays(nowIST, -1);
      let subject = `Reminder Test: Your Week 1 Project is Due Tomorrow (${fmtISTLong(tomorrowIST)}) | Skillinf`;
      let html = buildReminderEmail('Test Student', 1, tomorrowIST, 'Web Development');

      if (variant === 'today') {
        subject = `Test: Your Week 1 Project is Due Today (${fmtISTLong(nowIST)}) | Skillinf`;
        html = buildDueTodayEmail('Test Student', 1, nowIST, 'Web Development');
      } else if (variant === 'overdue') {
        subject = `Test: Week 1 Project Overdue — Please Upload | Skillinf`;
        html = buildOverdueEmail('Test Student', 1, yesterdayIST, 'Web Development');
      } else if (variant === 'crossed_next') {
        subject = `Test: Week 1 Due Crossed — Week 2 Due Reached | Skillinf`;
        html = buildOverdueWarningEmail('Test Student', 1, 2, tomorrowIST, 'Web Development', false);
      }

      await sendMail({
        to: recipients,
        subject,
        html,
        type: 'due_reminder_test',
      });
      sampleEmailSent = true;
    }

    return NextResponse.json({
      success: true,
      config: {
        RESEND_API_KEY: apiKeySet,
        CRON_SECRET: cronSecretSet,
      },
      istToday: fmtISTLong(nowIST),
      istTomorrow: fmtISTLong(tomorrowIST),
      verifiedIncompleteStudents: users.length,
      skippedPastEndDate,
      dueMatchesToday,
      sampleVariant: variant,
      sampleEmailSent,
      sampleSentTo: dryRun ? [] : recipients,
      note: 'Dry-run only: no student emails or DB reminder flags were modified.',
    });
  } catch (err) {
    const message = (err as Error)?.message ?? String(err);
    console.error('[test-due-reminder] FAILED:', message);
    return NextResponse.json({
      success: false,
      error: message,
      config: {
        RESEND_API_KEY: apiKeySet,
        CRON_SECRET: cronSecretSet,
      },
    }, { status: 500 });
  }
}
