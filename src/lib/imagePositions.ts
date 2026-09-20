/**
 * Individueller vertikaler Bildausschnitt (object-position) pro Personenfoto.
 * Alle vier Fotos sind Hochformat-Aufnahmen mit Kopf im oberen Bilddrittel;
 * die Website zeigt sie aber überwiegend in breiten/flachen Containern
 * (ServicePanel, PageHero, CTASection). Ohne Anpassung schneidet der
 * mittige Standard-Crop den Kopf ab. Werte wurden anhand der Originalfotos
 * ermittelt und per Screenshot verifiziert.
 */
export const imagePositions: Record<string, string> = {
  "/images/service-gebaeudereinigung.webp": "center 14%",
  "/images/service-objektservice.webp": "center 6%",
  "/images/service-aussenanlagen-gruen.webp": "center 2%",
  "/images/service-winterdienst.webp": "center 4%",
  "/images/service-aussenanlagen.webp": "center 6%",
};
