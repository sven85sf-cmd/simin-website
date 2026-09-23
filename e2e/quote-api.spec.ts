import { test, expect } from "@playwright/test";

/**
 * Integrationstests gegen den echten, laufenden Astro-Dev-Server (Node-
 * Adapter, siehe playwright.config.ts). Diese Tests laufen NIE gegen echte
 * Wix-Endpunkte - jeder hier ausgelöste Pfad wird bereits VOR dem
 * dynamischen Import der Wix-Persistenzschicht beantwortet (Origin-Check,
 * Content-Type, Validierung), sodass keine Wix-Zugangsdaten nötig sind.
 *
 * Jeder Testfall bekommt einen eigenen `cf-connecting-ip`-Header, damit die
 * Tests sich nicht gegenseitig über den In-Memory-Rate-Limiter (rateLimit.ts,
 * 5 Anfragen / Schlüssel / 10 Minuten) beeinflussen.
 */

const ALLOWED_ORIGIN = "https://www.gebaeudedienste-simin.de";

function multipartBody(overrides: Record<string, string> = {}) {
  return {
    service: "gebaeudereinigung",
    propertyType: "buero",
    postalCode: "50667",
    city: "Köln",
    description: "Testbeschreibung für die Angebotsanfrage.",
    name: "Max Mustermann",
    company: "",
    phone: "0221 1234567",
    email: "max@example.com",
    privacyAccepted: "on",
    ...overrides,
  };
}

test("POST /api/quote mit falscher Origin liefert JSON 403, keinen nackten 500", async ({
  request,
}) => {
  const response = await request.post("/api/quote", {
    headers: {
      origin: "https://evil-attacker.example.com",
      "cf-connecting-ip": "203.0.113.10",
    },
    multipart: multipartBody(),
  });

  expect(response.status()).toBe(403);
  expect(response.headers()["content-type"]).toContain("application/json");

  const body = await response.json();
  expect(body.ok).toBe(false);
  expect(body.code).toBe("ORIGIN_REJECTED");
});

test("POST /api/quote ohne Origin-Header liefert JSON 403", async ({
  request,
}) => {
  const response = await request.post("/api/quote", {
    headers: { "cf-connecting-ip": "203.0.113.11" },
    multipart: multipartBody(),
  });

  expect(response.status()).toBe(403);
  const body = await response.json();
  expect(body.code).toBe("ORIGIN_REJECTED");
});

test("POST /api/quote mit erlaubter Origin, aber ungültigen Daten liefert JSON 422, keinen nackten 500", async ({
  request,
}) => {
  const response = await request.post("/api/quote", {
    headers: {
      origin: ALLOWED_ORIGIN,
      "cf-connecting-ip": "203.0.113.12",
    },
    multipart: multipartBody({
      service: "",
      email: "keine-email",
      privacyAccepted: "",
    }),
  });

  expect(response.status()).toBe(422);
  expect(response.headers()["content-type"]).toContain("application/json");

  const body = await response.json();
  expect(body.ok).toBe(false);
  expect(body.code).toBe("VALIDATION_ERROR");
  expect(body.fieldErrors).toBeTruthy();
});

test("POST /api/quote mit falschem Content-Type liefert JSON 415", async ({
  request,
}) => {
  const response = await request.post("/api/quote", {
    headers: {
      origin: ALLOWED_ORIGIN,
      "cf-connecting-ip": "203.0.113.13",
      "content-type": "application/json",
    },
    data: JSON.stringify({ foo: "bar" }),
  });

  expect(response.status()).toBe(415);
  const body = await response.json();
  expect(body.code).toBe("CONTENT_TYPE_ERROR");
});

test("GET /api/quote ist nicht erlaubt, erzeugt aber keinen nackten 500", async ({
  request,
}) => {
  const response = await request.get("/api/quote", {
    headers: { origin: ALLOWED_ORIGIN },
  });

  // Astro beantwortet eine nicht implementierte Methode mit 404/405 -
  // in jedem Fall NICHT mit einem nackten, unbehandelten 500.
  expect(response.status()).not.toBe(500);
});

test("Honeypot-Feld wird als Erfolg quittiert, ohne die Anfrage zu verarbeiten", async ({
  request,
}) => {
  const response = await request.post("/api/quote", {
    headers: {
      origin: ALLOWED_ORIGIN,
      "cf-connecting-ip": "203.0.113.14",
    },
    multipart: multipartBody({ website: "http://spam.example.com" }),
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.ok).toBe(true);
});
