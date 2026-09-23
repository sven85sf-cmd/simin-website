import { WIX_SUBMISSIONS_COLLECTION_ID } from "astro:env/server";
import type { QuoteFormData } from "@/lib/forms/types";
import { serviceLabel, propertyTypeLabel } from "@/lib/forms/types";
import { sanitizeFilename } from "@/lib/forms/sanitize";
import { insertSubmission } from "@/lib/wix/dataClient";

/**
 * Orchestriert Wix-native Persistenz für Angebotsanfragen.
 *
 * Ersetzt die vorherige Resend-Mailarchitektur vollständig: Anfragen werden
 * nicht mehr per E-Mail-API versendet, sondern als Datensatz in einer
 * Wix-Data-Collection abgelegt. Die Benachrichtigung an
 * kontakt@gebaeudedienste-simin.de erfolgt über eine im Wix-Dashboard
 * konfigurierte Automation (Trigger: neuer Eintrag in dieser Collection),
 * nicht durch Code in diesem Repository.
 *
 * Wix Data (dataClient.ts, @wix/data + @wix/essentials) wird IMMER
 * benötigt. Wix Media (mediaClient.ts, @wix/media + @wix/essentials) wird
 * NUR per dynamischem import() geladen, und auch dann nur, wenn
 * tatsächlich Dateien vorhanden sind - eine Anfrage ohne Dateien löst
 * @wix/media als Modul nie aus.
 */

export interface QuoteSubmissionInput {
  data: QuoteFormData;
  files: File[];
}

export interface QuoteSubmissionOutcome {
  ok: boolean;
  errorDetail?: string;
  errorCode?: "ENV_ERROR" | "WIX_DATA_ERROR";
  /** Dateien, die trotz gültiger Validierung nicht hochgeladen werden konnten. */
  failedUploads: string[];
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
      failedUploads: [],
    };
  }

  const uploadedFiles: string[] = [];
  const failedUploads: string[] = [];

  if (input.files.length > 0) {
    // eslint-disable-next-line no-console
    console.info("[quote] media upload start", {
      fileCount: input.files.length,
    });
    const { uploadFile } = await import("@/lib/wix/mediaClient");
    const uploadResults = await Promise.all(
      input.files.map((file) => uploadFile(file)),
    );
    // eslint-disable-next-line no-console
    console.info("[quote] media upload complete", {
      uploaded: uploadResults.filter(Boolean).length,
      failed: uploadResults.filter((r) => !r).length,
    });

    input.files.forEach((file, index) => {
      const result = uploadResults[index];
      if (result) {
        uploadedFiles.push(result);
      } else {
        failedUploads.push(sanitizeFilename(file.name));
      }
    });
  }

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
    files: uploadedFiles,
    submittedAt: new Date().toISOString(),
  };

  try {
    // eslint-disable-next-line no-console
    console.info("[quote] cms insert start");
    await insertSubmission(collectionId, record);
    // eslint-disable-next-line no-console
    console.info("[quote] cms insert complete");
    return { ok: true, failedUploads };
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
      failedUploads,
    };
  }
}
