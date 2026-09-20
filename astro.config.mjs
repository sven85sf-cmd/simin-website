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
    inlineStylesheets: "auto",
  },
  image: {
    remotePatterns: [],
  },
});
