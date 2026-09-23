/**
 * Reine Typdefinitionen + Mapping-Tabelle, OHNE jeden Wix-SDK-Import.
 *
 * Bewusst in einer eigenen, importfreien Datei: submissionsRepository.ts
 * importiert dies statisch (für den Record-Typ), darf dabei aber niemals
 * transitiv @wix/media laden (siehe mediaClient.ts-Isolationsregel).
 */

export type MediaType = "IMAGE" | "DOCUMENT" | "OTHER";

/**
 * Automation-taugliche Metadaten EINES Anhangs. Enthält absichtlich KEINE
 * selbst konstruierte Wix-Media-URI (`wix:document://...`/`wix:image://...`)
 * - Wix bietet dafür keine offizielle SDK-Encoder-Funktion (nur Parser,
 * siehe @wix/sdk/build/media/helpers.js), nur `fileId` + Wix Media selbst
 * sind die Quelle der Wahrheit für den tatsächlichen Medienzugriff.
 */
export interface AttachmentMetadata {
  fileId: string;
  displayName: string;
  mimeType: string;
  mediaType: MediaType;
  private: true;
}

/**
 * Explizite MIME → Media-Type-Zuordnung (Abschnitt 14). Dient als
 * Fallback/Plausibilitätsprüfung - primäre Quelle für den tatsächlichen
 * Media-Type ist immer Wix' eigener `FileDescriptor.mediaType`
 * (siehe mediaClient.ts, resolveMediaType()). Andere MIME-Types werden
 * bereits vor dem Upload durch validate.ts (ALLOWED_FILE_TYPES) verboten.
 */
export const MIME_TO_MEDIA_TYPE: Record<string, MediaType> = {
  "image/jpeg": "IMAGE",
  "image/png": "IMAGE",
  "image/webp": "IMAGE",
  "application/pdf": "DOCUMENT",
};
