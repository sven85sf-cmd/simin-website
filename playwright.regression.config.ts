import { defineConfig } from "@playwright/test";

/**
 * Eigene, serverlose Config NUR für regression-guards.spec.ts:
 * reine Quellcode-/Dateisystem-Prüfungen ohne Browser und ohne laufenden
 * Server - lässt sich daher überall ausführen (auch ohne Wix-Zugangsdaten
 * oder Netzwerkzugriff), im Gegensatz zu den übrigen e2e-Tests, die einen
 * laufenden Astro-Dev-Server mit echten, per `wix env pull` bezogenen
 * Wix-Zugangsdaten benötigen (siehe playwright.config.ts).
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "regression-guards.spec.ts",
  fullyParallel: true,
  reporter: "list",
});
