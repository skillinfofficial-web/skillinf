/**
 * Cloudflare Cron Worker — Scheduled event handler
 *
 * This file handles the Cloudflare cron triggers defined in wrangler.jsonc.
 * Cloudflare calls the `scheduled` export at the configured cron times.
 *
 * Schedule (UTC):
 *   "30 2 * * *" → 08:00 IST → fires /api/cron/due-reminder
 *   "30 3 * * *" → 09:00 IST → fires /api/cron/cert-unlock-notify
 *
 * To wire this in, the main worker.js from OpenNext re-exports this handler.
 * See wrangler.jsonc for trigger configuration.
 */

export interface Env {
  CRON_SECRET: string;
}

export default {
  /**
   * HTTP requests — not used here, forwarded to OpenNext's main worker.
   * This module is only imported for the `scheduled` export.
   */
  async fetch(): Promise<Response> {
    return new Response("OK");
  },

  /**
   * Cloudflare Cron Trigger handler.
   * Internally calls the Next.js API route so it runs in the same Worker context
   * with all env secrets available.
   */
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<void> {
    const origin = "https://skillinf.in";
    const headers: HeadersInit = {
      Authorization: `Bearer ${env.CRON_SECRET}`,
      "Content-Type": "application/json",
    };

    if (event.cron === "30 2 * * *") {
      // 08:00 IST daily — send due-tomorrow step reminders
      const res = await fetch(`${origin}/api/cron/due-reminder`, { headers });
      console.log("[cron] due-reminder →", res.status, await res.text());
    } else if (event.cron === "30 3 * * *") {
      // 09:00 IST daily — notify users whose internship ends today
      const res = await fetch(`${origin}/api/cron/cert-unlock-notify`, { headers });
      console.log("[cron] cert-unlock-notify →", res.status, await res.text());
    } else {
      console.warn("[cron] Unknown cron expression:", event.cron);
    }
  },
};
