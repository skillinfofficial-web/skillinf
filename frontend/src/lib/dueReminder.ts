import { toISTMidnight, addCalendarDays, fmtISTLong } from '@/lib/ist';

/**
 * Parse a "YYYY-MM-DD" string into a midnight UTC Date representing that IST calendar day.
 */
function parseISODateMidnight(value: unknown): Date | null {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value.trim())) {
    const [y, m, d] = value.trim().slice(0, 10).split('-').map(Number);
    if (y && m && d) return new Date(Date.UTC(y, m - 1, d));
  }
  return null;
}

/**
 * Resolve the student's internship base date (IST midnight-aligned) matching
 * the dashboard's dueDate calculation (`user.startDate` first, then UTC
 * `registeredAt` / `createdAt`). Never parses timezone-less `registeredAtIST`
 * strings in UTC runtime, which previously shifted evening registrations by +1 day.
 */
export function resolveUserStartIST(user: Record<string, unknown>): Date {
  const fromStart = parseISODateMidnight(user.startDate);
  if (fromStart) return fromStart;

  const rawReg = user.registeredAt ?? user.createdAt ?? new Date();
  const parsed = new Date(rawReg as string | Date);
  return toISTMidnight(isNaN(parsed.getTime()) ? new Date() : parsed);
}

/**
 * Resolve the student's internship end date (IST midnight-aligned).
 * Returns null if no valid endDate is recorded.
 */
export function resolveUserEndIST(user: Record<string, unknown>): Date | null {
  const fromEnd = parseISODateMidnight(user.endDate);
  if (fromEnd) return fromEnd;
  if (user.endDate instanceof Date && !isNaN(user.endDate.getTime())) {
    return toISTMidnight(user.endDate);
  }
  return null;
}

/**
 * Format an IST midnight Date as "YYYY-MM-DD" for daily deduplication checks.
 */
export function toISTDateKey(istMidnight: Date): string {
  return istMidnight.toISOString().slice(0, 10);
}

