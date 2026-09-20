/**
 * Einfacher In-Memory Rate Limiter.
 *
 * Für einen Single-Instance-Deploy ausreichend. Bei horizontaler Skalierung
 * (mehrere Serverinstanzen) sollte dies durch einen persistenten,
 * gemeinsam genutzten Speicher ersetzt werden (z. B. Redis).
 */
const hits = new Map<string, { count: number; windowStart: number }>();

const MAX_REQUESTS = Number(process.env.QUOTE_RATE_LIMIT_MAX ?? 5);
const WINDOW_MS = Number(process.env.QUOTE_RATE_LIMIT_WINDOW_MS ?? 10 * 60 * 1000);

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(key, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_REQUESTS;
}
