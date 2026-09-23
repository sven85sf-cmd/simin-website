/**
 * Signierte Capability-Token für den Zugriff auf private Wix-Media-Anhänge
 * über /api/attachment (siehe dort).
 *
 * Ausschließlich Web Crypto (`crypto.subtle`), KEINE Node-only crypto API
 * (`node:crypto`) - läuft dadurch identisch im Cloudflare-Worker-Runtime
 * (Wix-Hosting-Adapter) und in lokalem Node. Reiner Utility-Code ohne
 * Wix-SDK-Import, daher sicher von submissionsRepository.ts statisch
 * importierbar, ohne die @wix/media-Modulisolierung zu verletzen.
 *
 * Tokenformat (Abschnitt 8): `payloadBase64Url.signatureBase64Url`.
 * Payload: `{ v: 1, f: "<fileId>", exp: <unix-seconds> }` - bewusst KEINE
 * PII (kein Name, keine E-Mail, keine Telefonnummer, keine Beschreibung).
 */

interface AttachmentTokenPayload {
  v: 1;
  f: string;
  exp: number;
}

export type AttachmentTokenVerification =
  | { ok: true; fileId: string }
  | { ok: false; reason: "MALFORMED" | "INVALID_SIGNATURE" | "EXPIRED" };

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * `crypto.subtle.verify()`s TS-Signatur erwartet `BufferSource`; je nach
 * TS-lib-Version wird ein einfaches `Uint8Array` dafür als zu allgemein
 * (`ArrayBufferLike` statt konkret `ArrayBuffer`) abgelehnt, sobald mehr
 * als ein solches Argument in einem Aufruf zusammentrifft. Diese Kopie in
 * ein garantiertes `ArrayBuffer` behebt das rein auf Typebene - am
 * Laufzeitverhalten ändert sich nichts.
 */
function toBufferSource(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

async function importSigningKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/**
 * Erzeugt ein Capability-Token für genau eine Datei, gültig für
 * `ttlHours` Stunden ab jetzt. `ttlHours` darf gebrochen sein (z. B. 0.5),
 * wird aber intern auf volle Sekunden gerundet.
 */
export async function createAttachmentToken(
  fileId: string,
  secret: string,
  ttlHours: number,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + Math.round(ttlHours * 60 * 60);
  const payload: AttachmentTokenPayload = { v: 1, f: fileId, exp };
  const payloadB64 = bytesToBase64Url(
    new TextEncoder().encode(JSON.stringify(payload)),
  );

  const key = await importSigningKey(secret);
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadB64),
  );
  const signatureB64 = bytesToBase64Url(new Uint8Array(signatureBytes));

  return `${payloadB64}.${signatureB64}`;
}

/**
 * Verifiziert Format, Signatur (`crypto.subtle.verify` - konstantzeitiger
 * Vergleich durch die Web-Crypto-Implementierung selbst) und Ablauf eines
 * Tokens. Ein manipuliertes Token (auch nur der fileId-Teil) fällt bei der
 * Signaturprüfung durch, BEVOR der Payload überhaupt inhaltlich
 * ausgewertet wird - ein Token gilt daher ausschließlich für exakt den
 * darin signierten fileId.
 */
export async function verifyAttachmentToken(
  token: string,
  secret: string,
): Promise<AttachmentTokenVerification> {
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { ok: false, reason: "MALFORMED" };
  }
  const [payloadB64, signatureB64] = parts;

  let key: CryptoKey;
  let signatureBytes: Uint8Array;
  let isValid: boolean;
  try {
    key = await importSigningKey(secret);
    signatureBytes = base64UrlToBytes(signatureB64);
    isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      toBufferSource(signatureBytes),
      toBufferSource(new TextEncoder().encode(payloadB64)),
    );
  } catch {
    return { ok: false, reason: "MALFORMED" };
  }

  if (!isValid) {
    return { ok: false, reason: "INVALID_SIGNATURE" };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(payloadB64)),
    );
  } catch {
    return { ok: false, reason: "MALFORMED" };
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    (payload as Record<string, unknown>).v !== 1 ||
    typeof (payload as Record<string, unknown>).f !== "string" ||
    typeof (payload as Record<string, unknown>).exp !== "number"
  ) {
    return { ok: false, reason: "MALFORMED" };
  }

  const { f: fileId, exp } = payload as AttachmentTokenPayload;
  if (Date.now() > exp * 1000) {
    return { ok: false, reason: "EXPIRED" };
  }

  return { ok: true, fileId };
}
