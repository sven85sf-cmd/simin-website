import {
  WIX_SUBMISSIONS_COLLECTION_ID,
  ATTACHMENT_LINK_SIGNING_SECRET,
  ATTACHMENT_LINK_TTL_HOURS,
} from "astro:env/server";
import type { QuoteFormData } from "@/lib/forms/types";
import { serviceLabel, propertyTypeLabel } from "@/lib/forms/types";
import { sanitizeFilename } from "@/lib/forms/sanitize";
import { insertSubmission } from "@/lib/wix/dataClient";
import type { AttachmentMetadata } from "@/lib/wix/attachmentTypes";
import { createAttachmentToken } from "@/lib/attachmentLink";

/**
 * Orchestriert Wix-native Persistenz für Angebotsanfragen.
 *
 * Die Benachrichtigung an kontakt@gebaeudedienste-simin.de erfolgt über
 * eine im Wix-Dashboard konfigurierte Automation (Trigger: neuer Eintrag
 * in dieser Collection), nicht durch Code in diesem Repository.
 *
 * Wix Data (dataClient.ts, @wix/data + @wix/essentials) wird IMMER
 * benötigt. Wix Media (mediaClient.ts, @wix/media + @wix/essentials) wird
 * NUR per dynamischem import() geladen, und auch dann nur, wenn
 * tatsächlich Dateien vorhanden sind - eine Anfrage ohne Dateien löst
 * @wix/media als Modul nie aus.
 *
 * ATTACHMENT-DATENMODELL (siehe attachmentTypes.ts):
 * Das bisherige CMS-Feld `files` (Multiple Documents) wird NICHT mehr
 * beschrieben - Uploads sind gemischt IMAGE/DOCUMENT, ein reines
 * Dokumente-Feld kann das nicht korrekt abbilden, und eine selbst
 * konstruierte `wix:document://...`-URI für Bilder wäre semantisch falsch.
 * Stattdessen werden Automation-taugliche Primitiv-Felder geschrieben:
 * attachmentMetadata (Array), attachmentsPresent (Boolean),
 * attachmentCount (Number), attachmentNames (Text), attachmentAccessLinks
 * (Text). `attachmentAccessLinks` muss VOR dem produktiven Einsatz
 * einmalig manuell im Wix-Dashboard angelegt werden (siehe
 * Abschlussbericht "MANUAL WIX ACTION REQUIRED") - das bestehende
 * `files`-Feld bleibt in der Collection definiert, wird aber ab sofort
 * nicht mehr befüllt.
 *
 * PRIVATE ATTACHMENT ACCESS: Für jeden erfolgreich hochgeladenen Anhang
 * wird ein signiertes Capability-Token (src/lib/attachmentLink.ts) erzeugt
 * und zu `${publicOrigin}/api/attachment?token=...` zusammengesetzt - NIE
 * die von Wix erzeugte temporäre Download-URL selbst (die lebt nur wenige
 * Minuten und würde in der CMS-Zeile/E-Mail sofort veralten). Der frische
 * Wix-Download-Link wird stattdessen erst beim Klick in
 * src/pages/api/attachment.ts erzeugt.
 */

export interface QuoteSubmissionInput {
  data: QuoteFormData;
  files: File[];
  /**
   * Bereits gegen die Origin-Allowlist geprüfter, öffentlicher Origin
   * (siehe quote.ts, isAllowedOrigin()) - NIE eine interne Worker-/Wix-
   * Host-Adresse. Wird ausschließlich zum Zusammensetzen der
   * Attachment-Access-Links verwendet.
   */
  publicOrigin: string;
}

/**
 * Erzeugt für jeden erfolgreichen Anhang einen signierten Capability-Link
 * und liefert sie als mehrzeiligen Text (`Dateiname: Link`) für das
 * Text-Feld `attachmentAccessLinks`. Fehlt das Signing-Secret, wird die
 * Anfrage NICHT blockiert - es werden lediglich keine Links erzeugt (klar
 * geloggt, kein stilles Erfinden eines Ersatz-Secrets). Schlägt die
 * Token-Erzeugung für EINE Datei fehl, wird nur diese eine Zeile
 * ausgelassen; die übrigen Links und die Kundenanfrage selbst bleiben
 * unberührt (Abschnitt 27).
 */
async function buildAttachmentAccessLinksText(
  attachments: AttachmentMetadata[],
  publicOrigin: string,
): Promise<string> {
  if (attachments.length === 0) return "";

  if (!ATTACHMENT_LINK_SIGNING_SECRET) {
    // eslint-disable-next-line no-console
    console.error("[attachment-link] ERROR stage=missing_signing_secret");
    return "";
  }
  // Eigene, neu deklarierte Konstante: TS engt `ATTACHMENT_LINK_SIGNING_SECRET`
  // selbst (ein `astro:env/server`-Import) innerhalb der Closure unten
  // (`.map(async ...)`) nicht zuverlässig auf `string` ein.
  const signingSecret: string = ATTACHMENT_LINK_SIGNING_SECRET;

  const lines = await Promise.all(
    attachments.map(async (attachment) => {
      try {
        const token = await createAttachmentToken(
          attachment.fileId,
          signingSecret,
          ATTACHMENT_LINK_TTL_HOURS,
        );
        return `${attachment.displayName}: ${publicOrigin}/api/attachment?token=${token}`;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(
          "[attachment-link] ERROR stage=token_creation",
          error instanceof Error ? error.message : error,
        );
        return null;
      }
    }),
  );

  return lines.filter((line): line is string => line !== null).join("\n");
}

