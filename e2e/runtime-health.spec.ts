import { test, expect } from "@playwright/test";

/**
 * GET /api/runtime-health ist rein lesend (siehe Kommentar in der Route
 * selbst) - dieser Test führt keine Schreibzugriffe aus und benötigt keine
 * echten Wix-Zugangsdaten, da bereits das reine Laden der SDK-Pakete
 * (ohne API-Aufruf) geprüft wird.
 */
test("GET /api/runtime-health liefert JSON mit ausschließlich booleschen Feldern, keine Secrets", async ({
  request,
}) => {
  const response = await request.get("/api/runtime-health");

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/json");

  const body = await response.json();

  const expectedKeys = [
    "runtime",
    "requestHandler",
    "envModule",
    "collectionIdPresent",
    "wixEssentialsImport",
    "wixDataImport",
    "wixMediaImport",
  ];

  for (const key of expectedKeys) {
    expect(body, `Feld "${key}" fehlt in der Antwort`).toHaveProperty(key);
    expect(typeof body[key], `Feld "${key}" muss boolesch sein`).toBe(
      "boolean",
    );
  }

  // Niemals den tatsächlichen Wert der Collection-ID oder andere Secrets
  // in der Antwort - nur Präsenz als Boolean.
  const serialized = JSON.stringify(body);
  expect(serialized).not.toMatch(/[A-Za-z0-9]{20,}/);
});
