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
 * WICHTIG: `npm start` benötigt echte, per `npx wix env pull` bezogene
 * Wix-Zugangsdaten (WIX_CLIENT_ID etc.) - die globale Auth-Middleware von
 * `@wix/astro` (aus astro.config.base.mjs, integrations: [wix(...)])
 * versucht für JEDE Route (auch /api/quote und /api/runtime-health) einen
 * Visitor-Token beim Wix-OAuth-Endpunkt zu holen, BEVOR die eigentliche
 * Route ausgeführt wird. Ohne echte Zugangsdaten schlägt das für JEDE
 * Route fehl (nicht nur für /api/quote) - das ist eine Eigenschaft von
 * `@wix/astro` selbst, keine Regression dieses Reparaturdurchgangs. Diese
 * Tests laufen deshalb NICHT in einer offline-Sandbox ohne Wix-Session;
 * regression-guards.spec.ts (siehe playwright.regression.config.ts) prüft
 * die hier reparierten Codepfade serverlos und ohne Zugangsdaten.
 */
const PORT = 4321;

export default defineConfig({
  testDir: "./e2e",
  testIgnore: "regression-guards.spec.ts",
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
      testMatch: ["quote-api.spec.ts", "runtime-health.spec.ts"],
    },
    {
      name: "visual-desktop",
      testMatch: ["quote-frontend.spec.ts", "visual.spec.ts"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "visual-mobile",
      testMatch: ["quote-frontend.spec.ts", "visual.spec.ts"],
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
  ],
});
