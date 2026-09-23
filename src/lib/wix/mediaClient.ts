import { files as mediaFiles } from "@wix/media";
import { auth } from "@wix/essentials";
import { sanitizeFilename } from "@/lib/forms/sanitize";

/**
 * Ausschließlich Wix Media (+ @wix/essentials für auth.elevate).
 *
 * Wird von submissionsRepository.ts NUR per dynamischem `import()`
 * geladen, und auch dann nur, wenn tatsächlich Dateien hochzuladen sind
 * (input.files.length > 0). Dadurch löst eine Anfrage ohne Dateien
 * niemals @wix/media als Modul aus - Wix Data und Wix Media sind damit
 * auch auf Modul-/Bundle-Ebene unabhängig voneinander testbar.
 */

type WixDocumentReference = string;

/**
 * Wix-Media-Dokumentreferenz im Format, das das CMS-Feld "files"
 * (Feldtyp "Mehrere Dokumente") erwartet: `wix:document://v1/<fileId>/<filename>`.
 *
 * Dieses Format ist NICHT erfunden, sondern aus der tatsächlichen
 * Implementierung von `@wix/sdk`s `media.getDocumentUrl()` abgeleitet
 * (node_modules/@wix/sdk/build/media/helpers.js): diese Funktion parst
 * genau diesen String zurück in `{ id, url, filename }` – die Schreibrichtung
 * ist die symmetrische Umkehrung davon. "Mehrere Dokumente" speichert laut
 * Wix-Dokumentation ("Data Types in Wix Data") mehrere solcher
 * Dokumentreferenzen pro Feld, analog zu "Mehrere Bilder" bei `wix:image://`
 * – d. h. ein Array dieser Strings.
 */
function toWixDocumentReference(
  fileId: string,
  filename: string,
): WixDocumentReference {
  return `wix:document://v1/${fileId}/${encodeURIComponent(filename)}`;
}

/**
 * Lädt eine Datei in den Wix Media Manager hoch (privat, eigener Ordner)
 * und liefert die Wix-native Dokumentreferenz zurück. Gibt bei Fehlern
 * `null` zurück, statt die gesamte Anfrage scheitern zu lassen – der
 * Fehler wird vom Aufrufer entschieden.
 */
export async function uploadFile(
  file: File,
): Promise<WixDocumentReference | null> {
  const generateFileUploadUrl = auth.elevate(mediaFiles.generateFileUploadUrl);
  const safeName = sanitizeFilename(file.name);

  try {
    const { uploadUrl } = await generateFileUploadUrl(
      file.type || "application/octet-stream",
      {
        fileName: safeName,
        filePath: "/angebotsanfragen",
        private: true,
      },
    );

    if (!uploadUrl) return null;

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });

    if (!uploadResponse.ok) return null;

    // FileDescriptor-Felder (_id, displayName) gemäß @wix/auto_sdk_media_files-Typdefinitionen.
    const result = (await uploadResponse.json().catch(() => null)) as {
      file?: { _id?: string; displayName?: string };
    } | null;

    const fileId = result?.file?._id;
    if (!fileId) return null;

    return toWixDocumentReference(
      fileId,
      result?.file?.displayName || safeName,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[quote] ERROR stage=media_upload",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
