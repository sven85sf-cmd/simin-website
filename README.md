# Gebäudedienste SIMIN — Website V1

Neu aufgebaute Website für Gebäudedienste SIMIN (Köln) auf Basis von
**Astro** + **TypeScript**, statisch-first mit minimalem JavaScript.

## Inhalt

- [Schnellstart](#schnellstart)
- [Projektstruktur](#projektstruktur)
- [Unternehmensdaten ändern](#unternehmensdaten-ändern)
- [Navigation ändern](#navigation-ändern)
- [Saisonmodul (Herbst & Winter) aktivieren/deaktivieren](#saisonmodul-aktivierendeaktivieren)
- [Referenzen-Seite im Hauptmenü aktivieren](#referenzen-seite-im-hauptmenü-aktivieren)
- [Bilder austauschen](#bilder-austauschen)
- [Logo austauschen](#logo-austauschen)
- [SEO-Meta ändern](#seo-meta-ändern)
- [Formularbackend (Angebotsassistent) konfigurieren](#formularbackend-angebotsassistent-konfigurieren)
- [Accessibility-Hinweise](#accessibility-hinweise)
- [Offene Punkte vor Livegang](#offene-punkte-vor-livegang)
- [Finaler Selbstaudit](#finaler-selbstaudit)

## Schnellstart

```bash
npm install
npm run dev       # Dev-Server unter http://localhost:4321
npm run build     # Typecheck + Produktions-Build nach dist/
npm run preview   # Produktions-Build lokal ausliefern
npm run check     # Nur Astro/TS-Typecheck
```

Node.js 20+ wird empfohlen.

## Projektstruktur

```
src/
  components/       Alle UI-Komponenten (Header, Hero, QuoteWizard, ...)
  components/form/  Formularbausteine (InputField, TextareaField, FileUpload)
  config/site.ts    Zentrale Site-Konfiguration (siehe unten)
  data/services.ts  Strukturierte Leistungsdaten für Leistungsseiten
  layouts/          BaseLayout.astro (Grundgerüst jeder Seite)
  lib/forms/        Formular-Typen, Validierung, Rate-Limiting, Submission-Adapter
  pages/            Eine Datei pro Route (siehe Sitemap in Abschnitt "Seiten")
  styles/           tokens.css (Design Tokens), global.css, fonts.css
public/
  fonts/, images/   Statische Assets, robots.txt, favicon
```

### Seiten (Sitemap)

`/`, `/gebaeudereinigung-koeln`, `/objektservice-koeln`,
`/aussenanlagenpflege-koeln`, `/winterdienst-koeln`,
`/fuer-hausverwaltungen`, `/ueber-uns`, `/referenzen`, `/angebot`,
`/kontakt`, `/herbst-winter`, `/impressum`, `/datenschutz`, `404`.

`sitemap.xml` und `robots.txt` werden automatisch aus dieser Liste erzeugt
(`src/pages/sitemap.xml.ts`).

## Unternehmensdaten ändern

Alle Kontaktdaten (Adresse, Telefon, E-Mail, Claim, URL) stehen **ausschließlich**
in **`src/config/site.ts`** (`company`-Objekt). Nirgendwo sonst hart codiert.
Änderungen dort wirken sich automatisch auf Header, Footer, Schema.org
(`LocalBusinessSchema.astro`), Kontaktseite, Impressum und Datenschutz aus.

## Navigation ändern

- Hauptnavigation: `primaryNav` in `src/config/site.ts`
- Footer-Navigation: `footerNav` in `src/config/site.ts`

## Saisonmodul aktivieren/deaktivieren

In `src/config/site.ts`:

```ts
export const seasonalCampaign = {
  active: true, // false blendet das Startseitenmodul aus (Landingpage /herbst-winter bleibt erreichbar)
  ...
};
```

Texte, Claim und Keywords des Moduls werden ebenfalls dort gepflegt.

## Referenzen-Seite im Hauptmenü aktivieren

Solange keine echten, dokumentierten Kundenreferenzfotos vorliegen, ist der
Menüpunkt „Referenzen“ per Feature-Flag ausgeblendet (die Seite selbst
bleibt unter `/referenzen` erreichbar, z. B. über den Footer, zeigt aber
einen hochwertig gestalteten Leerzustand statt erfundener Referenzen):

```ts
// src/config/site.ts
export const features = {
  referencesPage: false, // erst auf true setzen, wenn echte Kundenreferenzfotos vorliegen
  ...
};
```

## Bilder austauschen

Das Original-Logo sowie vier freigegebene SIMIN-**Marketingmotive** (kein
dokumentiertes Referenzmaterial, siehe Hinweis unten) wurden aus dem
offiziellen Herbst/Winter-Flyer-PDF extrahiert und liegen unter
`public/images/`:

- `hero-immobilie.webp` — Immobilie im Herbst-/Winter-Look (Flyer-Titelmotiv)
- `service-gebaeudereinigung.webp` — Motiv Fensterreinigung
- `service-winterdienst.webp` — Motiv Schneeräumen
- `service-aussenanlagen.webp` — Motiv Laubbeseitigung

**Wichtiger Hinweis zur Verwendung:** Diese vier Motive sind freigegebene
SIMIN-Marketingmotive aus dem Flyer, aber **keine dokumentierten echten
Kundenreferenzen, Vorher-/Nachher-Belege oder Mitarbeiterporträts**. Sie
werden deshalb bewusst nur für allgemeine Marken-/Marketingflächen
eingesetzt — `Hero.astro`, `PageHero.astro` (`src`-Prop, pro Seite),
`ServicePanel.astro`/`ServicesSection.astro`, `SeasonalCampaign.astro` und
`CTASection.astro` (`imageSrc`-Prop) — **nicht** in der Referenzen-Sektion
(`ReferenceGrid.astro`), die deshalb weiterhin einen ehrlichen Leerzustand
zeigt. Für „Objektservice“ und weitere generische Seiten (Über uns,
Kontakt, Hausverwaltungen) existiert kein dediziertes Motiv — dort wird das
Immobilien-Titelmotiv wiederverwendet statt ein Motiv zu erfinden.

Alle Bildflächen laufen über die zentrale `src/components/ResponsiveImage.astro`
-Komponente. Liegt (z. B. für eine neue Seite) noch kein Foto vor, zeigt sie
automatisch einen klar erkennbaren, neutralen Platzhalter statt eines
Fake-/Stockfotos.

Ein Bild austauschen/ergänzen:

1. Bilddatei nach `public/images/` legen (idealerweise als komprimiertes WebP).
2. In der jeweiligen Komponente/Seite den `src`- bzw. `imageSrc`-Prop setzen.
3. `width`/`height` passend zur Originaldatei anpassen (verhindert Layout Shift).

## Logo austauschen

Das Original-SIMIN-Logo (`src/assets/logo/simin-logo.png`, freigestellt,
extrahiert aus dem offiziellen Flyer-PDF) wird automatisch von
`src/components/Logo.astro` in Header, Footer und als Wasserzeichen in
„Markenversprechen“ eingebunden — inklusive automatischer Bildoptimierung
über `astro:assets`. `public/favicon.ico`/`apple-touch-icon.png` und das
Social-Preview-Bild (`public/images/og-default.jpg`) basieren ebenfalls auf
diesem Logo.

Um eine noch höher aufgelöste oder finale Vektor-Version einzusetzen: Datei
unter `src/assets/logo/simin-logo.{png,svg,webp}` ersetzen — keine
Codeänderung nötig. Liegt gar keine Datei vor, fällt die Komponente auf
einen einfachen typografischen Marken-Schriftzug zurück (kein gestaltetes
Ersatzlogo).

## SEO-Meta ändern

- Globale Defaults (Startseite, Social-Vorschau): `seoDefaults` in
  `src/config/site.ts`.
- Pro Unterseite: `title`/`description`-Props der jeweiligen `BaseLayout`-
  Instanz in `src/pages/*.astro`.
- Leistungsseiten-spezifische Meta-Daten: `metaTitle`/`metaDescription` in
  `src/data/services.ts`.
- Strukturierte Daten: `LocalBusinessSchema.astro` (Startseite jeder Seite),
  `Breadcrumbs.astro` (BreadcrumbList), `FaqAccordion.astro` (FAQPage auf
  Leistungsseiten).

## Formularbackend (Angebotsassistent) konfigurieren

Der Angebotsassistent sendet serverseitig an `POST /api/quote`
(`src/pages/api/quote.ts`). Validierung (client- und serverseitig),
Honeypot-Spamschutz, einfaches Rate-Limiting und Datei-Validierung
(Typ/Größe) sind bereits implementiert.

**Es ist aktuell kein echter Maildienst angebunden** (keine erfundenen
API-Keys). Im Entwicklungsmodus läuft automatisch ein Mock-Adapter
(`MockFormSubmissionService`), der eingehende Anfragen nur in die
Konsole loggt.

Für den Produktivbetrieb:

1. `.env.example` nach `.env` kopieren und `SMTP_*`
   Variablen setzen.
2. In `src/lib/forms/submissionService.ts` eine echte Implementierung von
   `FormSubmissionService` ergänzen (z. B. SMTP-Versand oder CRM-API) und in
   `getFormSubmissionService()` zurückgeben, sobald `SMTP_HOST`/`SMTP_USER`/
   `SMTP_PASSWORD` gesetzt sind.

Rate-Limiting ist aktuell In-Memory (ausreichend für eine einzelne
Serverinstanz) — bei horizontaler Skalierung durch einen gemeinsam
genutzten Speicher (z. B. Redis) ersetzen (`src/lib/forms/rateLimit.ts`).

## Accessibility-Hinweise

- Skip-Link, sichtbarer Fokusring, semantisches HTML, Formular-Labels
  (keine Placeholder-only-Labels), `aria-live`/`role="alert"` bei
  Formularfehlern, Tastaturbedienbarkeit von Dropdown/Mobile-Menü/Wizard,
  `prefers-reduced-motion` wird respektiert.
- Bildplatzhalter besitzen sprechende `alt`-Texte bzw. `aria-label`.
- Vor Livegang: Kontrast- und Screenreader-Test mit echten Inhalten/Bildern
  wiederholen, da sich reale Fotos auf Textkontraste (Hero-Overlay etc.)
  auswirken können.

## Offene Punkte vor Livegang

- **RECHTSTEXTE PRÜFEN**: Impressum und Datenschutzerklärung sind
  strukturelle Platzhalter auf Basis der bestätigten Unternehmensdaten und
  sind deutlich mit „RECHTSTEXT VOR LIVEGANG PRÜFEN“ markiert. Vor
  Veröffentlichung durch rechtlich geprüfte Fassungen ersetzen/ergänzen.
- **Formularbackend** produktiv konfigurieren (siehe oben).
- **Weitere/aktuellere Fotografie** ergänzen, sobald vorhanden (aktuell
  werden 4 aus dem Flyer-PDF extrahierte Motive mehrfach wiederverwendet,
  z. B. für „Objektservice“, das kein eigenes Foto hat) — siehe „Bilder
  austauschen“.
- **Kundenstimmen**: Sektion ist vorbereitet, zeigt aber bewusst keinen
  erfundenen Inhalt. Echte, freigegebene Bewertungen in `Testimonials.astro`
  (`testimonials`-Array) ergänzen, sobald verfügbar.
- **Referenzen**: Es liegen aktuell keine echten, dokumentierten
  Kundenreferenzfotos vor (die Flyer-Motive sind allgemeine Marketingmotive,
  keine Projektbelege). Sektion zeigt deshalb einen Leerzustand, Menüpunkt
  ist ausgeblendet (`features.referencesPage`). Sobald echte Referenzfotos
  freigegeben sind: in `ReferenceGrid.astro` (`references`-Array) ergänzen
  und Flag auf `true` setzen.
- Analytics/Tracking ist bewusst **nicht** eingebunden (siehe Master-Brief
  Punkt 46). Bei Bedarf datenschutzkonform ergänzen und Datenschutzerklärung
  entsprechend erweitern.

## Finaler Selbstaudit

**DESIGN**
- Mobile: BESTANDEN (390/375/360px geprüft, kein horizontales Scrollen, Sticky-Bar korrekt aus-/eingeblendet)
- Desktop: BESTANDEN (1440/1280/1024/768px geprüft)
- Branding: BESTANDEN (Original-Logo und freigegebene Marketingmotive aus dem Flyer-PDF durchgängig eingebunden; keine als Kundenreferenzen deklariert)

**CONTENT**
- Kontaktangaben: BESTANDEN (zentral in `site.ts`, überall referenziert)
- Adresse: BESTANDEN (ausschließlich Gilgaustraße 64, 51149 Köln)
- Leistungen: BESTANDEN (nur die im Brief definierten Leistungen)
- Keine erfundenen Claims: BESTANDEN (keine Bewertungen/Referenzen/Zahlen erfunden; Platzhalterzustände dokumentiert)

**TECHNIK**
- Build: BESTANDEN (`npm run build` inkl. Typecheck fehlerfrei)
- Responsive: BESTANDEN
- Formular: BESTANDEN (Validierung, Honeypot, Rate-Limit, Erfolg-/Fehlerzustand end-to-end getestet)
- Accessibility: BESTANDEN (Grundprüfung; echter Screenreader-/Kontrasttest vor Livegang empfohlen)
- SEO: BESTANDEN (Title/Description/Canonical/OG/Schema/Sitemap/Robots vorhanden)
- Performance: BESTANDEN (Fonts self-hosted als WOFF2, kein Tracking, LCP-Bild `fetchpriority="high"`, keine schweren Libraries)
- Console Errors: 0
- Broken Links: 0 (alle internen Links automatisiert geprüft)

**P0/P1-Blocker laut Master-Brief**: keine identifiziert.
