# Gebäudedienste SIMIN — Website V2

Neu aufgebaute Website für Gebäudedienste SIMIN (Köln) auf Basis von
**Astro** + **TypeScript**, statisch-first mit minimalem JavaScript.

V2 korrigiert die Leistungsarchitektur (vier gleichwertige Leistungssäulen
statt Winterdienst-Schwerpunkt), ergänzt zwei neue Bildmotive für
Objektservice und Außenanlagen/Grünflächen und entfernt die Empty-State-
Sektionen (Referenzen/Kundenstimmen) von der produktiven Startseite.

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
- [Produktions-Hosting-Anforderung](#produktions-hosting-anforderung-p0--entscheidung-vor-livegang-nötig)
- [GitHub-Pages-Vorschau](#github-pages-vorschau)
- [Accessibility-Hinweise](#accessibility-hinweise)
- [Offene Punkte vor Livegang](#offene-punkte-vor-livegang)
- [Launch-Checkliste](#launch-checkliste)
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
Dateiinhalts) sind unverändert produktionsfertig implementiert.

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
   `name`, `company`, `phone`, `email`, `files`, `submittedAt`). Das
   Feld `files` muss den Feldtyp **„Mehrere Dokumente"** verwenden — der
   Code schreibt dort ein Array nativer Wix-Dokumentreferenzen
   (`wix:document://v1/<fileId>/<filename>`, siehe `uploadFile()` in
   `submissionsRepository.ts`), keine JSON-Objekte und keine Klartext-URLs.
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

**Wichtig — `security.allowedDomains` (astro.config.mjs):** Astros
eingebaute CSRF-Origin-Prüfung für `POST /api/quote` validiert den
Host-Header ohne konfigurierte `allowedDomains` nicht korrekt und lehnt
dadurch **jede** echte Formular-Anfrage mit 403 ab. `astro.config.mjs`
trägt deshalb die Produktionsdomain explizit ein
(`{ hostname: "www.gebaeudedienste-simin.de", protocol: "https" }`) sowie
zusätzlich `{ hostname: "**.wix-site-host.com", protocol: "https" }` für
Testanfragen über die Wix-Managed-Headless-Preview (deren Subdomain sich
pro Deployment ändert, siehe `.wix/topology.json`). Wird die Seite unter
einer weiteren Domain ausgeliefert (z. B. Apex ohne Redirect, eigene
Staging-Domain), muss diese hier ergänzt werden — sonst schlägt der
Versand mit „Cross-site POST form submissions are forbidden“ fehl, obwohl
alles andere korrekt konfiguriert ist. End-to-end
gegen den Node-Server getestet (Validierung, Honeypot, Datei-Upload,
Erfolg-/Fehlerzustand, Tastaturbedienung) — siehe Launch-Checkliste unten.

## Wix Managed Headless — Runtime-Pakete (wichtig bei zukünftigen Dependency-Änderungen)

Das SSR-Server-Bundle (`dist/server/`) lässt Framework-/Wix-SDK-Pakete
bewusst unbundled (bare imports, z. B. `import React from "react"` in
`dist/server/renderers.mjs`) — sie werden zur Laufzeit aus `node_modules`
aufgelöst. Läuft der Deploy-Prozess (z. B. Wix' eigene Build-Pipeline) mit
einer reinen Production-Installation (`npm ci --omit=dev`), gehen alle
Pakete verloren, die nur unter `devDependencies` stehen, obwohl der
gebaute Code sie zur Laufzeit direkt oder über einen Pfad in
`node_modules/<paket>/...` benötigt (kein Peer-Dependency-Hoisting rettet
das, wenn die einzige „harte" Installation eine devDependency ist).

Deshalb stehen folgende Pakete bewusst unter `dependencies`, nicht
`devDependencies`, obwohl sie so von `npm create @wix/new -- headless
link` ursprünglich einsortiert wurden:

- `react`, `react-dom` — von `dist/server/renderers.mjs` per bare import
  benötigt; nur als `devDependencies` reproduzierte exakt den Fehler
  „Cannot find package 'react' imported from /user-code/renderers.mjs"
  auf der Wix-Runtime.
- `@wix/astro`, `@wix/astro-pages` — registrieren zur Laufzeit referenzierte
  Server-Routen (`node_modules/@wix/astro/build/dependencies/.../*.mjs`,
  u. a. `/_wix/pages.json`, Auth-Callbacks, Payment-Links) im SSR-Manifest.
- `@wix/media` — direkt in `src/lib/wix/submissionsRepository.ts`
  importiert; lief bisher nur „zufällig", weil `@wix/dashboard` es
  transitiv mitzieht — jetzt explizit deklariert.

`@astrojs/react` (nur Build-Zeit-Integration, generiert `renderers.mjs`,
wird selbst nicht zur Laufzeit importiert), `@wix/cli` (Build-/CLI-Tool)
und `@wix/astro-wix-hosting-adapter` (aktuell nicht in `astro.config.mjs`
eingebunden, siehe unten) bleiben zulässig unter `devDependencies`.

**Offener Beobachtungspunkt (nicht verändert):** `@wix/astro-wix-hosting-adapter`
ist installiert, aber `astro.config.mjs` verwendet weiterhin den
`@astrojs/node`-Adapter, nicht diesen Wix/Cloudflare-Adapter. Der lokale
Build läuft damit einwandfrei durch; ob Wix' eigene Deploy-Pipeline
zwingend den Cloudflare-Adapter erwartet, konnte in dieser Umgebung nicht
verifiziert werden (kein Netzwerkzugriff auf `*.wix.com`). Nicht
eigenmächtig umgestellt, da dies laut Aufgabenstellung eine große,
nicht anhand vorliegender Fehler begründete Architekturänderung wäre.

## Produktions-Hosting-Anforderung (P0 — Entscheidung vor Livegang nötig)

**Dieses Setup benötigt zwingend einen Node.js-fähigen Hosting-Host für
`https://www.gebaeudedienste-simin.de/` — reines statisches
„Dateien hochladen"-Webhosting reicht NICHT aus, damit der
Angebotsassistent tatsächlich senden kann.**

Hintergrund: `astro.config.mjs` verwendet `output: "static"` mit dem
`@astrojs/node`-Adapter (`mode: "standalone"`). `npm run build` erzeugt
dadurch zwei getrennte Ausgaben:

- `dist/client/` — die vollständig statische Website (alle Seiten außer
  dem Formular-Endpunkt). Kann auf jedem beliebigen Webspace/CDN
  ausgeliefert werden.
- `dist/server/entry.mjs` — ein eigenständiger Node.js-Server, der
  **ausschließlich** für `POST /api/quote` (`src/pages/api/quote.ts`,
  `export const prerender = false`) benötigt wird. Alle anderen Seiten
  sind vollständig vorgerendert und benötigen diesen Server nicht.

Läuft die Produktionsdomain auf klassischem statischem Shared-Hosting
(z. B. reinem FTP-Upload ohne Node-Laufzeitumgebung, wie bei vielen
günstigen Webspace-Paketen üblich), sieht die Website optisch und
strukturell vollständig funktionsfähig aus — **aber jede
Formular-Anfrage schlägt fehl**, weil `dist/server/entry.mjs` nirgendwo
läuft und `/api/quote` schlicht nicht erreichbar ist.

Damit der Angebotsassistent produktiv senden kann, braucht es eines von:

1. Einen Host, der `node dist/server/entry.mjs` dauerhaft als Prozess
   ausführen kann (z. B. ein vServer/VPS oder ein Node-fähiger
   Anbieter) — dieser Server liefert dann sowohl die statischen Seiten
   als auch `/api/quote` aus einem Prozess.
2. Eine getrennte Architektur: `dist/client/` weiterhin klassisch
   statisch ausliefern, `/api/quote` separat als eigene
   Node-/Serverless-Funktion beim jeweiligen Hosting-Anbieter
   bereitstellen (z. B. dessen Node-/Funktions-Angebot, falls
   vorhanden).

**Dies ist ausdrücklich eine Entscheidung des Auftraggebers** (abhängig
vom bereits gebuchten oder geplanten Hosting-Vertrag) und wurde in
diesem Reparaturlauf bewusst nicht eigenmächtig durch einen
Plattformwechsel vorweggenommen. Vor Livegang klären: Unterstützt das
vorgesehene Hosting für `www.gebaeudedienste-simin.de` eine
Node.js-Laufzeitumgebung? Falls nein, ist Weg 2 oder ein Wechsel zu
einem Node-fähigen Anbieter nötig, bevor das Formular produktiv
funktioniert.

## GitHub-Pages-Vorschau

Für eine schnelle, unbeworbene Vorschau (z. B. für internes Feedback) kann
die Seite zusätzlich statisch auf GitHub Pages veröffentlicht werden, unter
`https://sven85sf-cmd.github.io/simin-website/` (Branch `gh-pages`).

Da GitHub Pages dieses Repository unter einem Unterordner-Pfad ausliefert,
unterstützt die Website einen konfigurierbaren `base`-Pfad:

```bash
PREVIEW_BASE_PATH=/simin-website npm run build
```

`astro.config.mjs` liest `PREVIEW_BASE_PATH` nur für diesen Sonderfall;
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
`PREVIEW_BASE_PATH` bauen, den Inhalt in den `gh-pages`-Branch committen
und pushen (siehe Kommentare in `astro.config.mjs`/`BaseLayout.astro`).

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
  keine Projektbelege). Sektion zeigt deshalb einen Leerzustand, Menüpunkt
  ist ausgeblendet (`features.referencesPage`). Sobald echte Referenzfotos
  freigegeben sind: in `ReferenceGrid.astro` (`references`-Array) ergänzen
  und Flag auf `true` setzen.
- Analytics/Tracking ist bewusst **nicht** eingebunden (siehe Master-Brief
  Punkt 46). Bei Bedarf datenschutzkonform ergänzen und Datenschutzerklärung
  entsprechend erweitern.

## Launch-Checkliste

Alles hier Aufgeführte ist technisch vorbereitet und strukturell sauber
abgesichert, aber **noch nicht produktiv scharf geschaltet** bzw. hängt von
echten, außerhalb dieses Repositories liegenden Angaben/Diensten ab.

**Rechtliches**
- [ ] Impressum final rechtlich geprüft (`src/pages/impressum.astro`)
- [ ] Datenschutzerklärung final geprüft (`src/pages/datenschutz.astro`)
- [ ] Rechtsform ergänzt (aktuell nur `company.legalName` = Firmenname ohne Rechtsform)
- [ ] Vertretungsberechtigte Person ergänzt (Impressum, § 5 TMG)
- [ ] ggf. Handelsregister / USt-ID / zuständige Aufsichtsbehörde ergänzt (nur falls zutreffend)

**Hosting**
- [ ] Bestätigt: das vorgesehene Hosting für `www.gebaeudedienste-simin.de`
      unterstützt eine Node.js-Laufzeitumgebung (nicht nur statisches
      Webspace) — siehe Abschnitt „Produktions-Hosting-Anforderung“ oben.
      Ohne das läuft `/api/quote` in Produktion nicht, unabhängig davon,
      wie gut das Mail-Backend konfiguriert ist.

**Formular**
- [ ] Wix-Data-Collection „SIMIN Angebotsanfragen" im Dashboard angelegt,
      `WIX_SUBMISSIONS_COLLECTION_ID` in `.env` gesetzt (siehe Abschnitt
      „Formularbackend“ oben)
- [ ] Wix-Automation eingerichtet (Trigger: neuer Eintrag → E-Mail an
      `kontakt@gebaeudedienste-simin.de`) und aktiviert
- [ ] echte End-to-End-Testanfrage durchgeführt: Datensatz im Dashboard
      sichtbar, Dateien im Media Manager abrufbar, Benachrichtigungsmail
      angekommen — **bisher nicht getestet**, siehe Hinweis oben
- [ ] `security.allowedDomains` in `astro.config.mjs` enthält die tatsächlich
      ausgelieferte(n) Produktionsdomain(s) — **ohne passenden Eintrag
      schlägt jede Formular-Anfrage mit 403 fehl**, siehe Abschnitt
      „Formularbackend“ oben
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

## Finaler Selbstaudit

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
