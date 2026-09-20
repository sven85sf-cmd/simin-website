import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES,
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

export function validateFiles(files: File[]): FileValidationError[] {
  const errors: FileValidationError[] = [];

  if (files.length > MAX_FILES) {
    errors.push({ file: "", reason: `Es können maximal ${MAX_FILES} Dateien hochgeladen werden.` });
  }

  for (const file of files) {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      errors.push({ file: file.name, reason: "Dateityp nicht erlaubt (nur Fotos oder PDF)." });
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      errors.push({ file: file.name, reason: "Datei ist zu groß (maximal 8 MB)." });
    }
  }

  return errors;
}
