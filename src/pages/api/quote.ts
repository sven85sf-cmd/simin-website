import type { APIContext, APIRoute } from "astro";
import {
  emptyQuoteFormData,
  MAX_FILES,
  MAX_FILE_SIZE_BYTES,
  type QuoteFormData,
} from "@/lib/forms/types";
import {
  validateQuoteFormData,
  validateFiles,
  validateFileSignatures,
} from "@/lib/forms/validate";
import { isRateLimited } from "@/lib/forms/rateLimit";
import { company } from "@/config/site";

export const prerender = false;

/** Grobe Obergrenze für die gesamte Anfrage (Text-Felder + Anhänge + Multipart-Overhead). */
const MAX_REQUEST_BYTES = MAX_FILES * MAX_FILE_SIZE_BYTES + 1024 * 1024;

type ErrorCode =
  | "ORIGIN_REJECTED"
  | "CONTENT_TYPE_ERROR"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "FORM_PARSE_ERROR"
  | "VALIDATION_ERROR"
  | "FILE_VALIDATION_ERROR"
  | "WIX_MODULE_IMPORT_ERROR"
  | "WIX_DATA_ERROR"
  | "WIX_MEDIA_ERROR"
  | "ENV_ERROR"
  | "RUNTIME_CONTEXT_ERROR";

function json(
  status: number,
  body: { ok: boolean; error?: string; code?: ErrorCode } & Record<
    string,
    unknown
  >,
) {
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

  if (
    url.hostname === "www.gebaeudedienste-simin.de" ||
    url.hostname === "gebaeudedienste-simin.de"
  ) {
    return true;
  }

  return url.hostname.endsWith(".wix-site-host.com");
}

/**
 * Rate-Limit-Schlüssel ausschließlich aus Request-Headern, NIEMALS aus
 * `context.clientAddress`.
 *
 * `context.clientAddress` ist in Astro eine GETTER-Eigenschaft
 * (node_modules/astro/dist/core/render-context.js, `getClientAddress()`)
 * und wirft dort explizit einen `AstroError`, wenn der aktive Adapter
 * (`pipeline.adapterName`) gesetzt ist, aber selbst keine Client-Adresse
 * bereitstellt. Wird `clientAddress` direkt in der Funktionssignatur
 * destrukturiert (`async ({ request, clientAddress }) => { try { ... } }`),
 * wertet JavaScript diese Destrukturierung aus, BEVOR der Funktionsbody -
 * und damit jeder try/catch darin - überhaupt erreicht wird. Ein dabei
 * ausgelöster Fehler verlässt die Route ungefangen und erzeugt exakt den
 * beobachteten nackten 500 "Internal Server Error", unabhängig davon, wie
 * robust der Code IM Handler-Body abgesichert ist.
 *
 * Rate Limiting ist kein Authentifizierungsmechanismus - der eigentliche
 * CSRF-/Origin-Schutz bleibt separat über isAllowedOrigin() bestehen.
 * Deshalb ist es unproblematisch, hier auf clientseitig grundsätzlich
 * beeinflussbare Header zurückzugreifen.
 */
