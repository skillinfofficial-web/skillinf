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

// Inline Cloudflare Workers type stubs — no package install needed
interface ScheduledEvent  { cron: string; scheduledTime: number; type: string; }
interface ExecutionContext { waitUntil(promise: Promise<unknown>): void; passThroughOnException(): void; }

interface Env {
  CRON_SECRET?: string;
  FRONTEND_ORIGIN?: string;
  SKILLINF_APP?: {
    fetch(input: Request | string, init?: RequestInit): Promise<Response>;
  };
}

async function triggerRoute(env: Env, path: string): Promise<void> {
  const origin = (env.FRONTEND_ORIGIN || "https://www.skillinf.in").replace(/\/+$/, "");
  const url = `${origin}${path}`;

  if (!env.CRON_SECRET) {
    console.warn("[cron] CRON_SECRET is not set on skillinf-cron worker!");
  }

  const headers: HeadersInit = {
    ...(env.CRON_SECRET ? { Authorization: `Bearer ${env.CRON_SECRET}` } : {}),
    "Content-Type": "application/json",
  };

  // Prefer Cloudflare Service Binding to `skillinf` so redirects/WAF never strip Authorization
  const res = env.SKILLINF_APP
    ? await env.SKILLINF_APP.fetch(new Request(url, { method: "GET", headers }))
    : await fetch(url, { method: "GET", headers });

  const body = await res.text();
  if (!res.ok) {
    console.error(`[cron] ${path} FAILED →`, res.status, body);
  } else {
    console.log(`[cron] ${path} →`, res.status, body);
  }
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
   * Calls the Next.js API route via Service Binding (or FRONTEND_ORIGIN fallback).
   */
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<void> {
    if (event.cron === "30 2 * * *") {
      // 08:00 IST daily — send due-tomorrow step reminders
      await triggerRoute(env, "/api/cron/due-reminder");
    } else if (event.cron === "30 3 * * *") {
      // 09:00 IST daily — notify users whose internship ends today
      await triggerRoute(env, "/api/cron/cert-unlock-notify");
    } else {
      console.warn("[cron] Unknown cron expression:", event.cron);
    }
  },
};
