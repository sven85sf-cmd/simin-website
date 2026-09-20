/**
 * Strukturierte Leistungsdaten – zentrale Quelle für Startseite und
 * Leistungsunterseiten. Spätere CMS-Anbindung kann hier andocken.
 */

export type ServiceId = "gebaeudereinigung" | "objektservice" | "aussenanlagen" | "winterdienst";

export type ServiceFaq = {
  question: string;
  answer: string;
};

export type Service = {
  id: ServiceId;
  slug: string;
  accent: "blue" | "orange";
  navLabel: string;
  heroH1: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  shortText: string;
  homeItems: string[];
  intro: string;
  leistungen: string[];
  nutzen: string[];
  ablauf: string[];
  objektarten: string[];
  faq: ServiceFaq[];
};

export const services: Service[] = [
  {
    id: "gebaeudereinigung",
    slug: "gebaeudereinigung-koeln",
    accent: "blue",
    navLabel: "Gebäudereinigung",
    heroH1: "Gebäudereinigung in Köln",
    metaTitle: "Gebäudereinigung Köln | Gebäudedienste SIMIN",
    metaDescription:
      "Büro-, Praxis-, Treppenhaus- und Unterhaltsreinigung sowie Glas- und Fensterreinigung für Immobilien in Köln und Umgebung. Jetzt unverbindlich anfragen.",
    eyebrow: "GEBÄUDEREINIGUNG",
    shortText:
      "Saubere und hygienisch gepflegte Räume für Wohn-, Büro-, Praxis- und Gewerbeobjekte.",
    homeItems: [
      "Büro- & Praxisreinigung",
      "Treppenhausreinigung",
      "Unterhaltsreinigung",
      "Glas- & Fensterreinigung",
    ],
    intro:
      "Gepflegte Räume prägen den Eindruck einer Immobilie – für Mieter, Mitarbeitende und Besucher gleichermaßen. SIMIN übernimmt die Gebäudereinigung für Wohn-, Büro-, Praxis- und Gewerbeobjekte in Köln und Umgebung, abgestimmt auf den tatsächlichen Bedarf Ihres Objekts.",
    leistungen: [
      "Büro- & Praxisreinigung",
      "Treppenhausreinigung",
      "Unterhaltsreinigung",
      "Glas- & Fensterreinigung",
    ],
    nutzen: [
      "Ein fester Ansprechpartner für alle Reinigungsleistungen",
      "Leistungsumfang abgestimmt auf Objekt und Nutzung",
      "Klare Abläufe statt wechselnder Zuständigkeiten",
    ],
    ablauf: [
      "Sie schildern uns Ihr Objekt und den gewünschten Leistungsumfang.",
      "Wir besprechen Reinigungsintervalle und Besonderheiten vor Ort.",
      "Sie erhalten ein auf Ihr Objekt abgestimmtes Angebot.",
      "Nach Beauftragung koordinieren wir den Start der Reinigung.",
    ],
    objektarten: ["Wohnanlagen", "Büro & Praxis", "Gewerbeimmobilien", "Treppenhäuser"],
    faq: [
      {
        question: "Welche Reinigungsintervalle sind möglich?",
        answer:
          "Der Reinigungsrhythmus wird individuell mit Ihnen abgestimmt – von regelmäßiger Unterhaltsreinigung bis zu vereinbarten Einzelterminen.",
      },
      {
        question: "Reinigen Sie auch Gewerbe- und Praxisräume?",
        answer:
          "Ja, wir übernehmen die Reinigung für Büro-, Praxis- und Gewerbeobjekte, abgestimmt auf die jeweiligen Anforderungen.",
      },
      {
        question: "Ist die Glas- und Fensterreinigung Teil des Standardpakets?",
        answer:
          "Glas- und Fensterreinigung kann als eigene Leistung oder in Kombination mit der Unterhaltsreinigung vereinbart werden.",
      },
    ],
  },
  {
    id: "objektservice",
    slug: "objektservice-koeln",
    accent: "blue",
    navLabel: "Objektservice",
    heroH1: "Objektservice & Hausmeisterservice in Köln",
    metaTitle: "Objektservice & Hausmeisterservice Köln | Gebäudedienste SIMIN",
    metaDescription:
      "Objektbetreuung, Kontrollgänge, Mülltonnenbereitstellung und Kleinreparaturen für Immobilien in Köln und Umgebung. Jetzt unverbindlich anfragen.",
    eyebrow: "OBJEKTSERVICE",
    shortText:
      "Persönliche Betreuung und regelmäßige Kontrollen für gepflegte Allgemeinflächen und klare Abläufe im Objekt.",
    homeItems: [
      "Objektbetreuung & Kontrollgänge",
      "Kontrolle von Allgemeinflächen",
      "Mülltonnenbereitstellung",
      "Kleinreparaturen im vereinbarten Leistungsumfang",
    ],
    intro:
      "Ein gepflegtes Objekt braucht mehr als Reinigung: regelmäßige Kontrollen, verlässliche Abläufe und einen Ansprechpartner, der den Überblick behält. Unser Objektservice – vergleichbar mit einem klassischen Hausmeisterservice – übernimmt genau diese Aufgaben für Ihre Immobilie in Köln und Umgebung.",
    leistungen: [
      "Objektbetreuung & Kontrollgänge",
      "Kontrolle von Allgemeinflächen",
      "Mülltonnenbereitstellung",
      "Kleinreparaturen im vereinbarten Leistungsumfang",
    ],
    nutzen: [
      "Regelmäßige Kontrollen statt reaktivem Einzeleinsatz",
      "Ein Ansprechpartner für Objektbetreuung und Kleinreparaturen",
      "Leistungsumfang klar im Vorfeld vereinbart",
    ],
    ablauf: [
      "Sie teilen uns mit, welche Aufgaben im Objekt anfallen.",
      "Wir besprechen Kontrollintervalle und Zuständigkeiten.",
      "Sie erhalten ein abgestimmtes Angebot für den Objektservice.",
      "Nach Beauftragung übernehmen wir die laufende Betreuung.",
    ],
    objektarten: ["Wohnanlagen", "Büro & Praxis", "Gewerbeimmobilien"],
    faq: [
      {
        question: "Was umfassen Kleinreparaturen im Objektservice?",
        answer:
          "Kleinreparaturen werden im vereinbarten Leistungsumfang festgelegt und individuell mit Ihnen abgestimmt.",
      },
      {
        question: "Übernehmen Sie auch die Mülltonnenbereitstellung?",
        answer:
          "Ja, die Bereitstellung der Mülltonnen kann als Teil des Objektservice vereinbart werden.",
      },
      {
        question: "Wie oft finden Kontrollgänge statt?",
        answer:
          "Die Frequenz der Kontrollgänge richtet sich nach Größe und Bedarf des Objekts und wird individuell festgelegt.",
      },
    ],
  },
  {
    id: "aussenanlagen",
    slug: "aussenanlagenpflege-koeln",
    accent: "orange",
    navLabel: "Außenanlagenpflege",
    heroH1: "Außenanlagenpflege in Köln",
    metaTitle: "Außenanlagenpflege Köln | Gebäudedienste SIMIN",
    metaDescription:
      "Grünflächenpflege, Hof- und Wegepflege sowie Laubbeseitigung für Immobilien in Köln und Umgebung. Jetzt unverbindlich anfragen.",
    eyebrow: "AUSSENANLAGENPFLEGE",
    shortText:
      "Gepflegte Außenbereiche im Jahresverlauf – von der Grünpflege bis zur Betreuung bei Schnee und Glätte.",
    homeItems: ["Grünflächenpflege", "Hof- & Wegepflege", "Laubbeseitigung", "Winterdienst"],
    intro:
      "Gepflegte Außenanlagen prägen den ersten Eindruck einer Immobilie. SIMIN übernimmt die Pflege von Grünflächen, Höfen und Wegen für Ihr Objekt in Köln und Umgebung – abgestimmt auf die Jahreszeit und den tatsächlichen Pflegebedarf.",
    leistungen: ["Grünflächenpflege", "Hof- & Wegepflege", "Laubbeseitigung"],
    nutzen: [
      "Gepflegte Außenbereiche im Jahresverlauf",
      "Leistungsumfang passend zu Größe und Nutzung der Außenanlage",
      "Kombinierbar mit Winterdienst und Objektservice",
    ],
    ablauf: [
      "Sie beschreiben uns die Außenanlage und den gewünschten Pflegeumfang.",
      "Wir besprechen Pflegeintervalle und saisonale Besonderheiten.",
      "Sie erhalten ein abgestimmtes Angebot.",
      "Nach Beauftragung übernehmen wir die laufende Pflege.",
    ],
    objektarten: ["Wohnanlagen", "Gewerbeimmobilien", "Außenanlagen von Verwaltungen"],
    faq: [
      {
        question: "Wird die Grünflächenpflege regelmäßig durchgeführt?",
        answer:
          "Die Pflegeintervalle werden individuell mit Ihnen abgestimmt und richten sich nach Größe und Bewuchs der Außenanlage.",
      },
      {
        question: "Ist Laubbeseitigung Teil der Außenanlagenpflege?",
        answer:
          "Ja, Laubbeseitigung kann als saisonale Leistung im Rahmen der Außenanlagenpflege vereinbart werden.",
      },
    ],
  },
  {
    id: "winterdienst",
    slug: "winterdienst-koeln",
    accent: "orange",
    navLabel: "Winterdienst",
    heroH1: "Winterdienst in Köln",
    metaTitle: "Winterdienst Köln | Gebäudedienste SIMIN",
    metaDescription:
      "Winterdienst für Gehwege, Höfe und Zufahrten von Immobilien in Köln und Umgebung. Vereinbarte Leistungen bei Schnee und Glätte. Jetzt anfragen.",
    eyebrow: "WINTERDIENST",
    shortText: "Betreuung Ihrer Immobilie bei Schnee und Glätte im vereinbarten Leistungsumfang.",
    homeItems: ["Schnee- und Glättebeseitigung", "Gehwege & Zufahrten", "Streudienst"],
    intro:
      "Bei Schnee und Glätte zählt Zuverlässigkeit. SIMIN übernimmt den Winterdienst für Gehwege, Höfe und Zufahrten Ihrer Immobilie in Köln und Umgebung – im vereinbarten Leistungsumfang und abgestimmt auf Ihr Objekt.",
    leistungen: ["Schnee- und Glättebeseitigung", "Gehwege & Zufahrten", "Streudienst"],
    nutzen: [
      "Vereinbarter Leistungsumfang für die Wintersaison",
      "Ansprechpartner für Gehwege, Höfe und Zufahrten",
      "Kombinierbar mit Außenanlagenpflege",
    ],
    ablauf: [
      "Sie teilen uns die zu betreuenden Flächen Ihres Objekts mit.",
      "Wir besprechen den Leistungsumfang für die Wintersaison.",
      "Sie erhalten ein abgestimmtes Angebot.",
      "Nach Beauftragung koordinieren wir den Einsatz bei Schnee und Glätte.",
    ],
    objektarten: ["Wohnanlagen", "Gewerbeimmobilien", "Verwaltungsobjekte"],
    faq: [
      {
        question: "Welche Flächen umfasst der Winterdienst?",
        answer:
          "Der Leistungsumfang – etwa Gehwege, Höfe oder Zufahrten – wird individuell für Ihr Objekt vereinbart.",
      },
      {
        question: "Ist der Winterdienst mit der Außenanlagenpflege kombinierbar?",
        answer:
          "Ja, Winterdienst und Außenanlagenpflege können als aufeinander abgestimmte Leistungen vereinbart werden.",
      },
    ],
  },
];

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}
