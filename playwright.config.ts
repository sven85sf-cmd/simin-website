import { defineConfig, devices } from "@playwright/test";

/**
 * Testet gegen den lokalen Node-Adapter (`npm start`, siehe
 * astro.config.static.mjs), NICHT gegen den Wix-Hosting-Adapter - der
 * Cloudflare-Workers-Emulator von `wix preview` benötigt eine echte
 * Wix-Session und ist hier nicht verfügbar. Die getesteten Routen
 * (`/api/quote`, `/api/runtime-health`) verhalten sich adapterunabhängig
 * identisch, da sie Wix-SDK-Module ausschließlich dynamisch und erst nach
 * den hier geprüften Kontrollpunkten laden.
 *
 * `npm start` läuft ohne Wix-Zugangsdaten: die Wix-Integrationen (inkl.
 * globaler Auth-Middleware) stehen nur in astro.config.mjs, nicht in
 * astro.config.static.mjs. Echte Wix-Aufrufe (Speichern, Upload, Download)
 * schlagen hier kontrolliert fehl - genau das prüfen die Fehlerfall-Tests.
 * attachment-endpoint.spec.ts erwartet den Server mit
 * ATTACHMENT_LINK_SIGNING_SECRET=e2e-test-signing-secret-not-a-real-secret.
 */
const PORT = 4321;

export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["regression-guards.spec.ts", "attachment-token.spec.ts"],
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
  },
  webServer: {
    command: "npm run start",
    url: `http://127.0.0.1:${PORT}/favicon.ico`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "api",
      testMatch: [
        "quote-api.spec.ts",
        "runtime-health.spec.ts",
        "attachment-endpoint.spec.ts",
      ],
    },
    {
      name: "visual-desktop",
      testMatch: [
        "quote-frontend.spec.ts",
        "visual.spec.ts",
        "multi-file.spec.ts",
        "hero-static.spec.ts",
      ],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "visual-mobile",
      testMatch: [
        "quote-frontend.spec.ts",
        "visual.spec.ts",
        "multi-file.spec.ts",
        "hero-static.spec.ts",
      ],
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
  ],
});
