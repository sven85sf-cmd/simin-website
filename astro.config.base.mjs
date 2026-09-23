import { envField } from "astro/config";
import react from "@astrojs/react";
import wix from "@wix/astro";
import wixPages from "@wix/astro-pages";

/**
 * Konfiguration, die für JEDE Astro-Config-Variante identisch gilt
 * (Wix-Produktionskonfiguration in astro.config.mjs UND die lokale/
 * GitHub-Pages-Variante in astro.config.static.mjs). Enthält bewusst
 * NICHT `output`/`adapter` - das ist der einzige Unterschied zwischen
 * den beiden Dateien und wird dort jeweils fest (ohne Bedingung)
 * gesetzt, damit `wix build`/`wix dev`/`wix preview` niemals versehentlich
 * auf die falsche Konfiguration zurückfallen können.
 */
export const baseConfig = {
  site: "https://www.gebaeudedienste-simin.de",

  // Nur für GitHub-Pages-Previews gesetzt (z. B. PREVIEW_BASE_PATH=/simin-website).
  // In Produktion bleibt base "/", ohne Auswirkung auf die echte Domain.
  base: process.env.PREVIEW_BASE_PATH || "/",

  trailingSlash: "never",
  compressHTML: true,

  security: {
    // Astros eingebaute checkOrigin-CSRF-Prüfung vergleicht den
    // Origin-Header gegen `request.url`. Hinter Wix' Reverse-Proxy/
    // Hosting-Layer (Cloudflare Workers) spiegelt `request.url` nicht
    // zuverlässig den echten öffentlichen Host wider, den der Browser als
    // Origin sendet - bestätigt durch eine echte 403-Antwort "Cross-site
    // POST form submissions are forbidden" auf der Wix-Preview. Da
    // `allowedDomains` (siehe unten) eine ANDERE Prüfung betrifft
    // (Vertrauen in den `X-Forwarded-Host`-Header, nicht checkOrigin),
    // löst es dieses Problem nicht. Deshalb hier deaktiviert; der
    // eigentliche CSRF-/Origin-Schutz für /api/quote läuft jetzt
    // ausschließlich über die explizite Origin-Allowlist in
    // src/pages/api/quote.ts (isAllowedOrigin()), die NICHT gegen
    // request.url prüft und dadurch von diesem Proxy-Problem unabhängig
    // ist.
    checkOrigin: false,

    // Betrifft NICHT checkOrigin, sondern das Vertrauen in den
    // X-Forwarded-Host-Header (z. B. für von Astro selbst konstruierte
    // absolute URLs) hinter einem Reverse Proxy. Bleibt aus genau diesem,
    // separaten Grund weiterhin gesetzt.
    allowedDomains: [
      { hostname: "www.gebaeudedienste-simin.de", protocol: "https" },
      { hostname: "**.wix-site-host.com", protocol: "https" },
    ],
  },

  build: {
    // "always" statt "auto": mit "auto" hat Vite/Astro einen Teil des
    // globalen Reveal-System-CSS (aus global.css) in einen Chunk gepackt,
    // der auf der Startseite gar nicht eingebunden wurde (nur z. B. auf
    // /angebot) - das Reveal-System griff dadurch auf der Startseite
    // lautlos nicht. "always" inlined jede Seite vollständig und macht
    // dieses Chunking-Risiko strukturell unmöglich.
    inlineStylesheets: "always",
  },

  image: {
    remotePatterns: [],
    domains: ["static.wixstatic.com"],
  },

  // Auf Cloudflare Workers (Wix-Hosting-Adapter) hat `process.env` keine
  // zuverlässige Verbindung zu echten, im Wix-Dashboard gesetzten
  // Environment Variables - Cloudflare übergibt sie pro Request über ein
  // `env`-Binding-Objekt, nicht über den Node-üblichen `process.env`.
  // `astro:env/server` ist der offiziell von Astro/dem Cloudflare-Adapter
  // unterstützte, adapterübergreifende Weg dafür. Collection-ID ist nicht
  // sensibel (kein Secret), soll aber ausschließlich serverseitig lesbar
  // sein - daher access: "public", context: "server". `optional: true`,
  // damit ein fehlender Wert kontrolliert behandelt werden kann statt
  // einen Build-/Validierungsfehler auszulösen.
  env: {
    schema: {
      WIX_SUBMISSIONS_COLLECTION_ID: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),

      // Signiert die Capability-Token für /api/attachment (privater
      // Wix-Media-Zugriff aus der Benachrichtigungs-E-Mail heraus, siehe
      // src/lib/attachmentLink.ts). `access: "secret"` stellt sicher,
      // dass Astro diesen Wert niemals ins Client-Bundle aufnimmt.
      // `optional: true`, damit ein fehlender Wert kontrolliert behandelt
      // wird (keine Access-Links für diese Anfrage, siehe
      // submissionsRepository.ts) statt eines Build-/Laufzeitfehlers.
      ATTACHMENT_LINK_SIGNING_SECRET: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),

      // Gültigkeitsdauer des SIMIN-eigenen Capability-Links in Stunden
      // (NICHT die kurzlebige, erst beim Klick erzeugte Wix-Download-URL -
      // siehe src/pages/api/attachment.ts). Default 168h = 7 Tage, damit
      // Konstantin die Benachrichtigungs-Mail auch Tage später noch öffnen
      // kann.
      ATTACHMENT_LINK_TTL_HOURS: envField.number({
        context: "server",
        access: "public",
        default: 168,
      }),
    },
  },

  // robots: false, da @wix/astro sonst eine eigene /robots.txt-Route
  // registriert, die mit der bestehenden src/pages/robots.txt.ts kollidiert
  // ("A static route cannot be defined more than once", zuletzt als Warnung,
  // laut Astro künftig ein Hard-Error). Wix' eigene Route proxied nur das
  // generische Wix-robots.txt und kennt die hier gewünschte
  // Preview-noindex-/Production-indexierbar-Logik nicht – die bestehende,
  // vollständigere eigene Route bleibt deshalb aktiv.
  integrations: [react(), wix({ robots: false }), wixPages()],
};
