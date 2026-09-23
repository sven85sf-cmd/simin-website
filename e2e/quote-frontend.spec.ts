import { test, expect } from "@playwright/test";

/**
 * Testet die Absicherung aus Sektion 15: QuoteWizard.astro darf niemals
 * `await response.json()` blind aufrufen. Diese Tests laufen im echten
 * Browser, mocken aber die /api/quote-Antwort via page.route() - es wird
 * kein echter Server-Request an Wix ausgelöst.
 */

async function fillAndReachSubmit(page: import("@playwright/test").Page) {
  await page.goto("/angebot");

  await page.locator('label[for="service-gebaeudereinigung"]').click();
  await page.locator("#quote-next").click();

  await page.locator('label[for="property-buero"]').click();
  await page.locator("#quote-next").click();

  await page.locator("#postalCode").fill("50667");
  await page.locator("#city").fill("Köln");
  await page.locator("#quote-next").click();

  await page.locator("#name").fill("Max Mustermann");
  await page.locator("#phone").fill("0221 1234567");
  await page.locator("#email").fill("max@example.com");
  await page.locator("#privacyAccepted").check();
}

test("Nicht-JSON-Fehlerantwort (z. B. Plattform-Fehlerseite) zeigt die generische Meldung, NICHT die Internetverbindungs-Meldung", async ({
  page,
}) => {
  await page.route("**/api/quote", (route) =>
    route.fulfill({
      status: 500,
      contentType: "text/html",
      body: "<html><body>Internal Server Error</body></html>",
    }),
  );

  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await fillAndReachSubmit(page);
  await page.locator("#quote-submit").click();

  const banner = page.locator("#quote-error-banner");
  await expect(banner).toBeVisible();
  const text = await banner.textContent();

  expect(text).not.toContain("Internetverbindung");
  expect(text).toMatch(/erneut/);

  // Kein unbehandelter Laufzeitfehler durch den blinden response.json()-Aufruf.
  expect(consoleErrors).toEqual([]);
});

test("Echte Netzwerkstörung (fetch schlägt fehl) zeigt weiterhin die Internetverbindungs-Meldung", async ({
  page,
}) => {
  await page.route("**/api/quote", (route) => route.abort("failed"));

  await fillAndReachSubmit(page);
  await page.locator("#quote-submit").click();

  const banner = page.locator("#quote-error-banner");
  await expect(banner).toBeVisible();
  const text = await banner.textContent();

  expect(text).toContain("Internetverbindung");
});

test("Gültige JSON-Fehlerantwort (z. B. 502 WIX_DATA_ERROR) zeigt die serverseitige Fehlermeldung", async ({
  page,
}) => {
  await page.route("**/api/quote", (route) =>
    route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        error: "Ihre Anfrage konnte gerade nicht übermittelt werden.",
        code: "WIX_DATA_ERROR",
      }),
    }),
  );

  await fillAndReachSubmit(page);
  await page.locator("#quote-submit").click();

  const banner = page.locator("#quote-error-banner");
  await expect(banner).toBeVisible();
  const text = await banner.textContent();

  expect(text).toContain(
    "Ihre Anfrage konnte gerade nicht übermittelt werden.",
  );
  expect(text).not.toContain("Internetverbindung");
});

test("Erfolgreiche JSON-Antwort (vollständig, attachmentsComplete:true) zeigt die normale Erfolgsmeldung", async ({
  page,
}) => {
  await page.route("**/api/quote", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        attachmentsComplete: true,
        failedAttachmentNames: [],
      }),
    }),
  );

  await fillAndReachSubmit(page);
  await page.locator("#quote-submit").click();

  await expect(page.locator("#quote-success")).toBeVisible();
  await expect(page.locator("#quote-partial-success")).toBeHidden();
});

test("Erfolgreiche JSON-Antwort ohne attachmentsComplete-Feld (Altformat) zeigt weiterhin die normale Erfolgsmeldung", async ({
  page,
}) => {
  await page.route("**/api/quote", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    }),
  );

  await fillAndReachSubmit(page);
  await page.locator("#quote-submit").click();

  await expect(page.locator("#quote-success")).toBeVisible();
});

test("Teilerfolg (attachmentsComplete:false) zeigt die Warnmeldung mit den fehlgeschlagenen Dateinamen, NICHT die normale Erfolgsmeldung", async ({
  page,
}) => {
  await page.route("**/api/quote", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        attachmentsComplete: false,
        failedAttachmentNames: ["grundriss.pdf"],
      }),
    }),
  );

  await fillAndReachSubmit(page);
  await page.locator("#quote-submit").click();

  const partial = page.locator("#quote-partial-success");
  await expect(partial).toBeVisible();
  await expect(page.locator("#quote-success")).toBeHidden();

  const text = await partial.textContent();
  expect(text).toContain("grundriss.pdf");
  expect(text).not.toContain("Internetverbindung");
});
