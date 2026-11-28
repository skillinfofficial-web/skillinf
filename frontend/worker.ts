// @ts-expect-error — .open-next/worker.js is generated at build time by opennextjs-cloudflare build
import openNextHandler from './.open-next/worker.js';

interface Env {
  CRON_SECRET?: string;
  [key: string]: unknown;
}

interface ScheduledEvent {
  cron: string;
  scheduledTime: number;
  type: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

async function runCronRoute(path: string, env: Env, ctx: ExecutionContext): Promise<void> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(env.CRON_SECRET ? { Authorization: `Bearer ${env.CRON_SECRET}` } : {}),
  };
  const req = new Request(`https://www.skillinf.in${path}`, { method: 'GET', headers });
  const res = await openNextHandler.fetch(req, env, ctx);
  const body = await res.text();
  if (!res.ok) {
    console.error(`[cron] ${path} FAILED →`, res.status, body);
  } else {
    console.log(`[cron] ${path} →`, res.status, body);
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return openNextHandler.fetch(request, env, ctx);
  },

  /**
   * Cloudflare Cron Trigger handler inside the main `skillinf` Worker:
   *   "30 2 * * *" → 08:00 AM IST daily → /api/cron/due-reminder
   *   "30 3 * * *" → 09:00 AM IST daily → /api/cron/cert-unlock-notify
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    if (event.cron === '30 2 * * *') {
      await runCronRoute('/api/cron/due-reminder', env, ctx);
    } else if (event.cron === '30 3 * * *') {
      await runCronRoute('/api/cron/cert-unlock-notify', env, ctx);
    } else {
      console.warn('[cron] Unknown cron expression:', event.cron);
    }
  },
};