function wrapEmailLayout(opts: {
  headerBg: string;
  eyebrowColor: string;
  eyebrow: string;
  title: string;
  bodyHtml: string;
  ctaBg: string;
  ctaText: string;
  accentColor: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Inter,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:${opts.headerBg};padding:32px 40px;text-align:center;">
          <p style="color:${opts.eyebrowColor};font-size:0.78rem;font-weight:700;letter-spacing:0.1em;margin:0 0 8px;">${opts.eyebrow}</p>
          <h1 style="color:#fff;font-size:1.45rem;font-weight:800;margin:0;">${opts.title}</h1>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          ${opts.bodyHtml}
          <a href="https://www.skillinf.in/dashboard"
            style="display:inline-block;background:${opts.ctaBg};
                   color:#fff;text-decoration:none;padding:14px 32px;
                   border-radius:12px;font-size:0.95rem;font-weight:700;">
            ${opts.ctaText}
          </a>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="font-size:0.75rem;color:#94a3b8;margin:0;">
            Skillinf &nbsp;&middot;&nbsp;
            <a href="https://www.skillinf.in" style="color:${opts.accentColor};text-decoration:none;">skillinf.in</a>
            &nbsp;&middot;&nbsp; You received this because you are enrolled in a Skillinf internship.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * 1. Normal reminder — 1 day before step due date
 */
export function buildReminderEmail(
  name: string,
  step: number,
  dueDate: Date,
  domain: string,
): string {
  const dueFmt = fmtISTLong(dueDate);
  return wrapEmailLayout({
    headerBg: 'linear-gradient(135deg,#f59e0b 0%,#d97706 100%)',
    eyebrowColor: '#fef3c7',
    eyebrow: 'Skillinf INTERNSHIP',
    title: 'Deadline Reminder',
    ctaBg: 'linear-gradient(135deg,#f59e0b,#d97706)',
    ctaText: 'Submit My Project',
    accentColor: '#f59e0b',
    bodyHtml: `
      <p style="font-size:1rem;color:#0f172a;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
      <p style="font-size:0.95rem;color:#334155;line-height:1.7;margin:0 0 24px;">
        This is a friendly reminder that your <strong>Week ${step} project submission</strong>
        for your <strong>${domain}</strong> internship is due <strong>tomorrow (${dueFmt})</strong>.
      </p>
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
      </p>`,
  });
}

/**
 * 2. Due-today reminder — student has reached the step due date without submitting
 */
export function buildDueTodayEmail(
  name: string,
  step: number,
  dueDate: Date,
  domain: string,
): string {
  const dueFmt = fmtISTLong(dueDate);
  return wrapEmailLayout({
    headerBg: 'linear-gradient(135deg,#ea580c 0%,#c2410c 100%)',
    eyebrowColor: '#ffedd5',
    eyebrow: 'Skillinf INTERNSHIP — DUE TODAY',
    title: `Week ${step} Project Due Today!`,
    ctaBg: 'linear-gradient(135deg,#ea580c,#c2410c)',
    ctaText: `Upload Week ${step} Project`,
    accentColor: '#ea580c',
    bodyHtml: `
      <p style="font-size:1rem;color:#0f172a;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
      <p style="font-size:0.95rem;color:#334155;line-height:1.7;margin:0 0 24px;">
        Today (<strong>${dueFmt}</strong>) is the due date for your <strong>Week ${step} project submission</strong>
        in your <strong>${domain}</strong> internship, and you have not uploaded your project yet.
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;width:100%;">
        <tr>
          <td style="background:#fff7ed;border:1.5px solid #fdba74;border-radius:12px;padding:16px 24px;">
            <p style="margin:0;font-size:0.8rem;color:#c2410c;font-weight:700;letter-spacing:0.05em;">
              FINAL DAY TO SUBMIT ON TIME
            </p>
            <p style="margin:6px 0 0;font-size:1.05rem;font-weight:800;color:#9a3412;">Week ${step} — Due Today (${dueFmt})</p>
          </td>
        </tr>
      </table>
      <p style="font-size:0.9rem;color:#475569;line-height:1.65;margin:0 0 28px;">
        Please hurry up and log in to your dashboard to upload your Week ${step} project link
        (Google Drive / GitHub) before the deadline passes.
      </p>`,
  });
}

/**
 * 3. Overdue reminder — student crossed the due date and still hasn't uploaded the project
 */
export function buildOverdueEmail(
  name: string,
  pendingStep: number,
  pendingDueDate: Date,
  domain: string,
): string {
  const dueFmt = fmtISTLong(pendingDueDate);
  return wrapEmailLayout({
    headerBg: 'linear-gradient(135deg,#ef4444 0%,#b91c1c 100%)',
    eyebrowColor: '#fee2e2',
    eyebrow: 'Skillinf INTERNSHIP — DEADLINE EXCEEDED',
    title: `Week ${pendingStep} Project Overdue!`,
    ctaBg: 'linear-gradient(135deg,#ef4444,#b91c1c)',
    ctaText: `Upload Week ${pendingStep} Now`,
    accentColor: '#ef4444',
    bodyHtml: `
      <p style="font-size:1rem;color:#0f172a;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
      <p style="font-size:0.95rem;color:#334155;line-height:1.7;margin:0 0 24px;">
        Your <strong>Week ${pendingStep} project submission</strong> for your <strong>${domain}</strong> internship
        has exceeded its due date (<strong>${dueFmt}</strong>), and we still haven&apos;t received your upload.
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;width:100%;">
        <tr>
          <td style="background:#fef2f2;border:1.5px solid #fca5a5;border-radius:12px;padding:16px 24px;">
            <p style="margin:0;font-size:0.8rem;color:#b91c1c;font-weight:700;letter-spacing:0.05em;">
              OVERDUE — ACTION REQUIRED
            </p>
            <p style="margin:8px 0 4px;font-size:0.95rem;font-weight:700;color:#991b1b;">
              Week ${pendingStep} — Not uploaded yet (Due was ${dueFmt})
            </p>
          </td>
        </tr>
      </table>
      <p style="font-size:0.9rem;color:#475569;line-height:1.65;margin:0 0 28px;">
        Please hurry up and upload your Week ${pendingStep} project link on your dashboard so your
        internship progress stays on track and the next step can unlock after review.
      </p>`,
  });
}

/**
 * 4. Crossed previous week's due date AND reached a later week's due date
 */
export function buildOverdueWarningEmail(
  name: string,
  pendingStep: number,
  nextStep: number,
  nextDueDate: Date,
  domain: string,
  isNextDueToday = false,
): string {
  const nextDueFmt = fmtISTLong(nextDueDate);
  const timingPhrase = isNextDueToday
    ? `and today you have reached your <strong>Week ${nextStep} due date (${nextDueFmt})</strong>`
    : `and now your <strong>Week ${nextStep} due date is arriving tomorrow (${nextDueFmt})</strong>`;

  return wrapEmailLayout({
    headerBg: 'linear-gradient(135deg,#dc2626 0%,#991b1b 100%)',
    eyebrowColor: '#fee2e2',
    eyebrow: 'Skillinf INTERNSHIP — URGENT ACTION REQUIRED',
    title: `Week ${pendingStep} Crossed — Week ${nextStep} Reached!`,
    ctaBg: 'linear-gradient(135deg,#dc2626,#991b1b)',
    ctaText: `Submit Week ${pendingStep} Immediately`,
    accentColor: '#dc2626',
    bodyHtml: `
      <p style="font-size:1rem;color:#0f172a;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
      <p style="font-size:0.95rem;color:#334155;line-height:1.7;margin:0 0 20px;">
        Your <strong>Week ${pendingStep} project submission due date has already crossed</strong>
        for your <strong>${domain}</strong> internship, ${timingPhrase} —
        yet Week ${pendingStep} is still not uploaded.
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;width:100%;">
        <tr>
          <td style="background:#fef2f2;border:1.5px solid #fca5a5;border-radius:12px;padding:16px 24px;">
            <p style="margin:0;font-size:0.8rem;color:#b91c1c;font-weight:700;letter-spacing:0.05em;">
              HURRY UP — SUBMISSION PENDING
            </p>
            <p style="margin:8px 0 4px;font-size:0.95rem;font-weight:700;color:#991b1b;">
              Week ${pendingStep} due crossed — still not uploaded
            </p>
            <p style="margin:4px 0 0;font-size:0.85rem;color:#7f1d1d;">
              Week ${nextStep} due ${isNextDueToday ? 'today' : 'tomorrow'}: ${nextDueFmt}
            </p>
          </td>
        </tr>
      </table>
      <p style="font-size:0.9rem;color:#475569;line-height:1.65;margin:0 0 28px;">
        Please hurry up and log in to your dashboard right now to upload your Week ${pendingStep}
        project link (Google Drive / GitHub). Week ${nextStep} will only unlock once
        Week ${pendingStep} is submitted and verified.
      </p>`,
  });
}

export interface DueEvaluation {
  action: 'due_tomorrow' | 'due_today' | 'overdue_next_due' | 'overdue' | 'skip_past_end_date' | 'none';
  pendingStep?: number;
  nextStep?: number;
  isNextDueToday?: boolean;
  dueDate?: Date;
  nextDueDate?: Date;
  reason: string;
}

/**
 * Evaluate which reminder (if any) applies to a LinkedIn-verified student today (IST).
 * Shared between the live cron and the dry-run diagnostic endpoint.
 */
export function evaluateStudentDueReminder(
  user: Record<string, unknown>,
  weeks: { week: number; deadlineDays: number }[],
  nowIST: Date,
): DueEvaluation {
  const endIST = resolveUserEndIST(user);
  if (endIST && nowIST > endIST) {
    return { action: 'skip_past_end_date', reason: `Internship endDate (${fmtISTLong(endIST)}) already crossed.` };
  }

  const todayKey = toISTDateKey(nowIST);
  if (user.lastDueReminderDateIST === todayKey) {
    return { action: 'none', reason: `Already sent a reminder today (${todayKey}).` };
  }

  const startIST = resolveUserStartIST(user);
  let cumulativeDays = 0;
  const dueDates: Date[] = weeks.map(w => {
    cumulativeDays += w.deadlineDays;
    return addCalendarDays(startIST, cumulativeDays);
  });

  const steps = (user.steps ?? {}) as Record<string, boolean | undefined>;
  const submissions = (user.submissions ?? {}) as Record<string, string | null | undefined>;

  // Find the earliest week (1..4) that has NOT yet been submitted or completed
  let pendingIdx = -1;
  for (let i = 0; i < 4; i++) {
    const k = `step${i + 1}`;
    if (!steps[k] && !submissions[k]) {
      pendingIdx = i;
      break;
    }
  }
  if (pendingIdx === -1) {
    return { action: 'none', reason: 'All 4 weeks are already submitted or completed.' };
  }

  const pendingStep = pendingIdx + 1;
  const pendingDue = dueDates[pendingIdx];
  const tomorrowIST = addCalendarDays(nowIST, 1);

  // 1. Due tomorrow (1 day before due date)
  if (pendingDue.getTime() === tomorrowIST.getTime()) {
    if (user[`duedateReminderStep${pendingStep}`]) {
      return { action: 'none', reason: `Week ${pendingStep} due-tomorrow reminder already sent.` };
    }
    return {
      action: 'due_tomorrow',
      pendingStep,
      dueDate: pendingDue,
      reason: `Week ${pendingStep} is due tomorrow (${fmtISTLong(pendingDue)}).`,
    };
  }

  // 2. Reached due date today
  if (pendingDue.getTime() === nowIST.getTime()) {
    if (user[`dueTodayReminderStep${pendingStep}`]) {
      return { action: 'none', reason: `Week ${pendingStep} due-today reminder already sent.` };
    }
    return {
      action: 'due_today',
      pendingStep,
      dueDate: pendingDue,
      reason: `Week ${pendingStep} is due today (${fmtISTLong(pendingDue)}).`,
    };
  }

  // 3. Crossed pending week's due date without uploading
  if (nowIST > pendingDue) {
    // 3a. Check if a later week's due date is today or tomorrow
    for (let j = pendingIdx + 1; j < 4; j++) {
      const nextStep = j + 1;
      const nextDue = dueDates[j];
      const isTomorrow = nextDue.getTime() === tomorrowIST.getTime();
      const isToday = nextDue.getTime() === nowIST.getTime();
      if (isTomorrow || isToday) {
        const flagKey = isToday
          ? `overdueOnNextStep${pendingStep}_to_${nextStep}`
          : `overdueBeforeNextStep${pendingStep}_to_${nextStep}`;
        if (!user[flagKey]) {
          return {
            action: 'overdue_next_due',
            pendingStep,
            nextStep,
            isNextDueToday: isToday,
            dueDate: pendingDue,
            nextDueDate: nextDue,
            reason: `Week ${pendingStep} due crossed (${fmtISTLong(pendingDue)}) and reached Week ${nextStep} due (${fmtISTLong(nextDue)}).`,
          };
        }
      }
    }

    // 3b. General overdue reminder: immediately on day after due date, then every 2 days
    const lastOverdueKey = user.lastOverdueReminderDateIST as string | undefined;
    if (lastOverdueKey) {
      const lastOverdueDate = parseISODateMidnight(lastOverdueKey);
      const twoDaysAgo = addCalendarDays(nowIST, -2);
      if (lastOverdueDate && lastOverdueDate > twoDaysAgo) {
        return {
          action: 'none',
          reason: `Overdue reminder for Week ${pendingStep} was sent recently (${lastOverdueKey}).`,
        };
      }
    }

    return {
      action: 'overdue',
      pendingStep,
      dueDate: pendingDue,
      reason: `Week ${pendingStep} due date (${fmtISTLong(pendingDue)}) exceeded and still not uploaded.`,
    };
  }

  return {
    action: 'none',
    reason: `Next unsubmitted Week ${pendingStep} is due on ${fmtISTLong(pendingDue)}.`,
  };
}
