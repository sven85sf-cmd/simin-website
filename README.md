# Gebäudedienste SIMIN — Website V2

Neu aufgebaute Website für Gebäudedienste SIMIN (Köln) auf Basis von
**Astro** + **TypeScript**, statisch-first mit minimalem JavaScript.

V2 korrigiert die Leistungsarchitektur (vier gleichwertige Leistungssäulen
statt Winterdienst-Schwerpunkt), ergänzt zwei neue Bildmotive für
Objektservice und Außenanlagen/Grünflächen und entfernt die Empty-State-
Sektionen (Referenzen/Kundenstimmen) von der produktiven Startseite.

## Gemeinsamer KI-Workspace

Projektregeln und Übergaben: [docs/workspace/README.md](docs/workspace/README.md).
Der aktuelle Prüfstand steht in [STATUS.md](docs/workspace/STATUS.md).

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
- [Produktions-Hosting](#produktions-hosting-wix)
- [GitHub-Pages-Vorschau](#github-pages-vorschau)
- [Accessibility-Hinweise](#accessibility-hinweise)
- [Offene Punkte vor Livegang](#offene-punkte-vor-livegang)
- [Launch-Checkliste](#launch-checkliste)
- [Historischer Selbstaudit](#historischer-selbstaudit)

## Schnellstart

```bash
npm ci --ignore-scripts
npm start         # Lokaler Astro-Server ohne Wix-Anmeldung
npm run check     # Astro/TS-Typecheck
npm run test:regression # Serverlose Regressionstests
npm run dev       # Wix-Entwicklung mit passender Wix-Umgebung
npm run build     # Wix-Build (Typecheck separat ausführen)
npm run preview   # Wix-Vorschau
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
  fonts/, images/, videos/   Statische Assets, favicon
```

### Seiten (Sitemap)

`/`, `/gebaeudereinigung-koeln`, `/objektservice-koeln`,
`/aussenanlagenpflege-koeln`, `/winterdienst-koeln`,
`/fuer-hausverwaltungen`, `/ueber-uns`, `/referenzen`, `/angebot`,
`/kontakt`, `/herbst-winter`, `/impressum`, `/datenschutz`, `404`.

`sitemap.xml` wird automatisch aus dieser Liste erzeugt
(`src/pages/sitemap.xml.ts`), immer mit Produktions-URLs. `robots.txt`
(`src/pages/robots.txt.ts`) ist environment-abhängig: `Allow: /` in
Produktion, `Disallow: /` auf der Preview — siehe „GitHub-Pages-Vorschau“.

## Unternehmensdaten ändern

Alle Kontaktdaten (Adresse, Telefon, E-Mail, Claim, URL) stehen **ausschließlich**
in **`src/config/site.ts`** (`company`-Objekt). Nirgendwo sonst hart codiert.
Änderungen dort wirken sich automatisch auf Header, Footer, Schema.org
(`LocalBusinessSchema.astro`), Kontaktseite, Impressum und Datenschutz aus.

Bürozeiten stehen ebenso nur dort (`openingHours`) und speisen Footer,
Kontaktseite und `openingHoursSpecification` im LocalBusiness-Schema.

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
Menüpunkt „Referenzen“ per Feature-Flag ausgeblendet. Solange das Flag aus
ist, leitet `/referenzen` per 301 auf die Startseite um und steht nicht in
der Sitemap — es gibt keinen öffentlichen Leerzustand:

```ts
// src/config/site.ts
export const features = {
  referencesPage: false, // erst auf true setzen, wenn echte Kundenreferenzfotos vorliegen
  ...
};
```

## Bilder austauschen

Das Original-Logo sowie sechs freigegebene SIMIN-**Marketingmotive** (kein
dokumentiertes Referenzmaterial, siehe Hinweis unten) wurden aus dem
offiziellen Herbst/Winter-Flyer-PDF sowie zwei weiteren SIMIN-Flyern
extrahiert und liegen unter `public/images/`:

- `hero-immobilie.webp` — Immobilie im Herbst-/Winter-Look (Flyer-Titelmotiv)
- `service-gebaeudereinigung.webp` — Motiv Fensterreinigung
- `service-objektservice.webp` — Motiv Kleinreparatur/Hausmeisterdienst
- `service-aussenanlagen-gruen.webp` — Motiv Heckenschnitt (nicht-saisonal, primäres Motiv für Außenanlagenpflege)
- `service-aussenanlagen.webp` — Motiv Laubbeseitigung (herbstlich, reserviert für Saisonmodul/„Herbst & Winter“)
- `service-winterdienst.webp` — Motiv Schneeräumen

**Wichtiger Hinweis zur Verwendung:** Diese Motive sind freigegebene
SIMIN-Marketingmotive aus Flyern, aber **keine dokumentierten echten
Kundenreferenzen, Vorher-/Nachher-Belege oder Mitarbeiterporträts**. Alt-Texte
beschreiben deshalb die dargestellte Leistung, nicht „echte SIMIN-Mitarbeiter“
oder ein bestimmtes Projekt. Die Motive werden bewusst nur für allgemeine
Marken-/Marketingflächen eingesetzt — `Hero.astro`, `PageHero.astro`
(`src`-Prop, pro Seite), `ServicePanel.astro`/`ServicesSection.astro`,
`SeasonalCampaign.astro` und `CTASection.astro` (`imageSrc`-Prop) —
**nicht** in der Referenzen-Sektion (`ReferenceGrid.astro`), die weiterhin
einen ehrlichen Leerzustand zeigt. Für generische Seiten ohne eigenes Motiv
(Über uns, Kontakt, Hausverwaltungen) wird sinnvoll ein bestehendes Motiv
wiederverwendet statt eines erfunden. Die zwei extrahierten Motive für
Objektservice und Außenanlagen/Grünflächen stammen aus kleinen, kreisförmig
zugeschnittenen Flyer-Grafiken — die Bildschärfe ist entsprechend begrenzt;
höher aufgelöste Originaldateien können jederzeit unter denselben
Dateinamen ersetzt werden.

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
(Größe, Anzahl, Erweiterung, Magic-Byte-Prüfung des tatsächlichen
Dateiinhalts) sind implementiert; die produktive Integration wird separat geprüft.

**Architektur (Wix-native, kein externer Mailanbieter):**

```
Angebotsassistent (Frontend, unverändert)
  → POST /api/quote (Validierung, Honeypot, Rate-Limit, Origin-Check)
  → src/lib/forms/submissionService.ts (FormSubmissionService-Abstraktion)
  → src/lib/wix/submissionsRepository.ts
      → Dateien: Wix Media (@wix/media, generateFileUploadUrl)
      → Anfrage: Wix Data Collection (@wix/data, items.insert, elevated)
  → Wix Automation (im Wix-Dashboard konfiguriert)
  → E-Mail an kontakt@gebaeudedienste-simin.de
```

Es wird **kein** externer Mailanbieter mehr verwendet (frühere
Resend-Architektur vollständig entfernt). Die Anfrage wird als Datensatz
in einer Wix-Data-Collection gespeichert; hochgeladene Dateien landen im
Wix Media Manager (privat, Ordner `/angebotsanfragen`). Die eigentliche
Benachrichtigung an SIMIN erzeugt **keine Zeile Code in diesem Repo**,
sondern eine im Wix-Dashboard eingerichtete Automation, die auf „neuer
Eintrag in dieser Collection" reagiert.

**Vor Produktivbetrieb im Wix-Dashboard einzurichten:**

1. Data-Collection anlegen (Content Manager), empfohlener Anzeigename
   „SIMIN Angebotsanfragen", mit Feldern passend zum in
   `src/lib/wix/submissionsRepository.ts` geschriebenen Datensatz
   (`service`, `propertyType`, `postalCode`, `city`, `description`,
   `name`, `company`, `phone`, `email`, `submittedAt`). Das
   HTTP-Dateifeld `files` ist vom gespeicherten CMS-Modell zu unterscheiden.
   Der aktuelle Code schreibt **nicht mehr in das alte CMS-Feld `files`**.
   Stattdessen verwendet er `attachmentMetadata` (Array), `attachmentsPresent`
   (Boolean), `attachmentCount` (Number), `attachmentNames` (Text) und
   `attachmentAccessLinks` (Text). `submittedAt` wird als Date geschrieben.
   Maßgeblich ist `src/lib/wix/submissionsRepository.ts`.
   Das alte Feld bleibt für vorhandene Daten bestehen.
2. Die Collection-ID als `WIX_SUBMISSIONS_COLLECTION_ID` setzen
   (`.env.example` kopieren nach `.env`).
3. Eine Automation einrichten: Trigger „Neuer Eintrag" auf dieser
   Collection → Aktion „E-Mail senden" an `kontakt@gebaeudedienste-simin.de`,
   mit den relevanten Feldern (Leistung, Name, Kontakt, Nachricht) im
   E-Mail-Text. Betreff z. B. „Neue Website-Anfrage – [Leistung] – [Name]".
4. Reply-To auf die Interessenten-E-Mail: technisch abhängig davon, ob die
   Wix-Automation-E-Mail dynamische Reply-To-Felder aus Trigger-Daten
   unterstützt — im Dashboard beim Einrichten der Automation prüfen. Falls
   nicht unterstützt: Konstantin sieht die Interessenten-E-Mail als Feld im
   Anfrage-Datensatz/in der Benachrichtigung und kann sie manuell in einer
   neuen E-Mail verwenden.

**Ohne `WIX_SUBMISSIONS_COLLECTION_ID` antwortet `/api/quote` klar mit
„nicht konfiguriert"** – niemals mit einem falschen Erfolg.

**Wichtiger Hinweis zum aktuellen Implementierungsstand:** Der Code in
`src/lib/wix/submissionsRepository.ts` wurde gegen die echten, im Projekt
installierten `@wix/data`- und `@wix/media`-Pakete geschrieben (reale
API-Signaturen, keine erfundenen Funktionsnamen). Er konnte in der
Entwicklungsumgebung, in der er entstand, **nicht gegen eine echte
Wix-Site ausgeführt werden** (kein Netzwerkzugriff auf `*.wix.com`) und ist
daher **nicht end-to-end getestet**. Vor Produktivbetrieb unbedingt eine
echte Testanfrage durchführen und verifizieren: Datensatz erscheint im
Wix-Dashboard, Dateien sind im Media Manager abrufbar, Automation
versendet die Benachrichtigung.

Rate-Limiting ist aktuell In-Memory (ausreichend für eine einzelne
Serverinstanz) — bei horizontaler Skalierung durch einen gemeinsam
genutzten Speicher ersetzen (`src/lib/forms/rateLimit.ts`); prüfen, ob die
Wix-Hosting-Laufzeit hierfür bereits einen geeigneteren nativen Schutz
bietet.

**Origin-Schutz und Forwarded-Host sind getrennt:**
`astro.config.base.mjs` setzt `checkOrigin: false`; der API-Endpunkt prüft
stattdessen eine explizite Origin-Allowlist in `src/pages/api/quote.ts`.
`security.allowedDomains` steuert separat das Vertrauen in Forwarded-Host-Header.
Bei zusätzlichen Domains beide Mechanismen anhand ihrer jeweiligen Funktion
prüfen; nicht blind die eingebaute Origin-Prüfung erneut einschalten.

**Private Anhänge:** `ATTACHMENT_LINK_SIGNING_SECRET` wird ausschließlich als
serverseitiges Geheimnis hinterlegt. `ATTACHMENT_LINK_TTL_HOURS` steuert die
Gültigkeit (Vorgabe 168 Stunden). Die Automation muss `attachmentAccessLinks`
ausgeben; kurzlebige Wix-Download-URLs werden erst beim Öffnen erzeugt.
Kein Geheimnis und kein ausgegebener Zugriffslink gehört in dieses Repository.

## Wix Managed Headless — Adapter & Runtime-Pakete (wichtig bei zukünftigen Änderungen)

**Warum der frühere `@astrojs/node`-Standalone-Build auf Wix falsch war:**
Wix Managed Headless deployed die Site als Cloudflare-Workers-Bundle
(`_worker.js/`). Der Node-Standalone-Adapter erzeugt dagegen ein separates
`dist/server/`-Verzeichnis, dessen SSR-Bundle Framework-Pakete bewusst
unbundled lässt (bare imports, z. B. `import React from "react"` in
`dist/server/renderers.mjs`), die zur Laufzeit aus `node_modules` aufgelöst
werden müssen. Auf Wix' Cloudflare-Worker-Runtime — die kein `node_modules`
zur Laufzeit hat — schlägt genau das fehl: „Cannot find package 'react'
imported from /user-code/renderers.mjs". Das Verschieben von
`react`/`react-dom` nach `dependencies` (siehe unten) behebt zusätzlich
reale, unabhängige Packaging-Risiken, war aber allein nicht die Ursache
des gemeldeten Laufzeitfehlers.

**Zwischenstand, der NICHT ausreichte:** Ein erster Versuch wählte
`adapter`/`output` abhängig von `npm_lifecycle_event === "build"`
innerhalb von `astro.config.mjs`. Das erklärte den Fehler zwar korrekt,
löste ihn aber nicht robust: `wix build` bekam damit zwar den
Wix-Hosting-Adapter, aber `wix preview` (das `astro.config.mjs` erneut
einliest) fiel wieder auf `@astrojs/node`/`output: "static"` zurück,
sobald sein interner Aufruf `npm_lifecycle_event` nicht auf `"build"`
setzte — und reproduzierte dadurch exakt denselben Fehler erneut.

**Jetzt umgesetzt: keine Bedingung mehr, sondern zwei getrennte
Config-Dateien:**

- **`astro.config.mjs`** (Astros Standardname — das liest `wix dev`,
  `wix build` UND `wix preview` immer, ohne `--config`-Override):
  unconditional `adapter: wixHostingAdapter()` (aus
  `@wix/astro-wix-hosting-adapter`, kapselt `@astrojs/cloudflare`),
  `output: "server"`. Kein Fallback, keine Umgebungsvariable entscheidet
  hier irgendetwas mehr.
- **`astro.config.static.mjs`**: unconditional `adapter: node({ mode:
  "standalone" })`, `output: "static"` — für alles, was explizit NICHT
  der echte Wix-Build/-Preview ist.
- **`astro.config.base.mjs`**: gemeinsame Basis (site/base/security/
  build/image/env, Integration nur React), von beiden obigen Dateien per
  Spread übernommen, damit sie nicht auseinanderlaufen.
- Die Wix-Integrationen (`@wix/astro`, `@wix/astro-pages`) stehen
  ausschließlich in `astro.config.mjs`. `@wix/astro` lehnt jedes `base`
  ungleich `"/"` ab und ruft beim Prerendern jeder Seite die Wix-OAuth-API
  auf — mit ihnen in der gemeinsamen Basis war der statische
  GitHub-Pages-Build unmöglich. `npm start`, `npm run check` und
  `build:unsafe` brauchen dadurch keine Wix-Zugangsdaten mehr; für echte
  Wix-Aufrufe lokal `npm run dev` (= `wix dev`) verwenden.
- `package.json`: `start`, `check` und `build:unsafe` rufen jetzt explizit
  `--config astro.config.static.mjs` auf; `dev`, `build` und `preview`
  (die drei `wix …`-Kommandos) bleiben unverändert und lesen dadurch
  garantiert dieselbe, unconditionale `astro.config.mjs`.
- Beide Config-Dateien loggen beim Laden bewusst dauerhaft (nicht nur zum
  Debuggen) `output`/`adapter`/`npm_lifecycle_event` in die Konsole —
  genau das macht in jedem `wix …`-Terminal-Log sofort sichtbar, welche
  Konfiguration tatsächlich aktiv war.

**Lokal verifiziert** (auch mit explizit *fehlendem* `npm_lifecycle_event`,
um den zuvor vermuteten Rückfall-Mechanismus direkt zu reproduzieren):
`astro.config.mjs` liefert in jedem Fall `adapterName: "@astrojs/cloudflare"`;
`dist/_worker.js/` enthält projektweit **0** bare `import ... from
"react"`-Zeilen und **0** bare `@astrojs/react`-Referenzen — React ist
vollständig inline gebündelt.

`react()` steht in der gemeinsamen Basis. `wix({ robots: false })` und
`wixPages()` stehen ausschließlich in `astro.config.mjs`.

Zusätzlich stehen folgende Pakete jetzt unter `dependencies`, nicht mehr
`devDependencies` (wie sie ursprünglich vom Linking-Prozess einsortiert
wurden) — jedes davon wird beim Config-Laden oder im SSR-Manifest per
bare import/`node_modules/<paket>/...`-Pfad referenziert, würde also bei
einer reinen Production-Installation (`npm ci --omit=dev`) fehlen:

- `react`, `react-dom`
- `@wix/astro`, `@wix/astro-pages` (registrieren Server-Routen im
  SSR-Manifest, u. a. `/_wix/pages.json`, Auth-Callbacks, Payment-Links)
- `@wix/astro-wix-hosting-adapter` (jetzt unconditional am Kopf von
  `astro.config.mjs` importiert, auch wenn nur produktiv *verwendet*)
- `@wix/media` (direkt in `src/lib/wix/submissionsRepository.ts`
  importiert; lief bisher nur „zufällig" über `@wix/dashboard` mit)

`@astrojs/node` bleibt bewusst unter `dependencies` (nicht entfernt,
trotz anfänglicher Vermutung): Es wird für `astro dev`/`astro check`/den
GitHub-Pages-Build weiterhin als lokaler Adapter gebraucht und ist am
Kopf von `astro.config.static.mjs` unconditional importiert. `@astrojs/react`
bleibt zulässig unter `devDependencies` — lokal verifiziert (siehe oben):
0 bare Referenzen darauf im Wix-Worker-Bundle, es generiert nur zur
Build-Zeit `renderers.mjs` und wird selbst nie zur Laufzeit importiert.
`@wix/cli` (Build-/CLI-Tool) bleibt ebenfalls zulässig unter
`devDependencies`.

## Produktions-Hosting (Wix)

Die aktuelle Produktionskonfiguration verwendet **Wix Managed Headless** mit
`wixHostingAdapter()` und `output: "server"` in `astro.config.mjs`.
Der Adapter baut für die Cloudflare-Workers-Laufzeit von Wix. Ein zusätzlicher
Node.js-Hostingvertrag ist für diese Architektur nicht erforderlich.

`astro.config.static.mjs` mit Node-Standalone-Adapter und `output: "static"`
ist die getrennte Variante für lokale Entwicklung, Typecheck und statische Vorschau.
Sie beschreibt nicht die Produktionsarchitektur. Ein erfolgreicher statischer Build
beweist weder Wix-Persistenz noch Automation oder E-Mail-Zustellung.

Build, Live-Konfiguration und tatsächliche Veröffentlichung getrennt prüfen:
`npm run check`, `npm run build`, bei autorisierter Veröffentlichung `npm run release`.

## GitHub-Pages-Vorschau

Für eine schnelle, unbeworbene Vorschau (z. B. für internes Feedback) kann
die Seite zusätzlich statisch auf GitHub Pages veröffentlicht werden, unter
`https://sven85sf-cmd.github.io/simin-website/` (Branch `gh-pages`).

Da GitHub Pages dieses Repository unter einem Unterordner-Pfad ausliefert,
unterstützt die Website einen konfigurierbaren `base`-Pfad:

```bash
PREVIEW_BASE_PATH=/simin-website npm run build:unsafe
```

**Wichtig:** hier ausdrücklich `build:unsafe` (reines `astro build`), nicht
`build` (= `wix build`) — Letzteres würde versuchen, den Wix-CLI-Build samt
Wix-Netzwerkzugriff auszuführen, den ein reiner statischer GitHub-Pages-Export
nicht braucht und nicht haben soll. `astro.config.base.mjs` liest `PREVIEW_BASE_PATH` nur für diesen Sonderfall;
ohne die Variable bleibt `base` immer `"/"` — die Produktionsseite unter
`https://www.gebaeudedienste-simin.de/` ist davon nicht betroffen. Der
zentrale `withBase()`-Helper (`src/lib/path.ts`) hängt den Unterordner-Pfad
zur Build-Zeit an alle internen Links/Bild-/Video-Pfade an (`import.meta.env.BASE_URL`);
bei `base = "/"` ist das ein reines No-op.

**Preview ist NICHT indexierbar (bewusst):** Sobald `PREVIEW_BASE_PATH`
gesetzt ist, erkennt `isPreviewBuild()` (`src/lib/path.ts`) das automatisch
und `BaseLayout.astro` setzt auf **jeder** Seite `<meta name="robots"
content="noindex, nofollow">`; `src/pages/robots.txt.ts` liefert für die
Vorschau zusätzlich `Disallow: /`. Für die Produktion (`base = "/"`) ist
`robots.txt` normal indexierbar und verweist auf die Produktions-Sitemap —
diese Logik ist rein build-abhängig, es gibt keine fest verdrahtete
Preview-Sonderregel, die in Produktion aktiv werden könnte.

**Einschränkung:** Der Angebotsassistent kann auf dieser statischen Vorschau
keine Anfrage absenden (kein Node-Server für `/api/quote` auf GitHub Pages).

Um die Vorschau nach Änderungen zu aktualisieren: `dist/client` mit
`PREVIEW_BASE_PATH` bauen und den `gh-pages`-Branch **vollständig** durch
diesen Inhalt ersetzen (alte Dateien vorher entfernen, keine Mischstände),
plus eine leere `.nojekyll`-Datei; committen und pushen. GitHub Pages
veröffentlicht den Branch anschließend automatisch
(Workflow „pages-build-deployment“).

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

- **Rechtstexte**: Impressum und Datenschutzerklärung sind auf Basis der
  bestätigten Unternehmensdaten und des tatsächlichen technischen Setups
  finalisiert. Eine anwaltliche Prüfung vor Livegang bleibt empfehlenswert.
- **Datenschutzerklärung**: beschreibt den tatsächlichen Wix-Betrieb (Hosting,
  Cookie „wixSession“, Wix Data, private Uploads in Wix Media, Benachrichtigung
  per Wix-Automation, Auftragsverarbeitung, Drittland). Bei Änderungen am
  Setup (z. B. Analyse-Tools, weitere Dienste) entsprechend anpassen.
- **Formularbackend** produktiv konfigurieren (siehe oben).
- **Höher aufgelöste Fotografie** für Objektservice und Außenanlagen/
  Grünflächen ergänzen, sobald vorhanden — die aktuellen Motive stammen aus
  kleinen, kreisförmigen Flyer-Ausschnitten mit begrenzter Schärfe (siehe
  „Bilder austauschen“).
- **Kundenstimmen**: Komponente (`Testimonials.astro`) und Feature-Flag
  (`features.testimonials`, aktuell `false`) sind vorbereitet, werden aber
  auf keiner Seite eingebunden und zeigen keinen erfundenen Inhalt. Echte,
  freigegebene Bewertungen im `testimonials`-Array ergänzen, Komponente auf
  der gewünschten Seite einbinden und Flag aktivieren, sobald verfügbar.
- **Google-Business-Profil-Link**: `googleBusinessUrl` (`src/config/site.ts`)
  zeigt aktuell auf eine generische Google-Suche, da kein verifizierter
  Profil-Link vorliegt. Vor Livegang durch den echten Link aus dem
  Google-Business-Profil-Dashboard ersetzen (siehe TODO-Kommentar dort).
- **Referenzen**: Es liegen aktuell keine echten, dokumentierten
  Kundenreferenzfotos vor (die Flyer-Motive sind allgemeine Marketingmotive,
  keine Projektbelege). Menüpunkt ist ausgeblendet und `/referenzen` leitet
  auf die Startseite um (`features.referencesPage`). Sobald echte Referenzfotos
  freigegeben sind: in `ReferenceGrid.astro` (`references`-Array) ergänzen
  und Flag auf `true` setzen.
- Analytics/Tracking ist bewusst **nicht** eingebunden (siehe Master-Brief
  Punkt 46). Bei Bedarf datenschutzkonform ergänzen und Datenschutzerklärung
  entsprechend erweitern.

## Launch-Checkliste

Checkliste für die Live-Verifikation; offene Kästchen belegen keinen aktuellen Fehler,
sondern benötigen einen aktuellen Nachweis aus Wix bzw. dem produktiven Test.

Die folgenden Punkte müssen gegen den aktuellen Betriebsstand geprüft werden;
historische Checklisten ersetzen keine Kontrolle im produktiven System.

**Rechtliches**
- [ ] Impressum final rechtlich geprüft (`src/pages/impressum.astro`)
- [ ] Datenschutzerklärung final geprüft (`src/pages/datenschutz.astro`)
- [ ] Rechtsform ergänzt (aktuell nur `company.legalName` = Firmenname ohne Rechtsform)
- [ ] Vertretungsberechtigte Person ergänzt (Impressum, § 5 TMG)
- [ ] ggf. Handelsregister / USt-ID / zuständige Aufsichtsbehörde ergänzt (nur falls zutreffend)

**Hosting**
- [ ] Wix-Build und tatsächliche Veröffentlichung unter der Produktionsdomain nachgewiesen.
- [ ] Produktive Laufzeit getrennt von der statischen GitHub-Pages-Vorschau geprüft.

**Formular**
- [ ] Wix-Data-Collection „SIMIN Angebotsanfragen" im Dashboard angelegt,
      `WIX_SUBMISSIONS_COLLECTION_ID` in `.env` gesetzt (siehe Abschnitt
      „Formularbackend“ oben)
- [ ] Wix-Automation eingerichtet (Trigger: neuer Eintrag → E-Mail an
      `kontakt@gebaeudedienste-simin.de`) und aktiviert
- [ ] echte End-to-End-Testanfrage durchgeführt: Datensatz im Dashboard
      sichtbar, Dateien im Media Manager abrufbar, Benachrichtigungsmail
      angekommen — **bisher nicht getestet**, siehe Hinweis oben
- [ ] Origin-Allowlist in `src/pages/api/quote.ts` gegen die tatsächlich
      verwendeten Produktionsdomains geprüft. `security.allowedDomains` in
      `astro.config.base.mjs` regelt separat das Vertrauen in Forwarded-Host-Header
- [ ] Datenschutzhinweis am Formular vorhanden — **bereits vorhanden**
      (Checkbox + Link zu `/datenschutz` in Schritt 4 des Angebotsassistenten)

**SEO / Indexierung**
- [ ] Google-Business-Profil-Link eingesetzt (`googleBusinessUrl` in `src/config/site.ts`)
- [ ] Production Build indexierbar — **bereits sichergestellt**: `npm run build`
      (ohne `PREVIEW_BASE_PATH`) liefert `robots.txt` mit `Allow: /` und kein
      seitenweites `noindex`
- [ ] Preview weiterhin noindex — **bereits sichergestellt**: jeder Build mit
      `PREVIEW_BASE_PATH` erzwingt automatisch `noindex, nofollow` auf jeder
      Seite sowie `Disallow: /` in `robots.txt` (siehe `isPreviewBuild()`,
      `src/lib/path.ts`)
- [ ] Canonical auf Produktionsdomain geprüft — **bereits sichergestellt**:
      `SEOHead.astro` baut Canonicals immer aus `company.url`, unabhängig vom Build
- [ ] Sitemap auf Produktionsdomain geprüft — **bereits sichergestellt**,
      gleicher Mechanismus (`src/pages/sitemap.xml.ts`)
- [ ] LocalBusiness JSON-LD validiert (z. B. Google Rich-Results-Test),
      sobald die Seite unter der echten Domain live ist

**Qualität**
- [ ] Core Web Vitals geprüft (echtes Hosting/CDN, nicht nur lokal)
- [ ] Mobile final geprüft (echte Geräte, nicht nur Viewport-Simulation)
- [ ] Kontaktangaben final geprüft (Telefon/E-Mail/Adresse in `src/config/site.ts`)

## Historischer Selbstaudit

Die folgenden Angaben stammen aus früheren Entwicklungsständen und sind keine
aktuelle Live-Abnahme. Maßgeblich für neue Arbeiten ist der datierte
[Workspace-Status](docs/workspace/STATUS.md).

**DESIGN**
- Mobile: BESTANDEN (390/375/360px geprüft, kein horizontales Scrollen, Sticky-Bar korrekt aus-/eingeblendet)
- Desktop: BESTANDEN (1440/1280/768px geprüft)
- Branding: BESTANDEN (Original-Logo und freigegebene Marketingmotive durchgängig eingebunden; keine als Kundenreferenzen deklariert)
- Vier gleichwertige Leistungssäulen auf der Startseite (statt Winterdienst-Schwerpunkt): BESTANDEN

**CONTENT**
- Kontaktangaben: BESTANDEN (zentral in `site.ts`, überall referenziert)
- Adresse: BESTANDEN (ausschließlich Gilgaustraße 64, 51149 Köln)
- Leistungen: BESTANDEN (vollständiges, bestätigtes Leistungspaket je Bereich abgebildet)
- Keine erfundenen Claims: BESTANDEN (keine Bewertungen/Referenzen/Zahlen erfunden; alte 15%-Kampagne nicht übernommen)
- Keine Empty-State-Sektionen auf produktiver Startseite (Referenzen/Kundenstimmen ausgeblendet): BESTANDEN

**TECHNIK**
- Build: BESTANDEN (`npm run build` inkl. Typecheck fehlerfrei, Produktions- und Preview-Konfiguration)
- Responsive: BESTANDEN
- Formular: BESTANDEN (Validierung, Honeypot, Rate-Limit, Erfolg-/Fehlerzustand end-to-end getestet)
- Accessibility: BESTANDEN (Grundprüfung; echter Screenreader-/Kontrasttest vor Livegang empfohlen)
- SEO: BESTANDEN (Title/Description/Canonical/OG/Schema/Sitemap/Robots vorhanden)
- Performance: BESTANDEN (Fonts self-hosted als WOFF2, kein Tracking, LCP-Bild `fetchpriority="high"`, keine schweren Libraries)
- Console Errors: 0 (6 Viewports × 14 Seiten geprüft)
- Broken Links: 0 (alle internen Links automatisiert geprüft, lokal unter Produktions- und GitHub-Pages-Basispfad)
- GitHub-Pages-Vorschau: Lokal unter simuliertem Unterordner-Pfad vollständig verifiziert (alle Seiten HTTP 200, keine 404-Assets, Navigation funktioniert). Das eigentliche Live-Deployment unter `https://sven85sf-cmd.github.io/simin-website/` konnte **nicht** aus dieser Sandbox getestet werden, da `*.github.io` durch die Netzwerk-Policy der Ausführungsumgebung blockiert ist — bitte einmal manuell im Browser gegenprüfen.

**P0/P1-Blocker laut Master-Brief**: keine identifiziert.
