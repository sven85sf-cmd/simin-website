/** Escaped Text zur sicheren Verwendung innerhalb von HTML-Mail-Inhalten. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Entfernt CR/LF und sonstige Steuerzeichen aus Werten, die in E-Mail-Header
 * (Subject, Reply-To, Von-Namen) landen, um Header-Injection zu verhindern.
 */
export function sanitizeHeaderValue(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\r\n\x00-\x1f]/g, " ").trim();
}

/**
 * Reduziert einen hochgeladenen Dateinamen auf sichere Zeichen und eine
 * begrenzte Länge, ohne die Dateiendung zu verändern (die selbst bereits
 * separat gegen eine Allowlist geprüft wird).
 */
export function sanitizeFilename(filename: string): string {
  const withoutPath = filename.replace(/^.*[/\\]/, "");
  // eslint-disable-next-line no-control-regex
  const withoutControlChars = withoutPath.replace(/[\x00-\x1f]/g, "");
  const safeChars = withoutControlChars.replace(/[^a-zA-Z0-9äöüÄÖÜß _.-]/g, "_");
  const trimmed = safeChars.trim() || "datei";
  return trimmed.length > 120 ? trimmed.slice(-120) : trimmed;
}
