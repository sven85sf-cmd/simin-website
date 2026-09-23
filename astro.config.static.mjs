import { defineConfig } from "astro/config";
import node from "@astrojs/node";

import { baseConfig } from "./astro.config.base.mjs";

/**
 * Separate Konfiguration für alles, was NICHT der echte Wix-Build/-Preview
 * ist: lokale Entwicklung außerhalb von `wix dev` (`npm start`), Typecheck
 * (`npm run check`) und der GitHub-Pages-Preview-Build (`npm run
 * build:unsafe`, ggf. mit `PREVIEW_BASE_PATH`).
 *
 * Bewusst als eigene Datei statt als Bedingung in astro.config.mjs: genau
 * diese Art von Bedingung (Adapterwahl abhängig von einer zur Laufzeit
 * gelesenen Umgebungsvariable) hatte zuvor `wix preview` versehentlich auf
 * diese Konfiguration zurückfallen lassen, wenn deren interner Aufruf
 * `npm_lifecycle_event` nicht wie erwartet setzte. Mit getrennten Dateien
 * gibt es dieses Risiko nicht mehr: `wix dev`/`wix build`/`wix preview`
 * lesen ausschließlich astro.config.mjs, alles hier wird nur über einen
 * expliziten `--config astro.config.static.mjs`-Aufruf erreicht (siehe
 * package.json-Skripte `start`, `check`, `build:unsafe`).
 *
 * `@wix/astro-wix-hosting-adapter`s Cloudflare-Workers-Emulator benötigt
 * lokal glibc ≥ 2.32; der bisherige Node-Adapter läuft dagegen überall -
 * genau das von Wix selbst dokumentierte Muster ("local development runs
 * plain Node SSR").
 */
// Siehe astro.config.mjs für die Begründung, warum dieses Log dauerhaft
// bleibt statt nur zum Debuggen entfernt zu werden.
console.log(
  `[astro.config.static.mjs] output=static adapter=node(standalone) npm_lifecycle_event=${process.env.npm_lifecycle_event}`,
);

export default defineConfig({
  ...baseConfig,
  output: "static",
  adapter: node({ mode: "standalone" }),
});
