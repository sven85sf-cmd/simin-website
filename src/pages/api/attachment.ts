import type { APIContext, APIRoute } from "astro";

export const prerender = false;

/**
 * Zugriff auf private Wix-Media-Anhänge aus der Benachrichtigungs-E-Mail
 * heraus (Konstantin klickt einen Link in der Mail).
 *
 * Sicherheitsmodell: ein signiertes Capability-Token ist die EINZIGE
 * Autorisierung - bewusst KEINE Origin-Allowlist-Prüfung wie bei
 * /api/quote, weil dieser Endpoint als einfache Top-Level-Navigation aus
 * einem E-Mail-Client oder Browser-Lesezeichen erreicht wird, der
 * typischerweise gar keinen (oder keinen zur Website passenden)
 * Origin-Header sendet - eine solche Prüfung wäre hier nicht nur
 * wirkungslos, sondern würde den eigentlichen Anwendungsfall brechen.
 *
 * KEIN offener `?fileId=...`-Endpoint: der fileId steckt ausschließlich
 * im signierten Tokenpayload, ein manipulierter/erratener fileId ohne
 * gültige Signatur wird bereits bei der Signaturprüfung abgelehnt, bevor
 * der Payload überhaupt inhaltlich ausgewertet wird.
 *
 * Ablauf: Token verifizieren -> @wix/media dynamisch laden -> elevated
 * generateFileDownloadUrl() für GENAU diese eine Datei aufrufen -> 302 auf
 * die frische, kurzlebige Wix-Download-URL. Die Datei selbst wird NICHT
 * durch diesen Worker gestreamt/geproxied - ein Redirect reicht aus.
 */

/** Wix-eigene, temporäre Download-URL: bewusst deutlich kürzer gültig als
 * der SIMIN-Capability-Link selbst (siehe ATTACHMENT_LINK_TTL_HOURS). */
const WIX_DOWNLOAD_URL_TTL_MINUTES = 10;

function messagePage(
  status: number,
  title: string,
  message: string,
  hint?: string,
): Response {
  const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${title}</title>
</head>
<body style="font-family: sans-serif; max-width: 32rem; margin: 4rem auto; padding: 0 1rem; color: #07354a;">
<h1 style="font-size: 1.25rem;">${title}</h1>
<p>${message}</p>
${hint ? `<p style="color: #666;">${hint}</p>` : ""}
</body>
</html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

const CONTACT_HINT =
  "Bitte kontaktieren Sie Gebäudedienste SIMIN, falls Sie erneut Zugriff auf diese Datei benötigen.";

export const GET: APIRoute = async (context: APIContext) => {
  try {
    const { request } = context;
    const token = new URL(request.url).searchParams.get("token");

    // eslint-disable-next-line no-console
    console.info("[attachment-access] token_received", Boolean(token));

    if (!token) {
      return messagePage(
        400,
        "Fehlender Link",
        "Dieser Download-Link ist unvollständig.",
      );
    }

    const { ATTACHMENT_LINK_SIGNING_SECRET } = await import("astro:env/server");
    if (!ATTACHMENT_LINK_SIGNING_SECRET) {
      // eslint-disable-next-line no-console
      console.error("[attachment-access] ERROR stage=missing_signing_secret");
      return messagePage(
        500,
        "Download derzeit nicht verfügbar",
        "Bitte versuchen Sie es später erneut.",
      );
    }

    const { verifyAttachmentToken } = await import("@/lib/attachmentLink");
    const verification = await verifyAttachmentToken(
      token,
      ATTACHMENT_LINK_SIGNING_SECRET,
    );

    // eslint-disable-next-line no-console
    console.info(
      "[attachment-access] signature_valid",
      verification.ok || verification.reason !== "INVALID_SIGNATURE",
    );
    // eslint-disable-next-line no-console
    console.info(
      "[attachment-access] expired",
      !verification.ok && verification.reason === "EXPIRED",
    );

    if (!verification.ok) {
      if (verification.reason === "EXPIRED") {
        return messagePage(
          410,
          "Link abgelaufen",
          "Dieser Download-Link ist abgelaufen.",
          CONTACT_HINT,
        );
      }
      return messagePage(
        403,
        "Ungültiger Link",
        "Dieser Download-Link ist ungültig.",
      );
    }

    let generateFileDownloadUrl: (typeof import("@/lib/wix/downloadClient"))["generateFileDownloadUrl"];
    try {
      ({ generateFileDownloadUrl } = await import("@/lib/wix/downloadClient"));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        "[attachment-access] ERROR stage=wix_module_import",
        error instanceof Error ? error.message : error,
      );
      return messagePage(
        502,
        "Download derzeit nicht verfügbar",
        "Bitte versuchen Sie es später erneut.",
      );
    }

    let downloadUrl: string | null;
    try {
      downloadUrl = await generateFileDownloadUrl(
        verification.fileId,
        WIX_DOWNLOAD_URL_TTL_MINUTES,
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        "[attachment-access] ERROR stage=wix_download_url",
        error instanceof Error ? error.message : error,
      );
      downloadUrl = null;
    }

    // eslint-disable-next-line no-console
    console.info("[attachment-access] wix_url_generated", Boolean(downloadUrl));

    if (!downloadUrl) {
      return messagePage(
        502,
        "Download derzeit nicht verfügbar",
        "Bitte versuchen Sie es später erneut.",
        CONTACT_HINT,
      );
    }

    // eslint-disable-next-line no-console
    console.info("[attachment-access] redirect", true);
    return new Response(null, {
      status: 302,
      headers: { Location: downloadUrl },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[attachment-access] ERROR stage=unhandled",
      error instanceof Error ? (error.stack ?? error.message) : error,
    );
    return messagePage(
      500,
      "Download derzeit nicht verfügbar",
      "Bitte versuchen Sie es später erneut.",
    );
  }
};
