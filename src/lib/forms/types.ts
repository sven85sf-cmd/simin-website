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
