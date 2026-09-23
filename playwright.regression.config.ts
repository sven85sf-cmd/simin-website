import { defineConfig } from "@playwright/test";

/**
 * Eigene, serverlose Config NUR für Tests, die weder einen laufenden
 * Astro-Dev-Server noch das Wix-SDK/astro:env benötigen: reine
 * Quellcode-/Dateisystem-Prüfungen (regression-guards.spec.ts) und echte,
 * ausgeführte Korrektheitstests für importfreien Utility-Code
 * (attachment-token.spec.ts - HMAC-Signatur-/Ablauflogik, läuft direkt
 * unter Node ohne Astro-Pipeline). Lässt sich deshalb überall ausführen
 * (auch ohne Wix-Zugangsdaten oder Netzwerkzugriff), im Gegensatz zu den
 * übrigen e2e-Tests, die einen laufenden Astro-Dev-Server mit echten, per
 * `wix env pull` bezogenen Wix-Zugangsdaten benötigen (siehe
 * playwright.config.ts).
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: ["regression-guards.spec.ts", "attachment-token.spec.ts"],
  fullyParallel: true,
  reporter: "list",
});
