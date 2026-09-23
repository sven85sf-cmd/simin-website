import { test, expect } from "@playwright/test";

/**
 * Prüft, dass das Hero-Hintergrundbild vollständig statisch ist (keine
 * Zoom-/Scale-/TranslateY-/Drift-Animation mehr) und trotzdem kein CLS/
 * Flackern entsteht, während die Text-/Logo-Reveal-Sequenz weiterhin
 * einmalig und ruhig abläuft.
 */

const CHECK_DELAYS_MS = [0, 100, 500, 2000, 5000];

test("Hero-Bild: keine laufende Animation, kein Transform, stabile BoundingBox über die Zeit", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto("/");

  const heroImage = page.locator(".hero__image");
  await expect(heroImage).toBeVisible();

  const samples: {
    animationName: string;
    transform: string;
    box: { x: number; y: number; width: number; height: number } | null;
  }[] = [];

  for (const delay of CHECK_DELAYS_MS) {
    if (delay > 0) await page.waitForTimeout(delay);

    const computed = await heroImage.evaluate((el) => {
      const style = getComputedStyle(el);
      return { animationName: style.animationName, transform: style.transform };
    });
    const box = await heroImage.boundingBox();
    samples.push({ ...computed, box });
  }

  for (const sample of samples) {
    expect(
      sample.animationName,
      "keine laufende Animation auf dem Hero-Bild",
    ).toBe("none");
    expect(
      ["none", "matrix(1, 0, 0, 1, 0, 0)"],
      "kein Transform auf dem Hero-Bild",
    ).toContain(sample.transform);
  }

  const first = samples[0].box;
  for (const sample of samples.slice(1)) {
    expect(sample.box).not.toBeNull();
    if (first && sample.box) {
      expect(Math.abs(first.x - sample.box.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(first.y - sample.box.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(first.width - sample.box.width)).toBeLessThanOrEqual(1);
      expect(Math.abs(first.height - sample.box.height)).toBeLessThanOrEqual(1);
    }
  }

  expect(consoleErrors).toEqual([]);
});

test("Hero-Bild: keine horizontale Verschiebung, kein sichtbar->unsichtbar->sichtbar-Wechsel", async ({
  page,
}) => {
  await page.goto("/");

  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1,
  );
  expect(hasHorizontalOverflow).toBe(false);

  // Das Hero-Bild selbst trägt kein [data-reveal] und darf daher NIE über
  // opacity ein-/ausgeblendet werden (nur der Text/Logo-Inhalt tut das).
  const heroImageOpacityHistory: string[] = [];
  const heroImage = page.locator(".hero__image");
  for (const delay of [0, 50, 150, 400]) {
    if (delay > 0) await page.waitForTimeout(delay);
    heroImageOpacityHistory.push(
      await heroImage.evaluate((el) => getComputedStyle(el).opacity),
    );
  }
  expect(heroImageOpacityHistory.every((o) => o === "1")).toBe(true);
});

test("Hero-Text/Logo-Reveal läuft einmalig und ruhig ein, ohne Reset/Doppel-Reveal", async ({
  page,
}) => {
  await page.goto("/");

  const revealTargets = page.locator(".hero [data-reveal]");
  await expect(revealTargets.first()).toBeVisible();

  // Nach dem Laden müssen alle Hero-Reveal-Elemente sichtbar sein (die
  // eigene, sofortige Hero-Reveal-Behandlung aus BaseLayout.astro) und
  // dürfen sich danach nicht mehr zurücksetzen.
  await page.waitForTimeout(600);
  const visibilityStates: boolean[][] = [];
  for (const delay of [0, 300, 800]) {
    if (delay > 0) await page.waitForTimeout(delay);
    const states = await revealTargets.evaluateAll((els) =>
      els.map((el) => el.classList.contains("is-visible")),
    );
    visibilityStates.push(states);
  }

  for (const states of visibilityStates) {
    expect(states.every(Boolean)).toBe(true);
  }
});

test("Nach Navigation zurück zur Startseite: Hero-Bild weiterhin stabil (kein erneuter Sprung)", async ({
  page,
}) => {
  await page.goto("/");
  await page.goto("/kontakt");
  await page.goBack();

  const heroImage = page.locator(".hero__image");
  await expect(heroImage).toBeVisible();

  const animationName = await heroImage.evaluate(
    (el) => getComputedStyle(el).animationName,
  );
  expect(animationName).toBe("none");
});
