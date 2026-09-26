import { test, expect } from "@playwright/test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Testmatrix für die additive Multi-File-Auswahl (Root-Cause-Fix: ein
 * natives `<input type="file" multiple>` ERSETZT bei jeder neuen
 * Dateiauswahl die komplette FileList - eine zweite Dialog-Öffnung
 * überschrieb bisher die erste. `selectedFiles` in QuoteWizard.astro ist
 * jetzt die persistente Source of Truth.
 *
 * Alle Testdateien werden als reine In-Memory-Buffer erzeugt (Playwright
 * `setInputFiles([{ name, mimeType, buffer }])`) - es gibt bewusst KEINE
 * Binär-Fixtures im Repository. Die Inhalte sind für diese rein
 * clientseitigen UX-Interaktionstests nicht signaturkonform (das prüft
 * server­seitig `validateFileSignatures`, hier unbeteiligt); nur `name`,
 * `size` (via Puffergröße) und der clientseitige `type` sind relevant.
 */

function pdfFile(name: string, sizeBytes = 200) {
  const header = Buffer.from("%PDF-1.4\n");
  const filler = Buffer.alloc(Math.max(0, sizeBytes - header.length), 0x20);
  return {
    name,
    mimeType: "application/pdf",
    buffer: Buffer.concat([header, filler]),
  };
}

function pngFile(name: string, sizeBytes = 100) {
  // Echte, minimale 1x1-PNG-Magic-Bytes als Präfix, Rest Füllbytes.
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const filler = Buffer.alloc(Math.max(0, sizeBytes - header.length), 0);
  return {
    name,
    mimeType: "image/png",
    buffer: Buffer.concat([header, filler]),
  };
}

function jpgFile(name: string, sizeBytes = 100) {
  const header = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
  const filler = Buffer.alloc(Math.max(0, sizeBytes - header.length), 0);
  return {
    name,
    mimeType: "image/jpeg",
    buffer: Buffer.concat([header, filler]),
  };
}

async function gotoQuoteFileStep(page: import("@playwright/test").Page) {
  await page.goto("/angebot");
  await page.locator('label[for="service-gebaeudereinigung"]').click();
  await page.locator("#quote-next").click();
  await page.locator('label[for="property-buero"]').click();
  await page.locator("#quote-next").click();
  // Jetzt auf Schritt 3 (Standort + Dateiupload).
}

const fileInput = (page: import("@playwright/test").Page) =>
  page.locator("#files");
const fileListItems = (page: import("@playwright/test").Page) =>
  page.locator("#files-filelist .field__filelist-item");

test("A) PDF auswählen -> Liste enthält PDF", async ({ page }) => {
  await gotoQuoteFileStep(page);
  await fileInput(page).setInputFiles([pdfFile("grundriss.pdf")]);

  await expect(fileListItems(page)).toHaveCount(1);
  await expect(fileListItems(page).first()).toContainText("grundriss.pdf");
  await expect(fileListItems(page).first()).toContainText("PDF");
});

test("B) danach JPG auswählen -> Liste enthält PDF + JPG (zweite Auswahl ersetzt NICHT die erste)", async ({
  page,
}) => {
  await gotoQuoteFileStep(page);
  await fileInput(page).setInputFiles([pdfFile("grundriss.pdf")]);
  await fileInput(page).setInputFiles([jpgFile("urlaubsfoto.jpg")]);

  await expect(fileListItems(page)).toHaveCount(2);
  const text = await fileListItems(page).allTextContents();
  expect(text.some((t) => t.includes("grundriss.pdf"))).toBe(true);
  expect(text.some((t) => t.includes("urlaubsfoto.jpg"))).toBe(true);
});

test("C) danach PNG auswählen -> alle drei bleiben erhalten", async ({
  page,
}) => {
  await gotoQuoteFileStep(page);
  await fileInput(page).setInputFiles([pdfFile("grundriss.pdf")]);
  await fileInput(page).setInputFiles([jpgFile("urlaubsfoto.jpg")]);
  await fileInput(page).setInputFiles([pngFile("grafik.png")]);

  await expect(fileListItems(page)).toHaveCount(3);
});

test("D) eine Datei entfernen -> nur diese verschwindet", async ({ page }) => {
  await gotoQuoteFileStep(page);
  await fileInput(page).setInputFiles([pdfFile("grundriss.pdf")]);
  await fileInput(page).setInputFiles([jpgFile("urlaubsfoto.jpg")]);
  await fileInput(page).setInputFiles([pngFile("grafik.png")]);

  await page
    .getByRole("button", { name: "Datei urlaubsfoto.jpg entfernen" })
    .click();

  await expect(fileListItems(page)).toHaveCount(2);
  const text = await fileListItems(page).allTextContents();
  expect(text.some((t) => t.includes("urlaubsfoto.jpg"))).toBe(false);
  expect(text.some((t) => t.includes("grundriss.pdf"))).toBe(true);
  expect(text.some((t) => t.includes("grafik.png"))).toBe(true);
});

