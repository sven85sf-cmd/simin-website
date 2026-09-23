import { files as mediaFiles } from "@wix/media";
import { auth } from "@wix/essentials";

/**
 * Ausschließlich für den EINMALIGEN, frischen Erzeugungsschritt einer
 * temporären Wix-Download-URL beim Klick auf einen Attachment-Access-Link
 * (siehe src/pages/api/attachment.ts). Bewusst eine eigene Datei statt
 * mediaClient.ts: mediaClient.ts gehört zum Upload-Pfad (aus
 * submissionsRepository.ts, nur bei files.length > 0), dieser hier zum
 * Download-Pfad (aus attachment.ts, nur bei einem Klick auf einen
 * Access-Link) - zwei unabhängige Lebenszyklen.
 *
 * Nach installierten @wix/auto_sdk_media_files-Typdefinitionen:
 * `generateFileDownloadUrl(fileId, options)` liefert
 * `{ downloadUrls?: { url?: string; assetKey?: string }[] }`. Ohne
 * `assetKeys`-Option liefert Wix genau einen Eintrag (Default-Asset
 * `src`, Format/Qualität der Originaldatei).
 */
export async function generateFileDownloadUrl(
  fileId: string,
  expirationInMinutes: number,
): Promise<string | null> {
  const elevatedGenerate = auth.elevate(mediaFiles.generateFileDownloadUrl);
  const response = await elevatedGenerate(fileId, { expirationInMinutes });
  return response.downloadUrls?.[0]?.url ?? null;
}
