import { defineConfig } from "astro/config";
import node from "@astrojs/node";

export default defineConfig({
  site: "https://www.gebaeudedienste-simin.de",
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
