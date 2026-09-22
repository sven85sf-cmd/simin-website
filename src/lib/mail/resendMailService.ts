import type { MailMessage, MailSendResult, MailService } from "./types";

const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Produktions-Adapter für den Resend-Mail-Versand.
 *
 * Bewusst per rohem `fetch()` gegen die Resend-HTTP-API implementiert statt
 * über das `resend`-npm-Paket: läuft dadurch identisch in jeder
 * Node-/Serverless-/Edge-Umgebung, ohne zusätzliche Laufzeitabhängigkeit.
 */
export class ResendMailService implements MailService {
  constructor(private readonly apiKey: string) {}

  async send(message: MailMessage): Promise<MailSendResult> {
    try {
      const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: message.from,
          to: [message.to],
          reply_to: message.replyTo,
          subject: message.subject,
          html: message.html,
          text: message.text,
          attachments: message.attachments?.map((attachment) => ({
            filename: attachment.filename,
            content: attachment.content.toString("base64"),
          })),
        }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        return {
          ok: false,
          errorDetail: `Resend-API antwortete mit Status ${response.status}: ${body.slice(0, 300)}`,
        };
      }

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        errorDetail: error instanceof Error ? error.message : "Unbekannter Fehler beim Mailversand.",
      };
    }
  }
}
