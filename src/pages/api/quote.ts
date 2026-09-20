import type { APIRoute } from "astro";
import { emptyQuoteFormData, type QuoteFormData } from "@/lib/forms/types";
import { validateQuoteFormData, validateFiles } from "@/lib/forms/validate";
import { isRateLimited } from "@/lib/forms/rateLimit";
import { getFormSubmissionService } from "@/lib/forms/submissionService";

export const prerender = false;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // z. B. direkte serverseitige Tests / manche Clients ohne Origin-Header
  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    return originUrl.host === requestUrl.host;
  } catch {
    return false;
  }
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!isSameOrigin(request)) {
    return json(403, { ok: false, error: "Ungültige Anfrage-Herkunft." });
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

  const submissionService = getFormSubmissionService();
  const result = await submissionService.submit({ data, files });

  if (!result.ok) {
    return json(502, {
      ok: false,
      error:
        result.errorMessage ??
        "Ihre Anfrage konnte nicht übermittelt werden. Bitte versuchen Sie es später erneut oder rufen Sie uns an.",
    });
  }

  return json(200, { ok: true });
};