test("E) Duplikat auswählen (gleicher Name/Größe) -> nicht doppelt vorhanden", async ({
  page,
}) => {
  await gotoQuoteFileStep(page);
  // Echte Datei auf der Platte: nur so bleibt `lastModified` zwischen zwei
  // Auswahlen identisch (In-Memory-Puffer erhalten bei jedem
  // setInputFiles einen neuen Zeitstempel - wie zwei verschiedene Dateien).
  const dir = mkdtempSync(join(tmpdir(), "simin-dup-"));
  const filePath = join(dir, "grundriss.pdf");
  writeFileSync(filePath, pdfFile("grundriss.pdf", 500).buffer);
  await fileInput(page).setInputFiles(filePath);
  await fileInput(page).setInputFiles(filePath);

  await expect(fileListItems(page)).toHaveCount(1);
});

test("F) 6 Dateien in einer Auswahl -> maximal 5, klare Fehlermeldung", async ({
  page,
}) => {
  await gotoQuoteFileStep(page);
  const files = Array.from({ length: 6 }, (_, i) =>
    pngFile(`foto${i + 1}.png`),
  );
  await fileInput(page).setInputFiles(files);

  const error = page.locator("#files-error");
  await expect(error).toHaveText(/maximal 5/i);
});

test("G) Gesamtgröße über dem Limit -> klare Fehlermeldung", async ({
  page,
}) => {
  await gotoQuoteFileStep(page);
  // 3 Dateien x 7 MB = 21 MB > MAX_TOTAL_FILE_SIZE_BYTES (20 MB), jede
  // einzeln unter MAX_FILE_SIZE_BYTES (8 MB) - löst gezielt den
  // Gesamtgrößen-Fehler aus, nicht den Einzeldatei- oder Anzahl-Fehler.
  const sevenMb = 7 * 1024 * 1024;
  const files = [
    pngFile("big1.png", sevenMb),
    pngFile("big2.png", sevenMb),
    pngFile("big3.png", sevenMb),
  ];
  await fileInput(page).setInputFiles(files);

  const error = page.locator("#files-error");
  await expect(error).toHaveText(/zusammen zu groß/i);
});

test("H) Submit mit 3 Dateien -> FormData enthält genau 3 files-Einträge", async ({
  page,
}) => {
  let filesFieldCount = 0;

  await page.route("**/api/quote", async (route) => {
    const postData = route.request().postData() ?? "";
    filesFieldCount = (postData.match(/name="files"/g) ?? []).length;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        attachmentsComplete: true,
        failedAttachmentNames: [],
      }),
    });
  });

  await gotoQuoteFileStep(page);
  await fileInput(page).setInputFiles([
    pdfFile("grundriss.pdf"),
    jpgFile("urlaubsfoto.jpg"),
    pngFile("grafik.png"),
  ]);

  await page.locator("#postalCode").fill("50667");
  await page.locator("#city").fill("Köln");
  await page.locator("#quote-next").click();

  await page.locator("#name").fill("Max Mustermann");
  await page.locator("#phone").fill("0221 1234567");
  await page.locator("#email").fill("max@example.com");
  await page.locator("#privacyAccepted").check();
  await page.locator("#quote-submit").click();

  await expect(page.locator("#quote-success")).toBeVisible();
  expect(filesFieldCount).toBe(3);
});

test("I) Submit ohne Datei -> bestehender Flow bleibt unverändert (kein files-Feld)", async ({
  page,
}) => {
  let filesFieldCount = 0;

  await page.route("**/api/quote", async (route) => {
    const postData = route.request().postData() ?? "";
    filesFieldCount = (postData.match(/name="files"/g) ?? []).length;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        attachmentsComplete: true,
        failedAttachmentNames: [],
      }),
    });
  });

  await gotoQuoteFileStep(page);
  await page.locator("#postalCode").fill("50667");
  await page.locator("#city").fill("Köln");
  await page.locator("#quote-next").click();

  await page.locator("#name").fill("Max Mustermann");
  await page.locator("#phone").fill("0221 1234567");
  await page.locator("#email").fill("max@example.com");
  await page.locator("#privacyAccepted").check();
  await page.locator("#quote-submit").click();

  await expect(page.locator("#quote-success")).toBeVisible();
  expect(filesFieldCount).toBe(0);
});
