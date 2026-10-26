import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { sendMail } from "@/lib/mailer";
import { toISTMidnight, addCalendarDays, fmtISTLong } from "@/lib/ist";

const CRON_SECRET = process.env.CRON_SECRET ?? "";

const istNow = () =>
  new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

function buildCertUnlockEmail(name: string, domain: string, endDateFmt: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Inter,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:32px 40px;text-align:center;">
          <p style="color:#d1fae5;font-size:0.78rem;font-weight:700;letter-spacing:0.1em;margin:0 0 8px;">Skillinf INTERNSHIP</p>
          <h1 style="color:#fff;font-size:1.5rem;font-weight:800;margin:0;">Your Certificate is Now Available!</h1>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <p style="font-size:1rem;color:#0f172a;margin:0 0 16px;">Hi <strong>${name}</strong>,</p>
          <p style="font-size:0.95rem;color:#334155;line-height:1.7;margin:0 0 24px;">
            Congratulations! Your <strong>${domain}</strong> internship has reached its end date
            (<strong>${endDateFmt}</strong>). Your e-certificate download is now
            <strong style="color:#059669;">unlocked</strong>.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;width:100%;">
            <tr>
              <td style="background:#ecfdf5;border:1.5px solid #6ee7b7;border-radius:12px;padding:16px 24px;text-align:center;">
                <p style="margin:0;font-size:0.8rem;color:#065f46;font-weight:700;letter-spacing:0.05em;">INTERNSHIP END DATE REACHED</p>
                <p style="margin:6px 0 0;font-size:1.15rem;font-weight:800;color:#047857;">${endDateFmt}</p>
              </td>
            </tr>
          </table>
          <p style="font-size:0.9rem;color:#475569;line-height:1.65;margin:0 0 28px;">
            Log in to your dashboard, scroll to the <strong>Get Your E-Certificate</strong> section,
            and click <strong>"Download Certificate"</strong> to save your personalised PDF.
          </p>
          <a href="https://Skillinf.in/dashboard"
            style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);
                   color:#fff;text-decoration:none;padding:14px 32px;
                   border-radius:12px;font-size:0.95rem;font-weight:700;">
            Download My Certificate &rarr;
          </a>
          <p style="font-size:0.82rem;color:#94a3b8;line-height:1.55;margin:28px 0 0;">
            If you face any issues, contact us at
            <a href="mailto:support@skillinf.in" style="color:#10b981;text-decoration:none;">support@skillinf.in</a>.
          </p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="font-size:0.75rem;color:#94a3b8;margin:0;">
            Skillinf &nbsp;&middot;&nbsp;
            <a href="https://Skillinf.in" style="color:#10b981;text-decoration:none;">Skillinf.in</a>
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
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const db = await getDatabase();

    const nowIST      = toISTMidnight(new Date());
    const tomorrowIST = addCalendarDays(nowIST, 1);

    // endDate stored as "YYYY-MM-DD" string — match today's IST date
    const todayStr    = new Date(nowIST.getTime()      + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const tomorrowStr = new Date(tomorrowIST.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const users = await db.collection("users").find({
      paymentDone: true,
      certUnlockNotified: { $ne: true },
      endDate: { $gte: todayStr, $lt: tomorrowStr },
    }).toArray();

    let emailsSent = 0;
    const results: string[] = [];

    for (const user of users) {
      const email      = user.email  as string;
      const name       = user.name   as string;
      const domain     = user.domain as string;
      const endDateFmt = fmtISTLong(new Date(user.endDate as string));

      try {
        await sendMail({
          to: email,
          subject: `Your ${domain} Internship Certificate is Now Available! | Skillinf`,
          html: buildCertUnlockEmail(name, domain, endDateFmt),
          type: "cert_unlock_notify",
        });

        await db.collection("users").updateOne(
          { _id: user._id },
          { $set: { certUnlockNotified: true, updatedAt: new Date(), updatedAtIST: istNow() } }
        );

        emailsSent++;
        results.push(`OK ${email} — ${domain} — end: ${endDateFmt}`);
      } catch (err) {
        results.push(`ERR ${email} — ${(err as Error).message}`);
      }
    }

    console.log(`[cert-unlock-notify] IST today: ${todayStr} | emails sent: ${emailsSent}`);
    return NextResponse.json({ success: true, istToday: todayStr, emailsSent, details: results });
  } catch (err) {
    console.error("[GET /api/cron/cert-unlock-notify]", err);
    return NextResponse.json({ success: false, message: "Server error." }, { status: 500 });
  }
}
