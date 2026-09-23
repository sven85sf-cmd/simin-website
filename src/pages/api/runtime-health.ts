import type { APIRoute } from "astro";

export const prerender = false;

/**
 * Rein lesender Diagnose-Endpunkt zur Verifikation der Laufzeitumgebung.
 *
 * KEINE Schreibzugriffe: kein Wix-Data-Insert, kein Media-Upload, keine
 * Automation wird ausgelöst. Jeder Import erfolgt einzeln dynamisch und
 * einzeln try/catch-abgesichert, damit ein fehlschlagender Import eines
 * Moduls die Prüfung der anderen nicht verhindert. Die Antwort enthält
 * ausschließlich Booleans - niemals Secrets, niemals den Wert der
 * Collection-ID.
 */
export const GET: APIRoute = async () => {
  const health: Record<string, unknown> = {
    runtime: true,
    requestHandler: true,
  };

  try {
    const { WIX_SUBMISSIONS_COLLECTION_ID } = await import("astro:env/server");
    health.envModule = true;
    health.collectionIdPresent = Boolean(WIX_SUBMISSIONS_COLLECTION_ID);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[runtime-health] ERROR stage=env_module",
      error instanceof Error
        ? error.constructor.name + ": " + error.message
        : String(error),
    );
    health.envModule = false;
    health.collectionIdPresent = false;
  }

  try {
    await import("@wix/essentials");
    health.wixEssentialsImport = true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[runtime-health] ERROR stage=wix_essentials_import",
      error instanceof Error
        ? error.constructor.name + ": " + error.message
        : String(error),
    );
    health.wixEssentialsImport = false;
  }

  try {
    await import("@wix/data");
    health.wixDataImport = true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[runtime-health] ERROR stage=wix_data_import",
      error instanceof Error
        ? error.constructor.name + ": " + error.message
        : String(error),
    );
    health.wixDataImport = false;
  }

  try {
    await import("@wix/media");
    health.wixMediaImport = true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[runtime-health] ERROR stage=wix_media_import",
      error instanceof Error
        ? error.constructor.name + ": " + error.message
        : String(error),
    );
    health.wixMediaImport = false;
  }

  return new Response(JSON.stringify(health), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
