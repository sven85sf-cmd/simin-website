import { files as mediaFiles } from "@wix/media";
import { auth } from "@wix/essentials";
import { sanitizeFilename } from "@/lib/forms/sanitize";
import {
  MIME_TO_MEDIA_TYPE,
  type AttachmentMetadata,
  type MediaType,
} from "@/lib/wix/attachmentTypes";

/**
 * Ausschließlich Wix Media (+ @wix/essentials für auth.elevate).
 *
 * Wird von submissionsRepository.ts NUR per dynamischem `import()`
 * geladen, und auch dann nur, wenn tatsächlich Dateien hochzuladen sind
 * (input.files.length > 0). Dadurch löst eine Anfrage ohne Dateien
 * niemals @wix/media als Modul aus.
 *
 * WICHTIG (Root-Cause-Fix): Der direkte PUT-Upload gegen die von
 * `generateFileUploadUrl()` gelieferte `uploadUrl` ist KEIN SDK-Aufruf,
 * sondern ein roher Request gegen Wix' Media-Manager-Upload-REST-API.
 * Deren Antwortformat ist NICHT die getypte `@wix/media`-`FileDescriptor`
 * (die verwendet `_id` - siehe @wix/auto_sdk_media_files-Typdefinitionen)
 * sondern die separate Upload-REST-Antwort, die `file.id` liefert. Der
 * vorherige Code las fälschlich `_id` aus dieser rohen Antwort und verlor
 * dadurch JEDE hochgeladene Datei (Feld blieb leer). Als Fallback wird
 * zusätzlich `_id` akzeptiert, falls Wix dieses Feld dort doch einmal
 * mitliefert - die eigentliche, dauerhaft gespeicherte ID stammt ohnehin
 * aus dem anschließenden `getFileDescriptor()`-Aufruf unten, nicht aus
 * dieser rohen Antwort.
 */

const DESCRIPTOR_POLL_ATTEMPTS = 5;
const DESCRIPTOR_POLL_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface RawUploadResponse {
  file?: { id?: string; _id?: string; displayName?: string };
}

/**
 * Minimale, selbst definierte Sicht auf die relevanten FileDescriptor-Felder
 * (siehe @wix/auto_sdk_media_files/build/cjs/index.typings.d.ts: `_id`,
 * `displayName`, `mediaType`, `operationStatus`, `state`). Der von
 * `auth.elevate(mediaFiles.getFileDescriptor)` exportierte Typ ist eine
 * generierte REST-Modul-Signatur, aus der sich per `ReturnType<>` NICHT
 * zuverlässig der tatsächliche `(fileId: string) => Promise<FileDescriptor>`-
 * Aufruf extrahieren lässt (TS wählt sonst die Kontextualisierungs-
 * Overload) - deshalb hier ein expliziter, schmaler Cast an der einzigen
 * Aufrufstelle unten statt eines fehlerhaft abgeleiteten Typs.
 */
interface FileDescriptorLike {
  _id?: string;
  displayName?: string;
  mediaType?: string;
  operationStatus?: string;
  state?: string;
}

/**
 * Wix dokumentiert, dass ein erfolgreicher Upload NICHT bedeutet, dass die
 * Datei bereits vollständig verarbeitet ist (`operationStatus: PENDING`).
 * Begrenztes Polling (kein Endlos-Loop): READY → fertig, FAILED → sofort
 * abbrechen, sonst bis zu DESCRIPTOR_POLL_ATTEMPTS Versuche mit fixem
 * Delay, danach klares Timeout (kein Retry mehr).
 */
async function waitForReadyDescriptor(
  getFileDescriptor: (fileId: string) => Promise<FileDescriptorLike>,
  fileId: string,
): Promise<FileDescriptorLike | null> {
  for (let attempt = 1; attempt <= DESCRIPTOR_POLL_ATTEMPTS; attempt++) {
    let descriptor: FileDescriptorLike | null = null;
    try {
      descriptor = await getFileDescriptor(fileId);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        "[attachment] ERROR stage=descriptor_poll",
        error instanceof Error ? error.message : error,
      );
    }

    if (descriptor?.operationStatus === "FAILED") return null;

    const isReady =
      descriptor?.operationStatus === "READY" ||
      (!descriptor?.operationStatus && descriptor?.state === "OK");
    if (isReady) return descriptor;

    if (attempt < DESCRIPTOR_POLL_ATTEMPTS) {
      await sleep(DESCRIPTOR_POLL_DELAY_MS);
    }
  }
  return null;
}

