import type { QuoteFormData } from "./types";
import { insertQuoteSubmission } from "@/lib/wix/submissionsRepository";
import { company } from "@/config/site";

export interface QuoteSubmissionPayload {
  data: QuoteFormData;
  files: File[];
  /** Bereits gegen die Origin-Allowlist geprüfter, öffentlicher Origin (siehe quote.ts). */
  publicOrigin: string;
}

export interface SubmissionResult {
  ok: boolean;
  errorMessage?: string;
  errorCode?: "WIX_DATA_ERROR" | "WIX_MEDIA_ERROR" | "ENV_ERROR";
  /** false, wenn der Nutzer Dateien gewählt hat und mindestens eine davon nicht übertragen werden konnte. */
  attachmentsComplete: boolean;
  failedAttachmentNames: string[];
}

/**
 * Adapter-Schnittstelle für die Verarbeitung von Angebotsanfragen.
 *
 * Die eigentliche Persistenz liegt in `@/lib/wix/submissionsRepository`
 * (Wix Data + Wix Media). Die Benachrichtigung an SIMIN erfolgt über eine
 * im Wix-Dashboard konfigurierte Automation, ausgelöst durch den neuen
 * Data-Item – nicht durch Mailversand aus diesem Code.
 */
export interface FormSubmissionService {
  submit(payload: QuoteSubmissionPayload): Promise<SubmissionResult>;
}

class WixDataSubmissionService implements FormSubmissionService {
  async submit(payload: QuoteSubmissionPayload): Promise<SubmissionResult> {
    const result = await insertQuoteSubmission(payload);

    if (!result.ok) {
      // eslint-disable-next-line no-console
      console.error(
        "[WixDataSubmissionService] Anfrage konnte nicht in Wix Data gespeichert werden:",
        result.errorDetail,
      );
      return {
        ok: false,
        errorMessage: `Ihre Anfrage konnte gerade nicht übermittelt werden. Bitte versuchen Sie es erneut oder kontaktieren Sie uns telefonisch unter ${company.phone.display}.`,
        errorCode: result.errorCode,
        attachmentsComplete: result.attachmentsComplete,
        failedAttachmentNames: result.failedAttachmentNames,
      };
    }

    if (result.failedAttachmentNames.length > 0) {
      // eslint-disable-next-line no-console
      console.error(
        "[WixDataSubmissionService] Anfrage gespeichert, aber einzelne Dateien konnten nicht übertragen werden:",
        result.failedAttachmentNames,
      );
    }

    return {
      ok: true,
      attachmentsComplete: result.attachmentsComplete,
      failedAttachmentNames: result.failedAttachmentNames,
    };
  }
}

export function getFormSubmissionService(): FormSubmissionService {
  return new WixDataSubmissionService();
}
