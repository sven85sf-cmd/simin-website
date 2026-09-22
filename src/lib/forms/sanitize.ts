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
