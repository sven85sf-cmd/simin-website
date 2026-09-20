import { defineConfig } from "astro/config";
import node from "@astrojs/node";

export default defineConfig({
  site: "https://www.gebaeudedienste-simin.de",
  // Nur für GitHub-Pages-Previews gesetzt (z. B. PREVIEW_BASE_PATH=/simin-website).
  // In Produktion bleibt base "/", ohne Auswirkung auf die echte Domain.
  base: process.env.PREVIEW_BASE_PATH || "/",
  output: "static",
  adapter: node({ mode: "standalone" }),
  trailingSlash: "never",
  compressHTML: true,
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
  },
});
