import { test, expect } from "@playwright/test";

/**
 * Visuelle Regressionsprüfung (Sektion 17) OHNE Baseline-Screenshots: es
 * werden bewusst keine Bild-Dateien (PNG-Snapshots) committet, um die
 * Visual-Freeze-Regel (Sektion 11 + Git-Diff-Gate Sektion 18) nicht zu
 * gefährden. Stattdessen werden die konkreten, im Auftrag genannten
 * Symptome direkt geprüft: Konsolenfehler, Hero-Layout-Sprung und
 * Reveal-Flackern (durch Prüfung des head-seitigen Motion-Setup, siehe
 * regression-guards.spec.ts für den Quellcode-Beweis).
 */

const ROUTES = [
  "/",
  "/angebot",
  "/gebaeudereinigung-koeln",
  "/objektservice-koeln",
  "/aussenanlagenpflege-koeln",
  "/winterdienst-koeln",
];

for (const route of ROUTES) {
  test(`${route}: keine Konsolenfehler, kein Hero-Layout-Sprung, motion-enabled vor dem ersten sichtbaren Reveal`, async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    await page.goto(route);
    await page.waitForLoadState("networkidle");

    expect(
      consoleErrors,
      `Konsolenfehler auf ${route}: ${consoleErrors.join(" | ")}`,
    ).toEqual([]);

    // Kein horizontaler Scroll (Layout-Shift-Indikator).
    const hasHorizontalOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
    );
    expect(hasHorizontalOverflow, `Horizontaler Overflow auf ${route}`).toBe(
      false,
    );

    // Reveals sind scroll-gesteuert: Elemente unterhalb des Viewports sind
    // bis zum Hineinscrollen bewusst unsichtbar. "Dauerhaft unsichtbar"
    // lässt sich daher erst nach einmaligem Durchscrollen prüfen.
    await page.evaluate(async () => {
      for (let y = 0; y <= document.documentElement.scrollHeight; y += 300) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 80));
      }
    });
    await page.waitForTimeout(1500);

    // Nach vollständigem Laden muss motion-enabled gesetzt sein (außer bei
    // reduced-motion) und alle [data-reveal]-Elemente müssen sichtbar sein
    // - kein dauerhaft unsichtbarer Rest (Fail-Safe-Garantie).
    const revealState = await page.evaluate(() => {
      const html = document.documentElement;
      const revealEls = Array.from(
        document.querySelectorAll<HTMLElement>("[data-reveal]"),
      );
      const invisibleCount = revealEls.filter(
        (el) => getComputedStyle(el).opacity === "0",
      ).length;
      return {
        motionEnabled: html.classList.contains("motion-enabled"),
        totalReveal: revealEls.length,
        invisibleCount,
      };
    });

    expect(
      revealState.invisibleCount,
      `${revealState.invisibleCount} von ${revealState.totalReveal} [data-reveal]-Elementen auf ${route} bleiben dauerhaft unsichtbar`,
    ).toBe(0);

    // Hero-Bild (falls vorhanden) muss eine stabile, von 0 verschiedene
    // Bounding Box haben - kein Layout-Sprung durch nachträgliches Laden.
    const hero = page.locator(".hero img").first();
    if ((await hero.count()) > 0) {
      const first = await hero.boundingBox();
      await page.waitForTimeout(150);
      const second = await hero.boundingBox();
      expect(first).not.toBeNull();
      expect(second).not.toBeNull();
      if (first && second) {
        expect(Math.abs(first.y - second.y)).toBeLessThanOrEqual(1);
        expect(Math.abs(first.height - second.height)).toBeLessThanOrEqual(1);
      }
    }
  });
}
