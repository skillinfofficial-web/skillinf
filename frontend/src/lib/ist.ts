/**
 * IST (Asia/Kolkata, UTC+05:30) date/time helpers.
 * MongoDB always stores ISODate as UTC internally.
 * Use these helpers to store HUMAN-READABLE IST strings alongside UTC dates,
 * so admins see correct Indian time in MongoDB Compass / dashboards.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +05:30 in ms

/** Current time as a JS Date (UTC internally, as always). */
export function nowUTC(): Date {
  return new Date();
}

/**
 * IST-formatted datetime string for display / storing as a readable field.
 * e.g. "02 Oct 2026, 08:51 AM"
 */
export function nowIST(): string {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

/**
 * IST-only date string (no time), useful for due-date comparisons.
 * e.g. "02 Oct 2026"
 */
export function nowISTDate(): string {
  return new Date().toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

/**
 * Convert any UTC Date to an IST midnight-aligned Date.
 * Used by the cron to compare IST calendar days.
 */
export function toISTMidnight(d: Date): Date {
  const istMs   = d.getTime() + IST_OFFSET_MS;
  const istDate = new Date(istMs);
  return new Date(
    Date.UTC(istDate.getUTCFullYear(), istDate.getUTCMonth(), istDate.getUTCDate())
  );
}

/**
 * Add calendar days to a midnight-aligned Date.
 */
export function addCalendarDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Format a UTC Date as IST string for emails / display.
 * e.g. "03 October 2026"
 */
export function fmtISTLong(d: Date): string {
  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

/**
 * Convenience: returns both the UTC Date and IST string together,
 * ready to spread into a MongoDB $set operation.
 *
 * Usage:
 *   $set: { ...istTimestamps('createdAt'), ...istTimestamps('updatedAt') }
 *   → { createdAt: Date, createdAtIST: "02 Oct 2026, 08:51 AM",
 *       updatedAt: Date, updatedAtIST: "02 Oct 2026, 08:51 AM" }
 */
export function istTimestamps(field: string): Record<string, Date | string> {
  const utc = new Date();
  const ist = utc.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
  return { [field]: utc, [`${field}IST`]: ist };
}
