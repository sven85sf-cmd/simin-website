import { test, expect } from "@playwright/test";
import {
  createAttachmentToken,
  verifyAttachmentToken,
} from "../src/lib/attachmentLink";

/**
 * Echte, ausgeführte Korrektheitstests für die Capability-Token-Logik
 * (Abschnitt 22 E-I). Bewusst gegen `../src/lib/attachmentLink` (relativer
 * Pfad statt `@/`-Alias): die Datei importiert weder das Wix-SDK noch
 * `astro:env/server` und läuft deshalb - anders als quote.ts/attachment.ts
 * selbst - ohne Astro-Pipeline, ohne Wix-Zugangsdaten und ohne laufenden
 * Server direkt unter Node/Playwright. Damit sind dies die einzigen Tests
 * dieses gesamten Projekts, die die tatsächliche Signatur-/Ablauflogik zur
 * Laufzeit verifizieren, statt sie nur am Quellcode zu prüfen.
 */

const SECRET = "test-signing-secret-do-not-use-in-production";
const OTHER_SECRET = "a-different-secret-entirely";

test("E) gültiges Token mit korrekter Signatur wird akzeptiert", async () => {
  const token = await createAttachmentToken("file-abc-123", SECRET, 1);
  const result = await verifyAttachmentToken(token, SECRET);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.fileId).toBe("file-abc-123");
  }
});

test("F) manipuliertes Token (veränderte Signatur) wird abgelehnt", async () => {
  const token = await createAttachmentToken("file-abc-123", SECRET, 1);
  const [payload, signature] = token.split(".");
  const tamperedSignature =
    signature.slice(0, -2) + (signature.slice(-2) === "AA" ? "BB" : "AA");
  const tamperedToken = `${payload}.${tamperedSignature}`;

  const result = await verifyAttachmentToken(tamperedToken, SECRET);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.reason).toBe("INVALID_SIGNATURE");
});

test("F) Token, signiert mit einem anderen Secret, wird abgelehnt", async () => {
  const token = await createAttachmentToken("file-abc-123", OTHER_SECRET, 1);
  const result = await verifyAttachmentToken(token, SECRET);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.reason).toBe("INVALID_SIGNATURE");
});

test("G) abgelaufenes Token wird abgelehnt (EXPIRED, nicht INVALID_SIGNATURE)", async () => {
  // Negative TTL erzeugt ein exp in der Vergangenheit, ohne warten zu müssen.
  const token = await createAttachmentToken("file-abc-123", SECRET, -1);
  const result = await verifyAttachmentToken(token, SECRET);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.reason).toBe("EXPIRED");
});

test("H) leeres/fehlendes Token wird als MALFORMED abgelehnt", async () => {
  const result = await verifyAttachmentToken("", SECRET);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.reason).toBe("MALFORMED");
});

test("H) Token ohne Punkt-Trenner wird als MALFORMED abgelehnt", async () => {
  const result = await verifyAttachmentToken("keinvalidesformat", SECRET);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.reason).toBe("MALFORMED");
});

test("I) fileId im Payload geändert, ohne neu zu signieren -> abgelehnt (Signatur passt nicht mehr)", async () => {
  const token = await createAttachmentToken("file-abc-123", SECRET, 1);
  const [payloadB64, signatureB64] = token.split(".");

  const base64UrlDecode = (value: string) => {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return Buffer.from(padded, "base64").toString("utf-8");
  };
  const base64UrlEncode = (value: string) =>
    Buffer.from(value, "utf-8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const decoded = JSON.parse(base64UrlDecode(payloadB64));
  decoded.f = "a-completely-different-file-id";
  const forgedPayload = base64UrlEncode(JSON.stringify(decoded));
  const forgedToken = `${forgedPayload}.${signatureB64}`;

  const result = await verifyAttachmentToken(forgedToken, SECRET);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.reason).toBe("INVALID_SIGNATURE");
});

test("Zwei Anhänge erzeugen zwei unabhängige, jeweils nur für ihren eigenen fileId gültige Tokens", async () => {
  const tokenA = await createAttachmentToken("file-a", SECRET, 1);
  const tokenB = await createAttachmentToken("file-b", SECRET, 1);

  const resultA = await verifyAttachmentToken(tokenA, SECRET);
  const resultB = await verifyAttachmentToken(tokenB, SECRET);
  expect(resultA.ok && resultA.fileId).toBe("file-a");
  expect(resultB.ok && resultB.fileId).toBe("file-b");

  // Token von A darf NICHT für B gültig "umgebogen" werden können, indem
  // man einfach Bs Payload mit As Signatur kombiniert.
  const forged = `${tokenB.split(".")[0]}.${tokenA.split(".")[1]}`;
  const forgedResult = await verifyAttachmentToken(forged, SECRET);
  expect(forgedResult.ok).toBe(false);
});
