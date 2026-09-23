import { defineConfig } from "astro/config";
import node from "@astrojs/node";

import react from "@astrojs/react";
import wix from "@wix/astro";
import wixPages from "@wix/astro-pages";

export default defineConfig({
  site: "https://www.gebaeudedienste-simin.de",

  // Nur für GitHub-Pages-Previews gesetzt (z. B. PREVIEW_BASE_PATH=/simin-website).
  // In Produktion bleibt base "/", ohne Auswirkung auf die echte Domain.
  base: process.env.PREVIEW_BASE_PATH || "/",

  output: "static",
  adapter: node({ mode: "standalone" }),
  trailingSlash: "never",
  compressHTML: true,

  security: {
    // OHNE dies validiert Astros eingebaute CSRF-Origin-Prüfung (nur für
    // die eine on-demand-Route /api/quote relevant) den Host-Header nicht
    // gegen die echte Produktionsdomain und fällt intern auf ein leeres
    // "http://localhost" zurück - eine echte Formular-Anfrage vom echten
    // Origin (https://www.gebaeudedienste-simin.de) würde dadurch IMMER
    // mit 403 "Cross-site POST form submissions are forbidden" abgelehnt.
    // Mit dieser Domain in der Allowlist wird der tatsächliche Host korrekt
    // erkannt und die Origin-Prüfung funktioniert wie vorgesehen.
    //
    // Zusätzlich: Wix-Managed-Headless-Previews laufen auf einer von Wix
    // generierten *.wix-site-host.com-Subdomain (siehe .wix/topology.json).
    // Ohne diesen Eintrag würde eine Testanfrage über die Wix-Preview aus
    // demselben Grund mit "Cross-site POST form submissions are forbidden"
    // fehlschlagen. Als Wildcard auf Wix' eigene, dedizierte Preview-Domain
    // beschränkt (nicht pauschal offen), da die konkrete Subdomain sich pro
    // Deployment ändern kann.
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

  // robots: false, da @wix/astro sonst eine eigene /robots.txt-Route
  // registriert, die mit der bestehenden src/pages/robots.txt.ts kollidiert
  // ("A static route cannot be defined more than once", zuletzt als Warnung,
  // laut Astro künftig ein Hard-Error). Wix' eigene Route proxied nur das
  // generische Wix-robots.txt und kennt die hier gewünschte
  // Preview-noindex-/Production-indexierbar-Logik nicht – die bestehende,
  // vollständigere eigene Route bleibt deshalb aktiv.
  integrations: [react(), wix({ robots: false }), wixPages()],
});