function getRateLimitKey(request: Request): string {
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  return "unknown";
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
 *
 * WICHTIG: `context` wird NICHT destrukturiert (kein
 * `{ request, clientAddress }` in der Signatur) - siehe getRateLimitKey()
 * oben. `request` wird erst INNERHALB des try-Blocks aus `context`
 * gelesen (einfacher Property-Zugriff auf eine normale Eigenschaft, kein
 * werfender Getter).
 */
export const POST: APIRoute = async (context: APIContext) => {
  try {
    const { request } = context;

    // eslint-disable-next-line no-console
    console.info("[quote] request received");

    if (!isAllowedOrigin(request)) {
      return json(403, {
        ok: false,
        error: "Ungültige Anfrage-Herkunft.",
        code: "ORIGIN_REJECTED",
      });
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
      return json(415, {
        ok: false,
        error: "Ungültiger Content-Type.",
        code: "CONTENT_TYPE_ERROR",
      });
    }

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > MAX_REQUEST_BYTES) {
      return json(413, {
        ok: false,
        error: "Die Anfrage ist zu groß.",
        code: "PAYLOAD_TOO_LARGE",
      });
    }

    if (isRateLimited(getRateLimitKey(request))) {
      return json(429, {
        ok: false,
        error:
          "Zu viele Anfragen. Bitte versuchen Sie es in einigen Minuten erneut.",
        code: "RATE_LIMITED",
      });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return json(400, {
        ok: false,
        error: "Ungültige Formulardaten.",
        code: "FORM_PARSE_ERROR",
      });
    }

    // Honeypot: unsichtbares Feld, das nur Bots ausfüllen.
    const honeypot = formData.get("website");
    if (typeof honeypot === "string" && honeypot.trim().length > 0) {
      // Bot-Traffic wird als "Erfolg" quittiert, aber nicht verarbeitet.
      return json(200, { ok: true });
    }

    const data: QuoteFormData = {
      ...emptyQuoteFormData,
      service: String(
        formData.get("service") ?? "",
      ) as QuoteFormData["service"],
      propertyType: String(
        formData.get("propertyType") ?? "",
      ) as QuoteFormData["propertyType"],
      postalCode: String(formData.get("postalCode") ?? ""),
      city: String(formData.get("city") ?? ""),
      description: String(formData.get("description") ?? ""),
      name: String(formData.get("name") ?? ""),
      company: String(formData.get("company") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      privacyAccepted:
        formData.get("privacyAccepted") === "on" ||
        formData.get("privacyAccepted") === "true",
    };

    const errors = validateQuoteFormData(data);
    if (Object.keys(errors).length > 0) {
      return json(422, {
        ok: false,
        error: "Bitte prüfen Sie Ihre Angaben.",
        code: "VALIDATION_ERROR",
        fieldErrors: errors,
      });
    }

    const files = formData
      .getAll("files")
      .filter(
        (entry): entry is File => entry instanceof File && entry.size > 0,
      );
    const fileErrors = validateFiles(files);
    if (fileErrors.length > 0) {
      return json(422, {
        ok: false,
        error: "Ein oder mehrere Dateien sind ungültig.",
        code: "FILE_VALIDATION_ERROR",
        fileErrors,
      });
    }

    // Verlässt sich NICHT auf die vom Client gemeldeten MIME-Types/Erweiterungen:
    // prüft die tatsächlichen Datei-Inhalte (Magic Bytes) serverseitig.
    const signatureErrors = await validateFileSignatures(files);
    if (signatureErrors.length > 0) {
      return json(422, {
        ok: false,
        error: "Ein oder mehrere Dateien sind ungültig.",
        code: "FILE_VALIDATION_ERROR",
        fileErrors: signatureErrors,
      });
    }

    // eslint-disable-next-line no-console
    console.info("[quote] validation complete", { fileCount: files.length });

    // Die Wix-SDK-Persistenzschicht (@wix/data/@wix/media/@wix/essentials)
    // wird bewusst NICHT statisch am Modulkopf importiert, sondern erst
    // hier, nach erfolgreicher Origin-/Content-Type-/Validierungsprüfung,
    // dynamisch geladen. Ein Fehler beim Laden dieser Module (Bundling-,
    // Kontext- oder Kompatibilitätsproblem) würde bei einem statischen
    // Import bereits beim Laden der Route selbst auftreten - außerhalb
    // jedes try/catch dieser Funktion. Als dynamischer import() INNERHALB
    // dieses try-Blocks wird ein solcher Fehler garantiert vom
    // umgebenden catch unten aufgefangen.
    // eslint-disable-next-line no-console
    console.info("[quote] stage=wix_module_import_start");
    let getFormSubmissionService: typeof import("@/lib/forms/submissionService").getFormSubmissionService;
    try {
      ({ getFormSubmissionService } =
        await import("@/lib/forms/submissionService"));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        "[quote] ERROR stage=wix_module_import",
        error instanceof Error ? error.message : error,
      );
      return json(502, {
        ok: false,
        error: `Ihre Anfrage konnte gerade nicht übermittelt werden. Bitte versuchen Sie es erneut oder kontaktieren Sie uns telefonisch unter ${company.phone.display}.`,
        code: "WIX_MODULE_IMPORT_ERROR",
      });
    }
    // eslint-disable-next-line no-console
    console.info("[quote] stage=wix_module_import_ok");

    const submissionService = getFormSubmissionService();
    const result = await submissionService.submit({ data, files });

    if (!result.ok) {
      return json(502, {
        ok: false,
        error:
          result.errorMessage ??
          `Ihre Anfrage konnte gerade nicht übermittelt werden. Bitte versuchen Sie es erneut oder kontaktieren Sie uns telefonisch unter ${company.phone.display}.`,
        code: result.errorCode ?? "WIX_DATA_ERROR",
      });
    }

    return json(200, { ok: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[quote] ERROR stage=unhandled",
      error instanceof Error ? (error.stack ?? error.message) : error,
    );
    return json(500, {
      ok: false,
      error: `Ihre Anfrage konnte gerade nicht übermittelt werden. Bitte versuchen Sie es erneut oder kontaktieren Sie uns telefonisch unter ${company.phone.display}.`,
      code: "RUNTIME_CONTEXT_ERROR",
    });
  }
};
