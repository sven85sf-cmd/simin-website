/**
 * Zentrale Site-Konfiguration.
 * Unternehmensdaten, Navigation, Feature-Flags und SEO-Defaults werden
 * ausschließlich hier gepflegt und nirgendwo sonst hart codiert.
 */

export const company = {
  name: "Gebäudedienste SIMIN",
  legalName: "Gebäudedienste SIMIN",
  claim: "SAUBER. ZUVERLÄSSIG. PERSÖNLICH.",
  positioning: "Gepflegte Immobilien. Alles aus einer Hand.",
  address: {
    street: "Gilgaustraße 64",
    postalCode: "51149",
    city: "Köln",
    country: "Deutschland",
  },
  phone: {
    display: "0151 546 844 65",
    href: "tel:015154684465",
    e164: "+49 151 54684465",
  },
  email: {
    display: "kontakt@gebaeudedienste-simin.de",
    href: "mailto:kontakt@gebaeudedienste-simin.de",
  },
  url: "https://www.gebaeudedienste-simin.de/",
} as const;

export const fullAddress = `${company.address.street}, ${company.address.postalCode} ${company.address.city}`;

/**
 * Link zu Google-Bewertungen. Solange kein verifizierter Google-Business-
 * Profil-Link vorliegt, zeigt dies bewusst nur auf eine generische
 * Google-Suche (keine erfundene Profil-ID, keine Rating-Daten).
 *
 * TODO: echten verifizierten Google-Business-Profil-Link einsetzen, sobald
 * verfügbar (z. B. https://g.page/... oder der "Rezension schreiben"-Link
 * aus dem Google-Business-Profil-Dashboard).
 */
export const googleBusinessUrl = `https://www.google.com/search?q=${encodeURIComponent(
  `${company.name} ${company.address.city} Bewertungen`,
)}`;

export type NavDropdownItem = {
  label: string;
  href: string;
};

export type NavItem = {
  label: string;
  href: string;
  dropdown?: NavDropdownItem[];
};

export const primaryNav: NavItem[] = [
  {
    label: "Leistungen",
    href: "/gebaeudereinigung-koeln",
    dropdown: [
      { label: "Gebäudereinigung", href: "/gebaeudereinigung-koeln" },
      { label: "Objektservice", href: "/objektservice-koeln" },
      { label: "Außenanlagenpflege", href: "/aussenanlagenpflege-koeln" },
      { label: "Winterdienst", href: "/winterdienst-koeln" },
    ],
  },
  { label: "Für Immobilien", href: "/fuer-hausverwaltungen" },
  { label: "Referenzen", href: "/referenzen" },
  { label: "Über uns", href: "/ueber-uns" },
  { label: "Kontakt", href: "/kontakt" },
];

/** Feature-Flags zur Steuerung sichtbarer Module ohne Code-Änderung. */
export const features = {
  /** Referenzen-Seite im Hauptmenü zeigen, sobald echte, dokumentierte Kundenreferenzfotos vorliegen. */
  referencesPage: false,
  /** Kundenstimmen-Sektion aktiv. Bleibt aus, solange keine echten, freigegebenen Kundenstimmen vorliegen. */
  testimonials: false,
} as const;

export const visiblePrimaryNav: NavItem[] = primaryNav.filter(
  (item) => item.href !== "/referenzen" || features.referencesPage,
);

export const footerNav = {
  leistungen: [
    { label: "Gebäudereinigung", href: "/gebaeudereinigung-koeln" },
    { label: "Objektservice", href: "/objektservice-koeln" },
    { label: "Außenanlagenpflege", href: "/aussenanlagenpflege-koeln" },
    { label: "Winterdienst", href: "/winterdienst-koeln" },
  ],
  unternehmen: [
    { label: "Über uns", href: "/ueber-uns" },
    ...(features.referencesPage ? [{ label: "Referenzen", href: "/referenzen" }] : []),
    { label: "Kontakt", href: "/kontakt" },
  ],
  service: [
    { label: "Angebot anfragen", href: "/angebot" },
    { label: "Herbst & Winter", href: "/herbst-winter" },
  ],
  legal: [
    { label: "Impressum", href: "/impressum" },
    { label: "Datenschutz", href: "/datenschutz" },
  ],
};

export type SeasonalCampaignType = "autumn-winter";

export const seasonalCampaign = {
  active: true,
  type: "autumn-winter" as SeasonalCampaignType,
  eyebrow: "HERBST & WINTER",
  headline: "GUT GERÜSTET\nFÜR HERBST & WINTER.",
  text: "Wenn Laub, Nässe, Schnee und Glätte die Außenbereiche stärker beanspruchen, kümmern wir uns um die vereinbarten saisonalen Leistungen rund um Ihre Immobilie.",
  keywords: ["LAUBBESEITIGUNG", "WINTERDIENST", "AUSSENANLAGENPFLEGE"],
  claim: "LAUB RAUS.\nBEREIT FÜR DEN WINTER.",
  href: "/herbst-winter",
} as const;

export const seoDefaults = {
  titleTemplate: (title: string) => `${title} | Gebäudedienste SIMIN`,
  homeTitle: "Gebäudedienste SIMIN | Gebäudereinigung & Objektservice Köln",
  homeDescription:
    "Gebäudereinigung, Objektservice, Außenanlagenpflege und Winterdienst für Immobilien, Unternehmen und Verwaltungen in Köln und Umgebung. Jetzt unverbindlich anfragen.",
  ogTitle: "Gebäudedienste SIMIN – Gepflegte Immobilien. Alles aus einer Hand.",
  ogDescription:
    "Gebäudereinigung, Objektservice und Außenanlagenpflege für Immobilien in Köln und Umgebung.",
  defaultOgImage: "/images/og-default.jpg",
  locale: "de_DE",
} as const;
