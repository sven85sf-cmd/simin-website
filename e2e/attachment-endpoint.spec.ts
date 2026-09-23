import { test, expect } from "@playwright/test";
import { createAttachmentToken } from "../src/lib/attachmentLink";

/**
 * Integrationstests gegen den echten, laufenden /api/attachment-Endpoint
 * (Abschnitt 22 H-K). Läuft gegen denselben lokalen Dev-Server wie
 * quote-api.spec.ts (siehe playwright.config.ts) - unterliegt derselben,
 * dort dokumentierten Sandbox-Einschränkung: ohne echte, per
 * `npx wix env pull` bezogene Wix-Zugangsdaten schlägt die globale
 * @wix/astro-Auth-Middleware für JEDE Route fehl (auch diese hier), bevor
 * der eigentliche Handler-Code überhaupt erreicht wird - das ist keine
 * Eigenschaft dieses Endpoints.
 *
 * Für den "gültiges Token"-Fall (J) muss der Testlauf mit demselben
 * ATTACHMENT_LINK_SIGNING_SECRET gestartet werden, mit dem dieser Test
 * seine eigenen Test-Tokens signiert - siehe TEST_SIGNING_SECRET unten.
 * Ohne echte Wix-Zugangsdaten schlägt der eigentliche
 * generateFileDownloadUrl()-Aufruf danach zwangsläufig fehl; das prüft
 * gleichzeitig live den kontrollierten Fehlerfall (K).
 */

const TEST_SIGNING_SECRET = "e2e-test-signing-secret-not-a-real-secret";

test("H) fehlendes Token liefert 400, keinen nackten 500", async ({
  request,
}) => {
  const response = await request.get("/api/attachment", { maxRedirects: 0 });
  expect(response.status()).toBe(400);
});

test("F) manipuliertes/ungültiges Token liefert 403", async ({ request }) => {
  const response = await request.get(
    "/api/attachment?token=offensichtlich-ungueltig",
    { maxRedirects: 0 },
  );
  expect(response.status()).toBe(403);
});

test("G) abgelaufenes Token liefert 410, mit verständlicher Meldung statt Stacktrace", async ({
  request,
}) => {
  const token = await createAttachmentToken(
    "test-file-id",
    TEST_SIGNING_SECRET,
    -1,
  );
  const response = await request.get(`/api/attachment?token=${token}`, {
    maxRedirects: 0,
  });
  expect(response.status()).toBe(410);
  const body = await response.text();
  expect(body).toContain("abgelaufen");
  expect(body).not.toContain("at ");
  expect(body).not.toContain("node_modules");
});

test("J/K) gültiges, nicht abgelaufenes Token erreicht die Wix-Download-Erzeugung: entweder Redirect (J) oder kontrollierter Fehler ohne Stacktrace (K), NIE ein nackter 500", async ({
  request,
}) => {
  const token = await createAttachmentToken(
    "test-file-id",
    TEST_SIGNING_SECRET,
    1,
  );
  const response = await request.get(`/api/attachment?token=${token}`, {
    maxRedirects: 0,
  });

  if (response.status() === 302) {
    expect(response.headers()["location"]).toBeTruthy();
  } else {
    // Ohne echte Wix-Zugangsdaten in dieser Umgebung erwartbar: die
    // Token-Prüfung ist bereits erfolgreich durchlaufen, aber der
    // anschließende echte Wix-API-Aufruf schlägt mangels echter
    // Zugangsdaten fehl - das MUSS als kontrollierte Antwort ankommen.
    expect(response.status()).toBe(502);
    const body = await response.text();
    expect(body).not.toContain("at ");
    expect(body).not.toContain("node_modules");
  }
});
