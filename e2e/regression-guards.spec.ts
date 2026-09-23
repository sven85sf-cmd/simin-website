import { test, expect } from "@playwright/test";
import { readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath: string) =>
  readFileSync(join(root, relativePath), "utf-8");

/** Entfernt Block- und Zeilenkommentare, damit Erwähnungen in Prosa
 * (z. B. "process.env ist auf Cloudflare Workers...") echte Codetreffer
 * nicht verschleiern UND nicht fälschlich als Codetreffer zählen. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

test.describe("Regressionsschutz: Pre-Handler-Absturzquellen (Auditbefund #1 + #2)", () => {
  test("POST-Handler in quote.ts destrukturiert clientAddress NICHT in der Signatur", () => {
    // stripComments ist hier notwendig: die Doku im Code zitiert das
    // Anti-Pattern absichtlich wörtlich (`async ({ request, clientAddress
    // }) => {`), um zu erklären, warum es falsch wäre - ein reiner
    // String-Treffer ohne Kommentarfilter würde also fälschlich genau auf
    // diese Erklärung selbst anschlagen.
    const source = stripComments(read("src/pages/api/quote.ts"));

    // Die eigentliche Regression: `async ({ request, clientAddress }) => {`
    // wertet den werfenden clientAddress-Getter aus, BEVOR der try-Block
    // erreicht wird - jedes try/catch im Body ist dann wirkungslos.
    expect(source).not.toMatch(/async\s*\(\s*\{[^)]*clientAddress[^)]*\}\s*\)/);

    // Die Signatur muss statt einer Destrukturierung den vollen Kontext
    // entgegennehmen; `request` wird erst im try-Block gelesen.
    expect(source).toMatch(
      /export const POST[^=]*=\s*async\s*\(\s*context\s*(?::\s*APIContext)?\s*\)\s*=>\s*\{/,
    );
  });

  test("Rate-Limit-Schlüssel kommt aus Headern, nie aus context.clientAddress", () => {
    const source = stripComments(read("src/pages/api/quote.ts"));
    expect(source).not.toMatch(/\.clientAddress/);
    expect(source).toMatch(/cf-connecting-ip/);
  });

  test("rateLimit.ts liest KEINE process.env-Werte auf Modulebene", () => {
    const source = stripComments(read("src/lib/forms/rateLimit.ts"));
    expect(source).not.toMatch(/process\.env/);
    expect(source).toMatch(/const MAX_REQUESTS = 5;/);
    expect(source).toMatch(/const WINDOW_MS = 10 \* 60 \* 1000;/);
  });

  test("Keine Route/Bibliothek unter src/ liest process.env außerhalb von Kommentaren", () => {
    const candidateFiles = [
      "src/pages/api/quote.ts",
      "src/pages/api/runtime-health.ts",
      "src/lib/forms/rateLimit.ts",
      "src/lib/forms/submissionService.ts",
      "src/lib/wix/dataClient.ts",
      "src/lib/wix/mediaClient.ts",
      "src/lib/wix/submissionsRepository.ts",
    ];

    for (const file of candidateFiles) {
      const source = stripComments(read(file));
      expect(
        source,
        `${file} darf zur Laufzeit keinen process.env-Zugriff enthalten`,
      ).not.toMatch(/process\.env/);
    }
  });
});

test.describe("Regressionsschutz: Wix-SDK-Modulisolierung (Sektion 5 + 6)", () => {
  test("quote.ts importiert die Wix-Persistenzschicht NICHT statisch", () => {
    const source = read("src/pages/api/quote.ts");
    expect(source).not.toMatch(/^import.*submissionService/m);
    expect(source).toMatch(
      /await import\(["']@\/lib\/forms\/submissionService["']\)/,
    );
  });

  test("submissionsRepository.ts importiert @wix/media NIEMALS statisch", () => {
    const rawSource = read("src/lib/wix/submissionsRepository.ts");
    const source = stripComments(rawSource);
    expect(source).not.toMatch(/from\s+["']@wix\/media["']/);
    expect(source).not.toMatch(/^import.*mediaClient/m);
    expect(rawSource).toMatch(
      /await import\(["']@\/lib\/wix\/mediaClient["']\)/,
    );
  });

  test("mediaClient.ts wird nur bei vorhandenen Dateien dynamisch geladen (files.length > 0 Gate)", () => {
    const source = read("src/lib/wix/submissionsRepository.ts");
    const dynamicImportGate =
      /if\s*\(\s*input\.files\.length\s*>\s*0\s*\)\s*\{[\s\S]*?await import\(["']@\/lib\/wix\/mediaClient["']\)/;
    expect(source).toMatch(dynamicImportGate);
  });

  test("dataClient.ts (Wix Data) bleibt von @wix/media getrennt", () => {
    const source = stripComments(read("src/lib/wix/dataClient.ts"));
    expect(source).not.toMatch(/@wix\/media/);
  });

  test("WIX_SUBMISSIONS_COLLECTION_ID kommt aus astro:env/server, nicht aus process.env", () => {
    const source = read("src/lib/wix/submissionsRepository.ts");
    expect(source).toMatch(/from\s+["']astro:env\/server["']/);
    expect(source).not.toMatch(/process\.env\.WIX_SUBMISSIONS_COLLECTION_ID/);
  });
});

test.describe("Regressionsschutz: Attachment-Pipeline (Wix Media Upload Root Cause)", () => {
  test("mediaClient.ts liest file.id aus der rohen Upload-Antwort, nicht ausschließlich _id", () => {
    const source = stripComments(read("src/lib/wix/mediaClient.ts"));
    // Root-Cause-Fix: die rohe Upload-REST-Antwort liefert `file.id`, NICHT
    // die getypte FileDescriptor-`_id`. `id` muss die primäre, vorrangig
    // ausgewertete Quelle sein (id vor _id im ??-Fallback).
    expect(source).toMatch(
      /result\?\.file\?\.id\s*\?\?\s*result\?\.file\?\._id/,
    );
  });

  test("mediaClient.ts konstruiert KEINE eigene wix:document:// oder wix:image://-URI mehr", () => {
    const source = stripComments(read("src/lib/wix/mediaClient.ts"));
    expect(source).not.toMatch(/wix:document:\/\//);
    expect(source).not.toMatch(/wix:image:\/\//);
  });

  test("mediaClient.ts ruft getFileDescriptor auf und wartet begrenzt auf Verarbeitung (kein Endlos-Loop)", () => {
    const source = stripComments(read("src/lib/wix/mediaClient.ts"));
    expect(source).toMatch(/getFileDescriptor/);
    expect(source).toMatch(/operationStatus/);
    expect(source).toMatch(/DESCRIPTOR_POLL_ATTEMPTS/);
    // Begrenzte, konstante Obergrenze - kein while(true) o.ä.
    expect(source).toMatch(
      /for\s*\(\s*let attempt = 1;\s*attempt <= DESCRIPTOR_POLL_ATTEMPTS/,
    );
    expect(source).not.toMatch(/while\s*\(\s*true\s*\)/);
  });

  test("mediaType kommt primär von Wix' FileDescriptor, MIME-Mapping nur als Fallback (Sektion 14)", () => {
    const source = stripComments(read("src/lib/wix/mediaClient.ts"));
    expect(source).toMatch(/resolveMediaType/);
    expect(source).toMatch(/descriptor\.mediaType/);

    const mappingSource = stripComments(read("src/lib/wix/attachmentTypes.ts"));
    expect(mappingSource).toMatch(/"image\/jpeg":\s*"IMAGE"/);
    expect(mappingSource).toMatch(/"image\/png":\s*"IMAGE"/);
    expect(mappingSource).toMatch(/"image\/webp":\s*"IMAGE"/);
    expect(mappingSource).toMatch(/"application\/pdf":\s*"DOCUMENT"/);
  });

  test("submissionsRepository.ts beschreibt das alte 'files'-Feld nicht mehr, sondern Automation-taugliche Primitivfelder", () => {
    const source = stripComments(read("src/lib/wix/submissionsRepository.ts"));
    expect(source).not.toMatch(/\bfiles:\s*uploadedFiles\b/);
    expect(source).toMatch(/attachmentMetadata:/);
    expect(source).toMatch(/attachmentsPresent:/);
    expect(source).toMatch(/attachmentCount:/);
    expect(source).toMatch(/attachmentNames:/);
  });

  test("Kein stiller Teilerfolg: attachmentsComplete/failedAttachmentNames fließen durch die gesamte Kette", () => {
    const repoSource = stripComments(
      read("src/lib/wix/submissionsRepository.ts"),
    );
    expect(repoSource).toMatch(/attachmentsComplete/);
    expect(repoSource).toMatch(/failedAttachmentNames/);

    const serviceSource = stripComments(
      read("src/lib/forms/submissionService.ts"),
    );
    expect(serviceSource).toMatch(/attachmentsComplete/);
    expect(serviceSource).toMatch(/failedAttachmentNames/);

    const quoteSource = stripComments(read("src/pages/api/quote.ts"));
    expect(quoteSource).toMatch(/attachmentsComplete/);
    expect(quoteSource).toMatch(/failedAttachmentNames/);

    const frontendSource = stripComments(
      read("src/components/QuoteWizard.astro"),
    );
    expect(frontendSource).toMatch(/attachmentsComplete/);
  });

  test("Uploads bleiben privat - keine Umstellung auf öffentliche Dateien", () => {
    const source = stripComments(read("src/lib/wix/mediaClient.ts"));
    expect(source).toMatch(/private:\s*true/);
    expect(source).not.toMatch(/private:\s*false/);
  });
});

test.describe("Regressionsschutz: Flicker-Fix (Sektion 12)", () => {
  test("motion-enabled wird synchron im <head> gesetzt, nicht erst am Body-Ende", () => {
    const source = read("src/layouts/BaseLayout.astro");
    const headSection = source.slice(
      source.indexOf("<head"),
      source.indexOf("</head>"),
    );
    const bodySection = source.slice(
      source.indexOf("<body"),
      source.indexOf("</body>"),
    );

    expect(headSection).toMatch(/classList\.add\(["']motion-enabled["']\)/);
    expect(bodySection).not.toMatch(/classList\.add\(["']motion-enabled["']\)/);
  });

  test("Fail-Safe-Watchdog für hängen gebliebenes Reveal-Skript ist vorhanden", () => {
    const layoutSource = read("src/layouts/BaseLayout.astro");
    expect(layoutSource).toMatch(/__revealFailSafe/);
    expect(layoutSource).toMatch(/reveal-fallback/);

    const cssSource = read("src/styles/global.css");
    expect(cssSource).toMatch(
      /html\.motion-enabled\.reveal-fallback \[data-reveal\]/,
    );
  });
});

test.describe("Regressionsschutz: Hero-Hintergrundbild vollständig statisch", () => {
  test("Keine hero-cinematic-zoom-Keyframes oder Animation/Transform mehr auf .hero__image", () => {
    const source = stripComments(read("src/components/Hero.astro"));
    expect(source).not.toMatch(/hero-cinematic-zoom/);
    expect(source).not.toMatch(/@keyframes/);

    // Kein animation/transform/transition-transform/will-change auf dem
    // Hero-Bild selbst (Textreveal-Regeln auf anderen Elementen bleiben
    // erlaubt und werden hier bewusst nicht geprüft).
    const heroImageBlockMatch = source.match(
      /:global\(\.hero__image\)\s*\{[^}]*\}/,
    );
    expect(heroImageBlockMatch).not.toBeNull();
    const heroImageBlock = heroImageBlockMatch?.[0] ?? "";
    expect(heroImageBlock).not.toMatch(/animation/);
    expect(heroImageBlock).not.toMatch(/transform/);
    expect(heroImageBlock).not.toMatch(/will-change/);
  });

  test("Text-/Logo-Reveal im Hero bleibt bestehen (nur das Hintergrundbild wurde deaktiviert)", () => {
    const source = stripComments(read("src/components/Hero.astro"));
    expect(source).toMatch(/hero__logo\[data-reveal\]/);
    expect(source).toMatch(/hero__headline\[data-reveal\]/);
    expect(source).toMatch(/hero__actions\[data-reveal\]/);
  });
});

test.describe("Regressionsschutz: Additive Multi-File-Auswahl", () => {
  test("QuoteWizard.astro verwaltet eine persistente selectedFiles-Liste statt fileInput.files direkt zu lesen", () => {
    const source = stripComments(read("src/components/QuoteWizard.astro"));
    expect(source).toMatch(/let selectedFiles: File\[\] = \[\];/);
    expect(source).toMatch(/function addFiles/);
    // Die Schritt-3-Validierung und der Submit dürfen NICHT mehr direkt
    // `fileInput.files` als Quelle verwenden - das war exakt der Bug
    // (zweite Auswahl überschreibt die erste).
    expect(source).not.toMatch(/fileInput\?\.files/);
    expect(source).not.toMatch(/fileInput\.files\)/);
  });

  test("Duplikaterkennung basiert auf name+size+lastModified, keine Hashing-Lösung", () => {
    const source = stripComments(read("src/components/QuoteWizard.astro"));
    expect(source).toMatch(
      /a\.name === b\.name && a\.size === b\.size && a\.lastModified === b\.lastModified/,
    );
  });

  test("Entfernen-Buttons haben ein sprechendes aria-label pro Datei", () => {
    const source = stripComments(read("src/components/QuoteWizard.astro"));
    expect(source).toMatch(
      /setAttribute\("aria-label", `Datei \$\{file\.name\} entfernen`\)/,
    );
  });

  test("Submit hängt alle selectedFiles einzeln an FormData an, nicht die native FileList", () => {
    const source = stripComments(read("src/components/QuoteWizard.astro"));
    expect(source).toMatch(/fd\.delete\("files"\)/);
    expect(source).toMatch(
      /selectedFiles\.forEach\(\(file\) => \{\s*fd\.append\("files", file, file\.name\);/,
    );
  });

  test("Validierung verwendet weiterhin ausschließlich die bestehende validateFiles()-Funktion", () => {
    const source = stripComments(read("src/components/QuoteWizard.astro"));
    const validateFilesCalls = source.match(/validateFiles\(/g) ?? [];
    expect(validateFilesCalls.length).toBeGreaterThan(0);
    // Keine eigene Größen-/Typ-/Mengenprüfung parallel zu validateFiles.
    expect(source).not.toMatch(/\.length > MAX_FILES/);
  });

  test("Erfolgreicher Submit setzt die Dateiauswahl zurück (kein Datei-Leak zwischen Anfragen)", () => {
    const source = stripComments(read("src/components/QuoteWizard.astro"));
    expect(source).toMatch(/function resetFileState/);
    expect(source).toMatch(/resetFileState\(\);/);
  });
});

test.describe("Regressionsschutz: CMS-Datumsfeld (Abschnitt 18-21)", () => {
  test("submittedAt ist ein echter Date-Wert, kein ISO-String mehr", () => {
    const source = stripComments(read("src/lib/wix/submissionsRepository.ts"));
    expect(source).not.toMatch(/new Date\(\)\.toISOString\(\)/);
    expect(source).toMatch(/submittedAt:\s*new Date\(\),/);
  });
});

test.describe("Regressionsschutz: Private Attachment Access (signierte Capability-Links)", () => {
  test("attachmentLink.ts verwendet ausschließlich Web Crypto, kein node:crypto", () => {
    const source = stripComments(read("src/lib/attachmentLink.ts"));
    expect(source).not.toMatch(/from\s+["']node:crypto["']/);
    expect(source).not.toMatch(/require\(["']crypto["']\)/);
    expect(source).toMatch(/crypto\.subtle\.(sign|verify|importKey)/);
  });

  test("Token-Payload enthält keine PII (nur v, f, exp)", () => {
    const source = stripComments(read("src/lib/attachmentLink.ts"));
    expect(source).toMatch(
      /interface AttachmentTokenPayload\s*\{\s*v:\s*1;\s*f:\s*string;\s*exp:\s*number;\s*\}/,
    );
    expect(source).not.toMatch(/\bname\b.*:.*payload|\bemail\b.*:.*payload/i);
  });

  test("Token-Format ist payload.signature (Base64Url), Signaturprüfung vor Payload-Auswertung", () => {
    const source = stripComments(read("src/lib/attachmentLink.ts"));
    expect(source).toMatch(/token\.split\("\."\)/);
    expect(source).toMatch(/crypto\.subtle\.verify/);
    // Die Signaturprüfung muss vor dem JSON.parse des Payloads erfolgen.
    const verifyIndex = source.indexOf("crypto.subtle.verify");
    const parseIndex = source.indexOf("JSON.parse");
    expect(verifyIndex).toBeGreaterThan(-1);
    expect(parseIndex).toBeGreaterThan(verifyIndex);
  });

  test("Abgelaufene Tokens werden erkannt (EXPIRED getrennt von INVALID_SIGNATURE)", () => {
    const source = stripComments(read("src/lib/attachmentLink.ts"));
    expect(source).toMatch(
      /"MALFORMED"\s*\|\s*"INVALID_SIGNATURE"\s*\|\s*"EXPIRED"/,
    );
    expect(source).toMatch(/Date\.now\(\) > exp \* 1000/);
  });

  test("submissionsRepository.ts speichert NIE die von Wix erzeugte temporäre Download-URL im CMS, nur den eigenen Capability-Link", () => {
    const source = stripComments(read("src/lib/wix/submissionsRepository.ts"));
    expect(source).not.toMatch(/generateFileDownloadUrl/);
    expect(source).toMatch(/createAttachmentToken/);
    expect(source).toMatch(/attachmentAccessLinks/);
    expect(source).toMatch(/\/api\/attachment\?token=/);
  });

  test("Attachment-Access-Link nutzt den zur Laufzeit übergebenen publicOrigin, keine hartcodierte Domain (Abschnitt 30)", () => {
    const source = stripComments(read("src/lib/wix/submissionsRepository.ts"));
    expect(source).toMatch(/\$\{publicOrigin\}\/api\/attachment\?token=/);
    expect(source).toMatch(
      /buildAttachmentAccessLinksText\(\s*successfulAttachments,\s*input\.publicOrigin,?\s*\)/,
    );
    expect(source).not.toMatch(/gebaeudedienste-simin\.de/);
    expect(source).not.toMatch(/wix-site-host\.com/);
  });

  test("downloadClient.ts nutzt ausschließlich generateFileDownloadUrl (pro Datei), NIEMALS die permanente generateFilesDownloadUrl", () => {
    const source = stripComments(read("src/lib/wix/downloadClient.ts"));
    expect(source).toMatch(/generateFileDownloadUrl/);
    expect(source).not.toMatch(/generateFilesDownloadUrl/);
  });

  test("Wix-Download-URL wird erst im Attachment-Endpoint erzeugt, mit kurzer Gültigkeit", () => {
    const source = stripComments(read("src/pages/api/attachment.ts"));
    expect(source).toMatch(/generateFileDownloadUrl/);
    expect(source).toMatch(/WIX_DOWNLOAD_URL_TTL_MINUTES\s*=\s*10/);
  });

  test("/api/attachment ist GET-only, liest ausschließlich ein signiertes token, kein rohes fileId-Query-Parameter", () => {
    const source = stripComments(read("src/pages/api/attachment.ts"));
    expect(source).toMatch(/export const GET:/);
    expect(source).not.toMatch(/export const POST:/);
    expect(source).toMatch(/searchParams\.get\("token"\)/);
    expect(source).not.toMatch(/searchParams\.get\("fileId"\)/);
  });

  test("/api/attachment prüft KEINE Origin-Allowlist (Capability-Token ist die einzige Autorisierung)", () => {
    const source = stripComments(read("src/pages/api/attachment.ts"));
    expect(source).not.toMatch(/isAllowedOrigin/);
  });

  test("/api/attachment streamt keine Datei-Binärdaten selbst, sondern leitet per 302 weiter", () => {
    const source = stripComments(read("src/pages/api/attachment.ts"));
    expect(source).toMatch(/status:\s*302/);
    expect(source).toMatch(/Location:\s*downloadUrl/);
  });

  test("/api/attachment loggt niemals Token, Secret, temporäre Wix-URL oder fileId", () => {
    const source = stripComments(read("src/pages/api/attachment.ts"));
    const consoleCalls = source.match(/console\.(info|error)\([^)]*\)/g) ?? [];
    for (const call of consoleCalls) {
      // `Boolean(token)`/`Boolean(downloadUrl)` loggen nur die Präsenz als
      // true/false (genau das verlangt Abschnitt 17) - erst der reine,
      // unverpackte Bezeichner (der tatsächliche Wert) wäre verdächtig.
      const withoutBooleanWrapping = call.replace(/Boolean\([^)]*\)/g, "BOOL");
      expect(
        withoutBooleanWrapping,
        `verdächtiger Log-Aufruf: ${call}`,
      ).not.toMatch(
        /\btoken\b|signingSecret|SIGNING_SECRET|\bdownloadUrl\b|\bfileId\b/,
      );
    }
  });

  test("quote.ts leitet den bereits geprüften Origin-Header weiter, NIEMALS request.url, für Attachment-Links", () => {
    const source = stripComments(read("src/pages/api/quote.ts"));
    expect(source).toMatch(
      /const publicOrigin = request\.headers\.get\("origin"\)!;/,
    );
    expect(source).toMatch(/publicOrigin/);
  });

  test("ATTACHMENT_LINK_SIGNING_SECRET kommt aus astro:env/server mit access:secret, niemals aus process.env", () => {
    const configSource = stripComments(read("astro.config.base.mjs"));
    expect(configSource).toMatch(
      /ATTACHMENT_LINK_SIGNING_SECRET:\s*envField\.string\(\{[^}]*access:\s*"secret"/s,
    );

    const repoSource = stripComments(
      read("src/lib/wix/submissionsRepository.ts"),
    );
    expect(repoSource).not.toMatch(
      /process\.env\.ATTACHMENT_LINK_SIGNING_SECRET/,
    );
  });

  test("Signing-Secret wird nirgends im clientseitigen Frontend-Code referenziert", () => {
    const frontendFiles = [
      "src/components/QuoteWizard.astro",
      "src/components/form/FileUpload.astro",
    ];
    for (const file of frontendFiles) {
      const source = stripComments(read(file));
      expect(
        source,
        `${file} darf ATTACHMENT_LINK_SIGNING_SECRET nicht referenzieren`,
      ).not.toMatch(/ATTACHMENT_LINK_SIGNING_SECRET/);
    }
  });

  test("private:true bleibt in der gesamten Media-Pipeline erhalten", () => {
    for (const file of [
      "src/lib/wix/mediaClient.ts",
      "src/lib/wix/downloadClient.ts",
    ]) {
      const source = stripComments(read(file));
      expect(source).not.toMatch(/private:\s*false/);
    }
    const mediaClientSource = stripComments(read("src/lib/wix/mediaClient.ts"));
    expect(mediaClientSource).toMatch(/private:\s*true/);
  });

  test("Fehlendes Signing-Secret blockiert die Kundenanfrage NICHT (kein stilles Erfinden, aber auch kein Absturz)", () => {
    const source = stripComments(read("src/lib/wix/submissionsRepository.ts"));
    expect(source).toMatch(
      /if\s*\(!ATTACHMENT_LINK_SIGNING_SECRET\)\s*\{[\s\S]*?return\s+"";/,
    );
  });
});

test.describe("Regressionsschutz: SIMIN-Logo-Asset (statischer Import statt import.meta.glob)", () => {
  test("A) Logo.astro importiert simin-logo.png statisch", () => {
    const source = stripComments(read("src/components/Logo.astro"));
    expect(source).toMatch(
      /import\s+siminLogo\s+from\s+["']@\/assets\/logo\/simin-logo\.png["']/,
    );
  });

  test("B) Logo.astro verwendet KEIN import.meta.glob mehr für das Logo", () => {
    const source = stripComments(read("src/components/Logo.astro"));
    expect(source).not.toMatch(/import\.meta\.glob/);
    expect(source).not.toMatch(/Object\.values\(/);
  });

  test("C) Logo.astro rendert <Image src={siminLogo} ...> deterministisch (kein Fallback-Ternary mehr)", () => {
    const source = stripComments(read("src/components/Logo.astro"));
    expect(source).toMatch(/<Image\s+src=\{siminLogo\}/);
    expect(source).not.toMatch(/logoEntry/);
  });

  test("D) src/assets/logo/simin-logo.png existiert weiterhin unverändert", () => {
    const stats = statSync(join(root, "src/assets/logo/simin-logo.png"));
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBeGreaterThan(0);
  });

  test("E) Header.astro rendert weiterhin <Logo", () => {
    const source = stripComments(read("src/components/Header.astro"));
    expect(source).toMatch(/<Logo/);
  });

  test("F) Footer.astro rendert weiterhin <Logo", () => {
    const source = stripComments(read("src/components/Footer.astro"));
    expect(source).toMatch(/<Logo/);
  });
});
