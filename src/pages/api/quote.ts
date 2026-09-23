import type { APIRoute } from "astro";
import { emptyQuoteFormData, MAX_FILES, MAX_FILE_SIZE_BYTES, type QuoteFormData } from "@/lib/forms/types";
import { validateQuoteFormData, validateFiles, validateFileSignatures } from "@/lib/forms/validate";
import { isRateLimited } from "@/lib/forms/rateLimit";
import { getFormSubmissionService } from "@/lib/forms/submissionService";
import { company } from "@/config/site";

export const prerender = false;

/** Grobe Obergrenze für die gesamte Anfrage (Text-Felder + Anhänge + Multipart-Overhead). */
const MAX_REQUEST_BYTES = MAX_FILES * MAX_FILE_SIZE_BYTES + 1024 * 1024;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Explizite Origin-Allowlist für /api/quote.
 *
 * Astros eingebaute checkOrigin-Prüfung ist in astro.config.base.mjs
 * deaktiviert, weil sie hinter Wix' Reverse-Proxy/Hosting-Layer gegen
 * `request.url` vergleicht - und dessen Host dort nicht zuverlässig dem
 * öffentlichen Host entspricht, den der Browser als Origin sendet
 * (bestätigt: echte 403 "Cross-site POST form submissions are forbidden"
 * auf der Wix-Preview). Diese Funktion ersetzt den CSRF-/Origin-Schutz
 * vollständig, OHNE jemals gegen request.url zu prüfen - nur gegen eine
 * feste Liste erlaubter, echter Origins.
 */
function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }

  if (url.protocol !== "https:") return false;

  if (url.hostname === "www.gebaeudedienste-simin.de" || url.hostname === "gebaeudedienste-simin.de") {
    return true;
  }

  return url.hostname.endsWith(".wix-site-host.com");
}

/**
 * Äußerster Sicherheitsnetz-try/catch.
 *
 * Ein nackter 500 "Internal Server Error" bedeutet, dass IRGENDEIN
 * ungefangener Fehler die Route verlassen hat, bevor einer der
 * kontrollierten json(...)-Rückgaben unten erreicht wurde - jeder
 * erwartbare Business-/Validierungsfehler wird bereits als JSON
 * behandelt. Dieser äußere Block fängt ausnahmslos alles ab, was sonst
 * unbehandelt durchschlagen würde, und stellt sicher, dass der Besucher
 * NIE einen nackten 500 ohne JSON-Body/ohne verständliche Meldung sieht.
 * Details landen ausschließlich im Server-Log, nie in der Antwort.
 */
export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    // eslint-disable-next-line no-console
    console.info("[quote] request received");

    if (!isAllowedOrigin(request)) {
      return json(403, { ok: false, error: "Ungültige Anfrage-Herkunft." });
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
      return json(415, { ok: false, error: "Ungültiger Content-Type." });
    }

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > MAX_REQUEST_BYTES) {
      return json(413, { ok: false, error: "Die Anfrage ist zu groß." });
    }

    let rateLimitKey = "unknown";
    try {
      rateLimitKey = clientAddress ?? "unknown";
    } catch {
      // clientAddress kann in manchen Umgebungen nicht verfügbar sein.
    }

    if (isRateLimited(rateLimitKey)) {
      return json(429, {
        ok: false,
        error: "Zu viele Anfragen. Bitte versuchen Sie es in einigen Minuten erneut.",
      });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return json(400, { ok: false, error: "Ungültige Formulardaten." });
    }

    // Honeypot: unsichtbares Feld, das nur Bots ausfüllen.
    const honeypot = formData.get("website");
    if (typeof honeypot === "string" && honeypot.trim().length > 0) {
      // Bot-Traffic wird als "Erfolg" quittiert, aber nicht verarbeitet.
      return json(200, { ok: true });
    }

    const data: QuoteFormData = {
      ...emptyQuoteFormData,
      service: String(formData.get("service") ?? "") as QuoteFormData["service"],
      propertyType: String(formData.get("propertyType") ?? "") as QuoteFormData["propertyType"],
      postalCode: String(formData.get("postalCode") ?? ""),
      city: String(formData.get("city") ?? ""),
      description: String(formData.get("description") ?? ""),
      name: String(formData.get("name") ?? ""),
      company: String(formData.get("company") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      privacyAccepted: formData.get("privacyAccepted") === "on" || formData.get("privacyAccepted") === "true",
    };

    const errors = validateQuoteFormData(data);
    if (Object.keys(errors).length > 0) {
      return json(422, { ok: false, error: "Bitte prüfen Sie Ihre Angaben.", fieldErrors: errors });
    }

    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);
    const fileErrors = validateFiles(files);
    if (fileErrors.length > 0) {
      return json(422, { ok: false, error: "Ein oder mehrere Dateien sind ungültig.", fileErrors });
    }

    // Verlässt sich NICHT auf die vom Client gemeldeten MIME-Types/Erweiterungen:
    // prüft die tatsächlichen Datei-Inhalte (Magic Bytes) serverseitig.
    const signatureErrors = await validateFileSignatures(files);
    if (signatureErrors.length > 0) {
      return json(422, { ok: false, error: "Ein oder mehrere Dateien sind ungültig.", fileErrors: signatureErrors });
    }

    // eslint-disable-next-line no-console
    console.info("[quote] validation complete", { fileCount: files.length });

    const submissionService = getFormSubmissionService();
    const result = await submissionService.submit({ data, files });

    if (!result.ok) {
      return json(502, {
        ok: false,
        error:
          result.errorMessage ??
          `Ihre Anfrage konnte gerade nicht versendet werden. Bitte versuchen Sie es erneut oder kontaktieren Sie uns telefonisch unter ${company.phone.display}.`,
      });
    }

    return json(200, { ok: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[quote] ERROR stage=unhandled", error instanceof Error ? error.stack ?? error.message : error);
    return json(500, {
      ok: false,
      error: `Ihre Anfrage konnte gerade nicht übermittelt werden. Bitte versuchen Sie es erneut oder kontaktieren Sie uns telefonisch unter ${company.phone.display}.`,
    });
  }
};
