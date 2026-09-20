import type { QuoteFormData } from "./types";

export interface QuoteSubmissionPayload {
  data: QuoteFormData;
  files: File[];
}

export interface SubmissionResult {
  ok: boolean;
  errorMessage?: string;
}

/**
 * Adapter-Schnittstelle für den Versand von Angebotsanfragen.
 *
 * Es ist bewusst noch KEIN echter Maildienst/Backend konfiguriert (keine
 * erfundenen API-Keys). Für den Produktivbetrieb muss eine konkrete
 * Implementierung (z. B. SMTP-Versand, CRM-API) bereitgestellt und in
 * `getFormSubmissionService()` verdrahtet werden. Siehe .env.example und
 * README für die dafür nötige Konfiguration.
 */
export interface FormSubmissionService {
  submit(payload: QuoteSubmissionPayload): Promise<SubmissionResult>;
}

class MockFormSubmissionService implements FormSubmissionService {
  async submit(payload: QuoteSubmissionPayload): Promise<SubmissionResult> {
    // eslint-disable-next-line no-console
    console.info("[MockFormSubmissionService] Angebotsanfrage empfangen (nicht versendet):", {
      service: payload.data.service,
      propertyType: payload.data.propertyType,
      postalCode: payload.data.postalCode,
      city: payload.data.city,
      email: payload.data.email,
      fileCount: payload.files.length,
    });
    return { ok: true };
  }
}

/**
 * Platzhalter für eine echte Produktions-Implementierung. Noch nicht
 * konfiguriert – siehe .env.example (SMTP_*). Wird aktuell nicht verwendet,
 * solange keine echten Zugangsdaten hinterlegt sind.
 */
class UnconfiguredFormSubmissionService implements FormSubmissionService {
  async submit(): Promise<SubmissionResult> {
    return {
      ok: false,
      errorMessage:
        "Das Formularbackend ist noch nicht konfiguriert. Bitte SMTP_* Umgebungsvariablen setzen (siehe .env.example).",
    };
  }
}

export function getFormSubmissionService(): FormSubmissionService {
  const smtpConfigured = Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD,
  );

  if (smtpConfigured) {
    // TODO(externe Konfiguration): Echten SMTP-/Mail-Adapter implementieren
    // und hier zurückgeben, sobald ein Maildienst verbindlich feststeht.
    return new UnconfiguredFormSubmissionService();
  }

  return new MockFormSubmissionService();
}
