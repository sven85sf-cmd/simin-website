import type { MailMessage, MailSendResult, MailService } from "./types";

/**
 * Reiner Entwicklungs-Adapter: protokolliert eine Anfrage in die
 * Server-Konsole, statt eine echte E-Mail zu versenden.
 *
 * Wird ausschließlich verwendet, wenn explizit `MAIL_PROVIDER=dev-log`
 * gesetzt ist, UND niemals in einem Production-Build (siehe
 * `getMailService()`) – es gibt keinen automatischen Mock-Fallback.
 */
export class DevLogMailService implements MailService {
  async send(message: MailMessage): Promise<MailSendResult> {
    // eslint-disable-next-line no-console
    console.info("[DevLogMailService] E-Mail würde versendet (kein echter Versand):", {
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      attachmentCount: message.attachments?.length ?? 0,
    });
    return { ok: true };
  }
}
