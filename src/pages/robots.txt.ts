import type { APIRoute } from "astro";
import { company } from "@/config/site";
import { isPreviewBuild } from "@/lib/path";

export const prerender = true;

/**
 * Environment-abhängiges robots.txt:
 * - GitHub-Pages-Vorschau (PREVIEW_BASE_PATH gesetzt): komplett gesperrt,
 *   damit die Entwicklungs-/Vorschau-Umgebung nicht indexiert wird.
 * - Produktion (base "/"): normal indexierbar, verweist auf die
 *   Produktions-Sitemap.
 *
 * Siehe `isPreviewBuild()` (src/lib/path.ts) - dieselbe Quelle der Wahrheit
 * wie das automatische noindex in BaseLayout.astro.
 */
export const GET: APIRoute = () => {
  const body = isPreviewBuild()
    ? "User-agent: *\nDisallow: /\n"
    : `User-agent: *\nAllow: /\n\nSitemap: ${new URL("/sitemap.xml", company.url).toString()}\n`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
