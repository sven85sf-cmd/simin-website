export type QuoteService =
  | "gebaeudereinigung"
  | "objektservice"
  | "aussenanlagenpflege"
  | "winterdienst"
  | "mehrere-leistungen"
  | "noch-nicht-sicher";

export type QuotePropertyType = "wohnimmobilie" | "buero" | "praxis" | "gewerbeobjekt" | "sonstiges";

export interface QuoteFormData {
  service: QuoteService | "";
  propertyType: QuotePropertyType | "";
  postalCode: string;
  city: string;
  description: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  privacyAccepted: boolean;
}

export const emptyQuoteFormData: QuoteFormData = {
  service: "",
  propertyType: "",
  postalCode: "",
  city: "",
  description: "",
  name: "",
  company: "",
  phone: "",
  email: "",
  privacyAccepted: false,
};

export const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export const ALLOWED_FILE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
export const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
export const MAX_FILES = 5;
/** Obergrenze für die Summe aller Anhänge einer Anfrage (Mailprovider-Limit). */
export const MAX_TOTAL_FILE_SIZE_BYTES = 20 * 1024 * 1024;

export interface LabeledOption<T extends string> {
  value: T;
  label: string;
}

/** Einzige Quelle für die Leistungs-Labels – wird von Wizard-UI und Mail-Vorlage genutzt. */
export const SERVICE_OPTIONS: LabeledOption<QuoteService>[] = [
  { value: "gebaeudereinigung", label: "Gebäudereinigung" },
  { value: "objektservice", label: "Objektservice" },
  { value: "aussenanlagenpflege", label: "Außenanlagenpflege" },
  { value: "winterdienst", label: "Winterdienst" },
  { value: "mehrere-leistungen", label: "Mehrere Leistungen" },
  { value: "noch-nicht-sicher", label: "Noch nicht sicher" },
];

/** Einzige Quelle für die Objektart-Labels – wird von Wizard-UI und Mail-Vorlage genutzt. */
export const PROPERTY_TYPE_OPTIONS: LabeledOption<QuotePropertyType>[] = [
  { value: "wohnimmobilie", label: "Wohnimmobilie" },
  { value: "buero", label: "Büro" },
  { value: "praxis", label: "Praxis" },
  { value: "gewerbeobjekt", label: "Gewerbeobjekt" },
  { value: "sonstiges", label: "Sonstiges" },
];

export function serviceLabel(value: QuoteService | ""): string {
  return SERVICE_OPTIONS.find((option) => option.value === value)?.label ?? "Nicht angegeben";
}

export function propertyTypeLabel(value: QuotePropertyType | ""): string {
  return PROPERTY_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? "Nicht angegeben";
}