export interface QuoteSubmissionOutcome {
  ok: boolean;
  errorDetail?: string;
  errorCode?: "ENV_ERROR" | "WIX_DATA_ERROR";
  /** false, wenn der Nutzer Dateien gewählt hat und mindestens eine davon nicht übertragen werden konnte. */
  attachmentsComplete: boolean;
  /** Sanitizte Originaldateinamen der fehlgeschlagenen Anhänge (für die Frontend-Meldung). */
  failedAttachmentNames: string[];
}

export async function insertQuoteSubmission(
  input: QuoteSubmissionInput,
): Promise<QuoteSubmissionOutcome> {
  const collectionId = WIX_SUBMISSIONS_COLLECTION_ID;
  // eslint-disable-next-line no-console
  console.info("[quote] wix service start", {
    collectionIdPresent: Boolean(collectionId),
    fileCount: input.files.length,
  });

  if (!collectionId) {
    return {
      ok: false,
      errorDetail: "WIX_SUBMISSIONS_COLLECTION_ID ist nicht gesetzt.",
      errorCode: "ENV_ERROR",
      attachmentsComplete: input.files.length === 0,
      failedAttachmentNames: [],
    };
  }

  const successfulAttachments: AttachmentMetadata[] = [];
  const failedAttachmentNames: string[] = [];

  if (input.files.length > 0) {
    // eslint-disable-next-line no-console
    console.info("[quote] media upload start", {
      fileCount: input.files.length,
    });
    const { uploadAndDescribeFile } = await import("@/lib/wix/mediaClient");
    const uploadResults = await Promise.all(
      input.files.map((file) => uploadAndDescribeFile(file)),
    );
    // eslint-disable-next-line no-console
    console.info("[quote] media upload complete", {
      uploaded: uploadResults.filter((r) => r.ok).length,
      failed: uploadResults.filter((r) => !r.ok).length,
    });

    input.files.forEach((file, index) => {
      const result = uploadResults[index];
      if (result.ok && result.metadata) {
        successfulAttachments.push(result.metadata);
      } else {
        failedAttachmentNames.push(sanitizeFilename(file.name));
      }
    });
  }

  const attachmentsComplete = failedAttachmentNames.length === 0;
  const attachmentAccessLinks = await buildAttachmentAccessLinksText(
    successfulAttachments,
    input.publicOrigin,
  );

  const record = {
    service: serviceLabel(input.data.service),
    propertyType: propertyTypeLabel(input.data.propertyType),
    postalCode: input.data.postalCode.trim(),
    city: input.data.city.trim(),
    description: input.data.description.trim(),
    name: input.data.name.trim(),
    company: input.data.company.trim(),
    phone: input.data.phone.trim(),
    email: input.data.email.trim(),
    attachmentMetadata: successfulAttachments,
    attachmentsPresent: successfulAttachments.length > 0,
    attachmentCount: successfulAttachments.length,
    attachmentNames: successfulAttachments.map((a) => a.displayName).join(", "),
    attachmentAccessLinks,
    // Echter Date-Wert statt ISO-String: Wix Data akzeptiert für
    // "Datum und Uhrzeit"-Felder nativ ein JS-Date-Objekt (bestätigt in
    // den installierten @wix/wix-data-items-sdk-Typdefinitionen, u. a.
    // `_createdDate`/`_updatedDate`/`eventTime` sind dort selbst als
    // `Date` typisiert, und der interne `Descendable<T>`-Typ behandelt
    // `Date` explizit als eigenen Werttyp). Ein ISO-String wurde im CMS
    // fälschlich als Text statt als Datum interpretiert (Warnsymbol).
    submittedAt: new Date(),
  };

  try {
    // eslint-disable-next-line no-console
    console.info("[quote] cms insert start");
    await insertSubmission(collectionId, record);
    // eslint-disable-next-line no-console
    console.info("[quote] cms insert complete");
    return { ok: true, attachmentsComplete, failedAttachmentNames };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[quote] ERROR stage=cms_insert",
      error instanceof Error ? error.message : error,
    );
    return {
      ok: false,
      errorDetail:
        error instanceof Error
          ? error.message
          : "Unbekannter Fehler beim Speichern in Wix Data.",
      errorCode: "WIX_DATA_ERROR",
      attachmentsComplete,
      failedAttachmentNames,
    };
  }
}
