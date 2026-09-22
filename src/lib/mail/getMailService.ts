import type { MailService } from "./types";
import { ResendMailService } from "./resendMailService";
import { DevLogMailService } from "./devLogMailService";

export interface MailServiceResolution {
  service: MailService | null;
  /** Nur für internes Logging, falls `service` null ist. */
  reason?: string;
}

/**
 * Liest die Mailprovider-Konfiguration ausschließlich aus Environment
 * Variables (siehe .env.example) und liefert den passenden Adapter.
 *
 * Liefert bei fehlender/unvollständiger Konfiguration `service: null` statt
 * eines Mocks – der Aufrufer (submissionService.ts) muss diesen Fall dann
 * als "nicht konfiguriert" behandeln, nie als Erfolg.
 */
export function getMailService(): MailServiceResolution {
  const provider = process.env.MAIL_PROVIDER;
  const isProductionBuild = import.meta.env.PROD;

  if (provider === "dev-log") {
    if (isProductionBuild) {
      return {
        service: null,
        reason: "MAIL_PROVIDER=dev-log ist in einem Production-Build nicht zulässig.",
      };
    }
    return { service: new DevLogMailService() };
  }

  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return { service: null, reason: "RESEND_API_KEY ist nicht gesetzt." };
    }
    return { service: new ResendMailService(apiKey) };
  }

  if (!provider) {
    return { service: null, reason: "MAIL_PROVIDER ist nicht gesetzt." };
  }

  return { service: null, reason: `Unbekannter MAIL_PROVIDER "${provider}".` };
}
