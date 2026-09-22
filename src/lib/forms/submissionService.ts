import type { QuoteFormData } from "./types";
import { buildConfirmationEmail, buildQuoteEmail } from "./emailTemplate";
import { sanitizeFilename, sanitizeHeaderValue } from "./sanitize";
import { getMailService } from "@/lib/mail/getMailService";
import type { MailAttachment } from "@/lib/mail/types";
import { company } from "@/config/site";

export interface QuoteSubmissionPayload {
  data: QuoteFormData;
  files: File[];
}

export interface SubmissionResult {
  ok: boolean;
  errorMessage?: string;
}

/**
 * Adapter-Schnittstelle für den Versand von Angebotsanfragen. Die konkrete
 * Mail-Zustellung ist in `@/lib/mail` gekapselt (siehe `getMailService()`);
 * diese Klasse baut nur die Anfrage-E-Mail und entscheidet über
 * Erfolg/Fehler.
 */
export interface FormSubmissionService {
  submit(payload: QuoteSubmissionPayload): Promise<SubmissionResult>;
}

function recipientAddress(): string {
  return process.env.QUOTE_REQUEST_TO_EMAIL || company.email.display;
}

async function toAttachment(file: File): Promise<MailAttachment> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    filename: sanitizeFilename(file.name),
    contentType: file.type || "application/octet-stream",
    content: buffer,
  };
}

class QuoteMailSubmissionService implements FormSubmissionService {
  async submit(payload: QuoteSubmissionPayload): Promise<SubmissionResult> {
    const { service, reason } = getMailService();

    if (!service) {
      // eslint-disable-next-line no-console
      console.error("[QuoteMailSubmissionService] Mailversand nicht konfiguriert:", reason);
      return {
        ok: false,
        errorMessage:
          "Das Formularbackend ist noch nicht konfiguriert. Bitte MAIL_PROVIDER/RESEND_API_KEY/MAIL_FROM setzen (siehe .env.example).",
      };
    }

    const mailFrom = process.env.MAIL_FROM;
    if (!mailFrom) {
      // eslint-disable-next-line no-console
      console.error("[QuoteMailSubmissionService] MAIL_FROM ist nicht gesetzt.");
      return {
        ok: false,
        errorMessage: "Das Formularbackend ist noch nicht vollständig konfiguriert (MAIL_FROM fehlt).",
      };
    }

    const attachments = await Promise.all(payload.files.map(toAttachment));
    const { subject, html, text } = buildQuoteEmail(
      payload.data,
      attachments.map((a) => a.filename),
    );

    const result = await service.send({
      from: mailFrom,
      to: recipientAddress(),
      replyTo: sanitizeHeaderValue(payload.data.email),
      subject,
      html,
      text,
      attachments,
    });

    if (!result.ok) {
      // eslint-disable-next-line no-console
      console.error("[QuoteMailSubmissionService] Mailversand fehlgeschlagen:", result.errorDetail);
      return {
        ok: false,
        errorMessage: `Ihre Anfrage konnte gerade nicht versendet werden. Bitte versuchen Sie es erneut oder kontaktieren Sie uns telefonisch unter ${company.phone.display}.`,
      };
    }

    if (process.env.QUOTE_CONFIRMATION_EMAIL_ENABLED === "true") {
      const confirmation = buildConfirmationEmail();
      const confirmationResult = await service.send({
        from: mailFrom,
        to: sanitizeHeaderValue(payload.data.email),
        subject: confirmation.subject,
        html: confirmation.html,
        text: confirmation.text,
      });
      if (!confirmationResult.ok) {
        // Die Anfrage an SIMIN ist bereits erfolgreich zugestellt; eine
        // fehlgeschlagene Empfangsbestätigung an den Interessenten ist kein
        // Grund, dem Besucher einen Fehler anzuzeigen (Priorität: Anfrage an SIMIN).
        // eslint-disable-next-line no-console
        console.error(
          "[QuoteMailSubmissionService] Empfangsbestätigung an Interessenten fehlgeschlagen:",
          confirmationResult.errorDetail,
        );
      }
    }

    return { ok: true };
  }
}

export function getFormSubmissionService(): FormSubmissionService {
  return new QuoteMailSubmissionService();
}
