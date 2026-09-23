import { WIX_SUBMISSIONS_COLLECTION_ID } from "astro:env/server";
import type { QuoteFormData } from "@/lib/forms/types";
import { serviceLabel, propertyTypeLabel } from "@/lib/forms/types";
import { sanitizeFilename } from "@/lib/forms/sanitize";
import { insertSubmission } from "@/lib/wix/dataClient";
import type { AttachmentMetadata } from "@/lib/wix/attachmentTypes";

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
 * ATTACHMENT-DATENMODELL (Neubau, siehe attachmentTypes.ts):
 * Das bisherige CMS-Feld `files` (Multiple Documents) wird NICHT mehr
 * beschrieben - Uploads sind gemischt IMAGE/DOCUMENT, ein reines
 * Dokumente-Feld kann das nicht korrekt abbilden, und eine selbst
 * konstruierte `wix:document://...`-URI für Bilder wäre semantisch falsch.
 * Stattdessen werden Automation-taugliche Primitiv-Felder geschrieben:
 * attachmentMetadata (Array), attachmentsPresent (Boolean),
 * attachmentCount (Number), attachmentNames (Text). Diese Felder müssen
 * VOR dem produktiven Einsatz einmalig manuell im Wix-Dashboard angelegt
 * werden (siehe Abschlussbericht "MANUAL WIX ACTION REQUIRED") - das
 * bestehende `files`-Feld bleibt in der Collection definiert, wird aber
 * ab sofort nicht mehr befüllt.
 */

export interface QuoteSubmissionInput {
  data: QuoteFormData;
  files: File[];
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
    submittedAt: new Date().toISOString(),
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
