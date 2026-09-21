/**
 * Zentraler Helper für interne Pfade (Links & public-Assets).
 *
 * Löst den Astro-Base-Pfad (`import.meta.env.BASE_URL`) korrekt auf:
 * - Produktion (base "/"): kein Effekt, Pfade bleiben unverändert.
 * - GitHub-Pages-Preview (base z. B. "/simin-website"): Pfad wird mit dem
 *   Base-Präfix versehen.
 *
 * Externe URLs, Anker (#...), mailto:/tel:-Links werden unverändert
 * zurückgegeben.
 */
export function withBase(path: string): string {
  if (
    path.startsWith("#") ||
    path.startsWith("mailto:") ||
    path.startsWith("tel:") ||
    /^[a-z][a-z0-9+.-]*:\/\//i.test(path)
  ) {
    return path;
  }

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;

  return `${base}${normalized}` || "/";
}

/**
 * true auf der GitHub-Pages-Vorschau (PREVIEW_BASE_PATH gesetzt), false in
 * der echten Produktion (base "/"). Einzige Quelle der Wahrheit für die
 * Preview-/Production-Unterscheidung (robots-Meta, robots.txt) - keine
 * eigene, zweite Environment-Prüfung an anderer Stelle einführen.
 */
export function isPreviewBuild(): boolean {
  return import.meta.env.BASE_URL !== "/";
}