/**
 * Primäre Quelle ist immer Wix' eigener `FileDescriptor.mediaType` -
 * die MIME-Mapping-Tabelle dient nur als Fallback, falls Wix ausnahmsweise
 * keinen Wert liefert, und als Plausibilitätslog bei Abweichung.
 */
function resolveMediaType(
  wixMediaType: string | undefined,
  mimeType: string,
): MediaType {
  if (wixMediaType === "IMAGE" || wixMediaType === "DOCUMENT") {
    return wixMediaType;
  }
  if (wixMediaType) {
    // eslint-disable-next-line no-console
    console.info("[attachment] media_type_fallback_used", { wixMediaType });
  }
  return MIME_TO_MEDIA_TYPE[mimeType] ?? "OTHER";
}

export interface AttachmentUploadResult {
  ok: boolean;
  metadata?: AttachmentMetadata;
}

/**
 * Lädt eine Datei in den Wix Media Manager hoch (privat, eigener Ordner),
 * wartet auf Verarbeitung und liefert die offiziellen Wix-Metadaten
 * (FileDescriptor) zurück - NIE eine selbst konstruierte Media-URI.
 * Gibt bei jedem Fehler (Upload, fehlende ID, Timeout, FAILED-Status)
 * `{ ok: false }` zurück, statt die gesamte Anfrage scheitern zu lassen -
 * der Aufrufer entscheidet über Teilerfolg/Fehlschlag der Gesamtanfrage.
 */
export async function uploadAndDescribeFile(
  file: File,
): Promise<AttachmentUploadResult> {
  const generateFileUploadUrl = auth.elevate(mediaFiles.generateFileUploadUrl);
  const getFileDescriptor = auth.elevate(
    mediaFiles.getFileDescriptor,
  ) as unknown as (fileId: string) => Promise<FileDescriptorLike>;
  const safeName = sanitizeFilename(file.name);
  const mimeType = file.type || "application/octet-stream";

  try {
    // eslint-disable-next-line no-console
    console.info("[attachment] generate_upload_url start");
    const { uploadUrl } = await generateFileUploadUrl(mimeType, {
      fileName: safeName,
      filePath: "/angebotsanfragen",
      private: true,
    });

    if (!uploadUrl) {
      // eslint-disable-next-line no-console
      console.error(
        "[attachment] ERROR stage=generate_upload_url no_upload_url",
      );
      return { ok: false };
    }
    // eslint-disable-next-line no-console
    console.info("[attachment] generate_upload_url ok");

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": mimeType },
      body: file,
    });

    // eslint-disable-next-line no-console
    console.info("[attachment] upload_http_status", uploadResponse.status);

    if (!uploadResponse.ok) return { ok: false };

    const result = (await uploadResponse
      .json()
      .catch(() => null)) as RawUploadResponse | null;
    const fileId = result?.file?.id ?? result?.file?._id;

    // eslint-disable-next-line no-console
    console.info(
      "[attachment] upload_response_file_present",
      Boolean(result?.file),
    );
    // eslint-disable-next-line no-console
    console.info(
      "[attachment] upload_response_file_id_present",
      Boolean(fileId),
    );

    if (!fileId) return { ok: false };

    // eslint-disable-next-line no-console
    console.info("[attachment] descriptor start");
    const descriptor = await waitForReadyDescriptor(getFileDescriptor, fileId);
    // eslint-disable-next-line no-console
    console.info("[attachment] descriptor ready", Boolean(descriptor));

    if (!descriptor) return { ok: false };

    const mediaType = resolveMediaType(descriptor.mediaType, mimeType);
    // eslint-disable-next-line no-console
    console.info("[attachment] media_type", mediaType);

    const metadata: AttachmentMetadata = {
      fileId: descriptor._id ?? fileId,
      displayName:
        descriptor.displayName || result?.file?.displayName || safeName,
      mimeType,
      mediaType,
      private: true,
    };

    // eslint-disable-next-line no-console
    console.info("[attachment] completed", true);
    return { ok: true, metadata };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[attachment] ERROR stage=upload_or_descriptor",
      error instanceof Error ? error.message : error,
    );
    // eslint-disable-next-line no-console
    console.info("[attachment] completed", false);
    return { ok: false };
  }
}
