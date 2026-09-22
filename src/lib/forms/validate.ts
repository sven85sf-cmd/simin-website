import {
  ALLOWED_FILE_EXTENSIONS,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES,
  MAX_TOTAL_FILE_SIZE_BYTES,
  type QuoteFormData,
  type QuotePropertyType,
  type QuoteService,
} from "./types";

const SERVICES: QuoteService[] = [
  "gebaeudereinigung",
  "objektservice",
  "aussenanlagenpflege",
  "winterdienst",
  "mehrere-leistungen",
  "noch-nicht-sicher",
];

const PROPERTY_TYPES: QuotePropertyType[] = ["wohnimmobilie", "buero", "praxis", "gewerbeobjekt", "sonstiges"];

const POSTAL_CODE_PATTERN = /^\d{5}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+0-9 ()/-]{6,}$/;

export type ValidationErrors = Partial<Record<keyof QuoteFormData, string>>;

export function validateQuoteFormData(data: QuoteFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.service || !SERVICES.includes(data.service as QuoteService)) {
    errors.service = "Bitte wählen Sie eine Leistung aus.";
  }
  if (!data.propertyType || !PROPERTY_TYPES.includes(data.propertyType as QuotePropertyType)) {
    errors.propertyType = "Bitte wählen Sie eine Objektart aus.";
  }
  if (!POSTAL_CODE_PATTERN.test(data.postalCode.trim())) {
    errors.postalCode = "Bitte geben Sie eine gültige 5-stellige Postleitzahl ein.";
  }
  if (!data.city.trim()) {
    errors.city = "Bitte geben Sie den Ort ein.";
  }
  if (!data.name.trim()) {
    errors.name = "Bitte geben Sie Ihren Vor- und Nachnamen ein.";
  }
  if (!PHONE_PATTERN.test(data.phone.trim())) {
    errors.phone = "Bitte geben Sie eine gültige Telefonnummer ein.";
  }
  if (!EMAIL_PATTERN.test(data.email.trim())) {
    errors.email = "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
  }
  if (!data.privacyAccepted) {
    errors.privacyAccepted = "Bitte bestätigen Sie den Hinweis zum Datenschutz.";
  }

  return errors;
}

export type FileValidationError = { file: string; reason: string };

function hasAllowedExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ALLOWED_FILE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Schnelle Prüfungen, die sowohl im Browser (sofortiges UI-Feedback) als
 * auch serverseitig laufen. Verlässt sich auf vom Client gemeldete Werte
 * (MIME-Type, Größe) – die serverseitige Route führt zusätzlich
 * `validateFileSignatures()` aus, die sich NICHT auf Client-Angaben
 * verlässt.
 */
export function validateFiles(files: File[]): FileValidationError[] {
  const errors: FileValidationError[] = [];

  if (files.length > MAX_FILES) {
    errors.push({ file: "", reason: `Es können maximal ${MAX_FILES} Dateien hochgeladen werden.` });
  }

  let totalSize = 0;
  for (const file of files) {
    totalSize += file.size;
    if (file.size === 0) {
      errors.push({ file: file.name, reason: "Datei ist leer." });
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type) || !hasAllowedExtension(file.name)) {
      errors.push({ file: file.name, reason: "Dateityp nicht erlaubt (nur Fotos oder PDF)." });
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      errors.push({ file: file.name, reason: "Datei ist zu groß (maximal 8 MB)." });
    }
  }

  if (totalSize > MAX_TOTAL_FILE_SIZE_BYTES) {
    errors.push({
      file: "",
      reason: `Die Dateien sind zusammen zu groß (maximal ${Math.floor(MAX_TOTAL_FILE_SIZE_BYTES / (1024 * 1024))} MB insgesamt). Bitte laden Sie weniger oder kleinere Dateien hoch.`,
    });
  }

  return errors;
}

/** Magic Bytes (Datei-Signaturen) der erlaubten Dateitypen. */
const FILE_SIGNATURES: { type: string; bytes: number[]; offset?: number }[] = [
  { type: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { type: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { type: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] }, // "%PDF-"
  // WEBP: "RIFF" .... "WEBP" – zwei getrennte Signaturen, siehe checkWebp().
];

function matchesSignature(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

function isValidWebp(bytes: Uint8Array): boolean {
  const RIFF = [0x52, 0x49, 0x46, 0x46];
  const WEBP = [0x57, 0x45, 0x42, 0x50];
  return matchesSignature(bytes, RIFF, 0) && matchesSignature(bytes, WEBP, 8);
}

/**
 * Serverseitige Prüfung der tatsächlichen Dateiinhalte (Magic Bytes) gegen
 * den behaupteten Dateityp. Verhindert, dass eine umbenannte Datei (z. B.
 * `script.html` → `foto.jpg`) allein durch einen falschen Dateinamen bzw.
 * einen vom Client gesetzten MIME-Type als Bild/PDF akzeptiert wird.
 */
export async function validateFileSignatures(files: File[]): Promise<FileValidationError[]> {
  const errors: FileValidationError[] = [];

  for (const file of files) {
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const isWebp = file.type === "image/webp" && isValidWebp(head);
    const matchesKnownType = FILE_SIGNATURES.some(
      (signature) => file.type === signature.type && matchesSignature(head, signature.bytes),
    );

    if (!isWebp && !matchesKnownType) {
      errors.push({ file: file.name, reason: "Dateiinhalt entspricht nicht dem erwarteten Dateityp." });
    }
  }

  return errors;
}
