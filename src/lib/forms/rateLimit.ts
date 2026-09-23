/**
 * Einfacher In-Memory Rate Limiter.
 *
 * Für einen Single-Instance-Deploy ausreichend. Bei horizontaler Skalierung
 * (mehrere Serverinstanzen) sollte dies durch einen persistenten,
 * gemeinsam genutzten Speicher ersetzt werden (z. B. Redis).
 *
 * MAX_REQUESTS/WINDOW_MS bewusst fest im Code statt über `process.env` auf
 * Modulebene konfigurierbar: `process.env` ist auf der Cloudflare-Workers-
 * Laufzeit (Wix-Hosting-Adapter) keine zuverlässige Quelle für echte, im
 * Wix-Dashboard gesetzte Werte (siehe astro.config.base.mjs), und ein
 * fehlgeschlagener/undefinierter Zugriff auf Modulebene würde noch vor
 * jedem try/catch der aufrufenden Route laufen. Es gibt aktuell keinen
 * geschäftlichen Grund, ausgerechnet diese zwei Werte extern konfigurierbar
 * zu machen.
 */
const hits = new Map<string, { count: number; windowStart: number }>();

const MAX_REQUESTS = 5;
const WINDOW_MS = 10 * 60 * 1000;

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
