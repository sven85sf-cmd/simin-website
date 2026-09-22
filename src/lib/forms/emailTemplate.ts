import { company } from "@/config/site";
import type { QuoteFormData } from "./types";
import { propertyTypeLabel, serviceLabel } from "./types";
import { escapeHtml, sanitizeHeaderValue } from "./sanitize";

export interface QuoteEmailContent {
  subject: string;
  html: string;
  text: string;
}

function formatTimestamp(): string {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(new Date());
}

function fallback(value: string): string {
  return value.trim().length > 0 ? value.trim() : "–";
}

export function buildQuoteEmail(data: QuoteFormData, attachmentNames: string[]): QuoteEmailContent {
  const service = serviceLabel(data.service);
  const propertyType = propertyTypeLabel(data.propertyType);
  const name = fallback(data.name);
  const company_ = fallback(data.company);
  const location = fallback(`${data.postalCode} ${data.city}`.trim());
  const email = fallback(data.email);
  const phone = fallback(data.phone);
  const description = fallback(data.description);
  const attachmentsText = attachmentNames.length > 0 ? attachmentNames.join(", ") : "keine";
  const timestamp = formatTimestamp();

  const subject = sanitizeHeaderValue(`Neue Website-Anfrage – ${service} – ${name}`);

  const text = [
    "NEUE ANFRAGE ÜBER GEBAEUDEDIENSTE-SIMIN.DE",
    "",
    "Leistung:",
    service,
    "",
    "Objektart:",
    propertyType,
    "",
    "Standort:",
    location,
    "",
    "Interessent:",
    name,
    "",
    "Firma / Hausverwaltung:",
    company_,
    "",
    "E-Mail:",
    email,
    "",
    "Telefon:",
    phone,
    "",
    "Nachricht / Objektbeschreibung:",
    description,
    "",
    "Anhänge:",
    attachmentsText,
    "",
    "Übermittelt:",
    timestamp,
  ].join("\n");

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:6px 12px;color:#5a6b78;font-family:Arial,Helvetica,sans-serif;font-size:13px;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:6px 12px;color:#07354a;font-family:Arial,Helvetica,sans-serif;font-size:14px;vertical-align:top;">${escapeHtml(value).replace(/\n/g, "<br>")}</td>
    </tr>`;

  const html = `<!DOCTYPE html>
<html lang="de">
  <body style="margin:0;padding:0;background:#f4f6f7;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f7;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
            <tr>
              <td style="background:#07354a;padding:20px 24px;">
                <span style="color:#ffffff;font-size:16px;font-weight:bold;letter-spacing:0.5px;">GEBÄUDEDIENSTE SIMIN</span>
                <br>
                <span style="color:#f3941f;font-size:13px;">Neue Anfrage über die Website</span>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px 4px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${row("Leistung", service)}
                  ${row("Objektart", propertyType)}
                  ${row("Standort", location)}
                  ${row("Interessent", name)}
                  ${row("Firma / Hausverwaltung", company_)}
                  ${row("E-Mail", email)}
                  ${row("Telefon", phone)}
                  ${row("Nachricht", description)}
                  ${row("Anhänge", attachmentsText)}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 24px 20px;color:#8a97a1;font-family:Arial,Helvetica,sans-serif;font-size:12px;">
                Übermittelt: ${escapeHtml(timestamp)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}

export interface ConfirmationEmailContent {
  subject: string;
  html: string;
  text: string;
}

/** Sachliche Empfangsbestätigung an den Interessenten (Abschnitt 26 – optional, siehe QUOTE_CONFIRMATION_EMAIL_ENABLED). */
export function buildConfirmationEmail(): ConfirmationEmailContent {
  const subject = "Ihre Anfrage bei Gebäudedienste SIMIN ist eingegangen";

  const text = [
    `Vielen Dank für Ihre Anfrage bei ${company.name}.`,
    "Ihre Anfrage ist bei uns eingegangen. Wir melden uns bei Ihnen.",
    "",
    `${company.name}`,
    `Telefon: ${company.phone.display}`,
    `E-Mail: ${company.email.display}`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="de">
  <body style="margin:0;padding:0;background:#f4f6f7;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f7;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
            <tr>
              <td style="background:#07354a;padding:20px 24px;">
                <span style="color:#ffffff;font-size:16px;font-weight:bold;letter-spacing:0.5px;">GEBÄUDEDIENSTE SIMIN</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;color:#07354a;font-size:14px;line-height:1.6;">
                <p>Vielen Dank für Ihre Anfrage bei ${escapeHtml(company.name)}.</p>
                <p>Ihre Anfrage ist bei uns eingegangen. Wir melden uns bei Ihnen.</p>
                <p style="margin-top:24px;color:#5a6b78;font-size:13px;">
                  ${escapeHtml(company.name)}<br>
                  Telefon: ${escapeHtml(company.phone.display)}<br>
                  E-Mail: ${escapeHtml(company.email.display)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
