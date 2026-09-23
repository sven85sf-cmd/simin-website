import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
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
