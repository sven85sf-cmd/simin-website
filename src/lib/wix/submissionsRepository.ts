import { items } from "@wix/data";
import { files as mediaFiles } from "@wix/media";
import { auth } from "@wix/essentials";

const { elevate } = auth;
import type { QuoteFormData } from "@/lib/forms/types";
import { serviceLabel, propertyTypeLabel } from "@/lib/forms/types";
import { sanitizeFilename } from "@/lib/forms/sanitize";

/**
 * Wix-native Persistenzschicht für Angebotsanfragen.
 *
 * Ersetzt die vorherige Resend-Mailarchitektur vollständig: Anfragen werden
 * nicht mehr per E-Mail-API versendet, sondern als Datensatz in einer
 * Wix-Data-Collection abgelegt. Die Benachrichtigung an
 * kontakt@gebaeudedienste-simin.de erfolgt über eine im Wix-Dashboard
 * konfigurierte Automation (Trigger: neuer Eintrag in dieser Collection),
 * nicht durch Code in diesem Repository.
 *
 * `elevate()` (siehe @wix/essentials) hebt die aufgerufene Funktion auf
 * Backend-Berechtigungen an – der dokumentierte Weg für serverseitige
 * Schreibzugriffe innerhalb einer Wix-CLI-/Managed-Headless-Backend-Route,
 * ohne einen separaten API-Key manuell verwalten zu müssen.
 *
 * WICHTIG (siehe README/Abschlussbericht): Dieser Code wurde gegen die
 * echten, im Projekt installierten @wix/data- und @wix/media-Typdefinitionen
 * geschrieben, konnte in dieser Umgebung aber NICHT gegen eine echte
 * Wix-Site ausgeführt/getestet werden (kein Netzwerkzugriff auf *.wix.com).
 * Vor Produktivbetrieb: echte Testanfrage gemäß README durchführen.
 */

const insertItem = elevate(items.insert);
const generateFileUploadUrl = elevate(mediaFiles.generateFileUploadUrl);

export interface SubmissionFileRef {
  name: string;
  url: string;
}

function collectionId(): string | null {
  return process.env.WIX_SUBMISSIONS_COLLECTION_ID || null;
}

/**
 * Lädt eine Datei in den Wix Media Manager hoch (privat, eigener Ordner)
 * und liefert eine Dateireferenz zurück, die im Submission-Datensatz
 * gespeichert wird. Gibt bei Fehlern `null` zurück, statt die gesamte
 * Anfrage scheitern zu lassen – der Fehler wird vom Aufrufer entschieden.
 */
async function uploadFile(file: File): Promise<SubmissionFileRef | null> {
  const safeName = sanitizeFilename(file.name);

  try {
    const { uploadUrl } = await generateFileUploadUrl(file.type || "application/octet-stream", {
      fileName: safeName,
      filePath: "/angebotsanfragen",
      private: true,
    });

    if (!uploadUrl) return null;

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });

    if (!uploadResponse.ok) return null;

    const result = (await uploadResponse.json().catch(() => null)) as
      | { file?: { url?: string; id?: string } }
      | null;

    const url = result?.file?.url;
    if (!url) return null;

    return { name: safeName, url };
  } catch {
    return null;
  }
}

export interface QuoteSubmissionInput {
  data: QuoteFormData;
  files: File[];
}

export interface QuoteSubmissionOutcome {
  ok: boolean;
  errorDetail?: string;
  /** Dateien, die trotz gültiger Validierung nicht hochgeladen werden konnten. */
  failedUploads: string[];
}

export async function insertQuoteSubmission(input: QuoteSubmissionInput): Promise<QuoteSubmissionOutcome> {
  const collection = collectionId();
  if (!collection) {
    return {
      ok: false,
      errorDetail: "WIX_SUBMISSIONS_COLLECTION_ID ist nicht gesetzt.",
      failedUploads: [],
    };
  }

  const uploadResults = await Promise.all(input.files.map((file) => uploadFile(file)));
  const uploadedFiles: SubmissionFileRef[] = [];
  const failedUploads: string[] = [];
  input.files.forEach((file, index) => {
    const result = uploadResults[index];
    if (result) {
      uploadedFiles.push(result);
    } else {
      failedUploads.push(sanitizeFilename(file.name));
    }
  });

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
    await insertItem(collection, record);
    return { ok: true, failedUploads };
  } catch (error) {
    return {
      ok: false,
      errorDetail: error instanceof Error ? error.message : "Unbekannter Fehler beim Speichern in Wix Data.",
      failedUploads,
    };
  }
}
