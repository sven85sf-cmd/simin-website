import { items } from "@wix/data";
import { auth } from "@wix/essentials";

/**
 * Ausschließlich Wix Data (+ @wix/essentials für auth.elevate). Bewusst
 * getrennt von mediaClient.ts, damit eine Anfrage ohne Dateien niemals
 * @wix/media laden muss (siehe mediaClient.ts).
 */
export async function insertSubmission(
  collectionId: string,
  record: Record<string, unknown>,
): Promise<void> {
  const insertItem = auth.elevate(items.insert);
  await insertItem(collectionId, record);
}
