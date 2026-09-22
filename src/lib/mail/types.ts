/**
 * Provider-agnostische Mail-Versand-Abstraktion.
 *
 * Der Formular-Code (submissionService.ts) kennt nur dieses Interface, nie
 * einen konkreten Anbieter. Ein Wechsel des Mailproviders (oder des
 * Hosters) betrifft ausschließlich `getMailService()` und den jeweiligen
 * Adapter in diesem Ordner.
 */

export interface MailAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
}

export interface MailMessage {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  attachments?: MailAttachment[];
}

export interface MailSendResult {
  ok: boolean;
  /** Nur für internes Logging. Niemals direkt an den Website-Besucher ausgeben. */
  errorDetail?: string;
}

export interface MailService {
  send(message: MailMessage): Promise<MailSendResult>;
}
