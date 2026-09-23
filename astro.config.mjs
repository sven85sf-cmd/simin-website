import { defineConfig } from "astro/config";
import wixHostingAdapter from "@wix/astro-wix-hosting-adapter";

import { baseConfig } from "./astro.config.base.mjs";

/**
 * Dies ist die Konfiguration, die `wix dev`, `wix build` UND `wix preview`
 * lesen (Astros Standard-Dateiname, ohne `--config`-Override). Sie MUSS
 * für alle drei identisch und unconditional Wix-konfiguriert sein - eine
 * frühere Version wählte den Adapter abhängig von `npm_lifecycle_event`
 * ("build" vs. alles andere). Das brach genau dann, wenn `wix preview`
 * intern nicht mit `npm_lifecycle_event=build` läuft: `wix build` bekam
 * korrekt den Wix-Hosting-Adapter, `wix preview` fiel aber wieder auf
 * `@astrojs/node`/`output: "static"` zurück - und reproduzierte dadurch
 * exakt "Cannot find package 'react' imported from /user-code/renderers.mjs",
 * weil dieser Adapter/Output-Modus Framework-Pakete bewusst nicht bündelt
 * (bare `import ... from "react"`, zur Laufzeit aus node_modules aufgelöst),
 * was auf Wix' Cloudflare-Workers-Runtime (kein node_modules zur Laufzeit)
 * fehlschlägt.
 *
 * Deshalb hier KEINE Bedingung mehr: `output: "server"` und
 * `adapter: wixHostingAdapter()` sind fest, genauso wie es die offizielle
 * Wix-Doku für ein verlinktes Astro-5-Projekt vorsieht. Lokal verifiziert:
 * dist/_worker.js/renderers.mjs enthält 0 bare `import ... from "react"`
 * -Zeilen (React vollständig inline gebündelt), Manifest meldet
 * adapterName "@astrojs/cloudflare".
 *
 * Lokale Entwicklung/Typecheck/GitHub-Pages-Build laufen über die separate
 * astro.config.static.mjs (siehe dort) - explizit per `--config`, niemals
 * durch eine Bedingung in dieser Datei.
 */
// Bewusst dauerhaft vorhanden (nicht nur zum Debuggen entfernt): macht in
// jedem Terminal-Log von `wix dev`/`wix build`/`wix preview` sofort
// nachprüfbar, welche Config-Datei/Adapter aktiv war - genau das, was den
// vorherigen Fehler (stiller Rückfall auf eine andere Konfiguration) erst
// unentdeckt gemacht hat.
console.log(
  `[astro.config.mjs] output=server adapter=wixHostingAdapter(@astrojs/cloudflare) npm_lifecycle_event=${process.env.npm_lifecycle_event}`,
);

export default defineConfig({
  ...baseConfig,
  output: "server",
  adapter: wixHostingAdapter(),
});
