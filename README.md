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

Solange keine ausreichenden echten Referenzfotos vorliegen, ist der
Menüpunkt „Referenzen“ per Feature-Flag ausgeblendet (die Seite selbst
bleibt unter `/referenzen` erreichbar, z. B. über den Footer):

```ts
// src/config/site.ts
export const features = {
  referencesPage: false, // auf true setzen, sobald genug Material vorhanden ist
  ...
};
```

## Bilder austauschen

Es liegen aktuell **keine echten Projekt-/Objektfotos** vor. Alle
Bildflächen (Hero, Leistungs-Panels, Referenzen, Saisonmodul, Abschluss-CTA)
verwenden die zentrale `src/components/ResponsiveImage.astro`-Komponente und
zeigen, solange keine `src` übergeben wird, einen klar erkennbaren, neutralen
Bildplatzhalter (kein Fake-/Stockfoto).

So wird ein echtes Bild eingebunden:

1. Bilddatei nach `src/assets/` oder `public/images/` legen.
2. In der jeweiligen Komponente/Seite den `src`-Prop von `ResponsiveImage`
   setzen (z. B. `src="/images/hero-immobilie.jpg"`).
3. `width`/`height` passend zur Originaldatei anpassen (verhindert Layout Shift).

Betroffene Stellen: `Hero.astro`, `PageHero.astro` (pro Seite über
`placeholderLabel`/`src`), `ServicePanel.astro`, `ReferenceGrid.astro`,
`SeasonalCampaign.astro`, `CTASection.astro`.

## Logo austauschen

Es liegt aktuell **keine Original-Logodatei** im Projekt vor. Es wurde
bewusst **kein Ersatzlogo** gestaltet — stattdessen zeigt
`src/components/Logo.astro` einen einfachen, typografischen
Marken-Schriftzug (Barlow Condensed, Markenfarben) als Platzhalter.

Sobald die Originaldatei vorliegt: als `simin-logo.png` (oder `.svg`/`.webp`)
unter `src/assets/logo/` ablegen — die Komponente bindet sie dann automatisch
anstelle des Schriftzugs ein, ohne Codeänderung.

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
- **Echte Fotografie** ergänzen (Hero, Leistungen, Referenzen, Saisonmodul) —
  siehe „Bilder austauschen“.
- **Original-Logo** ergänzen, sobald verfügbar — siehe „Logo austauschen“.
- **Kundenstimmen/Referenzen**: Sektionen sind vorbereitet, zeigen aber
  bewusst keine erfundenen Inhalte. Echte, freigegebene Inhalte in
  `Testimonials.astro` (`testimonials`-Array) bzw. `ReferenceGrid.astro`
  (`references`-Array) ergänzen.
- Analytics/Tracking ist bewusst **nicht** eingebunden (siehe Master-Brief
  Punkt 46). Bei Bedarf datenschutzkonform ergänzen und Datenschutzerklärung
  entsprechend erweitern.

## Finaler Selbstaudit

**DESIGN**
- Mobile: BESTANDEN (390/375/360px geprüft, kein horizontales Scrollen, Sticky-Bar korrekt aus-/eingeblendet)
- Desktop: BESTANDEN (1440/1280/1024/768px geprüft)
- Branding: BESTANDEN (Markenfarben/-typografie konsequent umgesetzt; Logo als dokumentierter Platzhalter)

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
