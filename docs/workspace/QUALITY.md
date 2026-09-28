# Qualität und Praxistest

## Ohne Wix-Anmeldung

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm run test:regression
```

`check` prüft Astro/TypeScript; die serverlosen Regressionstests prüfen unter anderem
Architekturgrenzen, HMAC-Signaturen und abgelaufene/ungültige Anhang-Token.
`--ignore-scripts` wurde für diesen Workflow geprüft. Falls eine spätere Abhängigkeit
Installationsskripte benötigt, Ursache untersuchen statt Schutzmechanismen blind zu umgehen.

Für Änderungen am API-Verhalten zusätzlich:

```bash
ATTACHMENT_LINK_SIGNING_SECRET=e2e-test-signing-secret-not-a-real-secret npm run test:e2e -- --project=api
```

Das ist ein ausschließlich lokaler Testwert. Er darf nie produktiv verwendet werden.
Der Testserver läuft über `npm start` und benötigt für lokale Fehlerfälle keine Wix-Anmeldung.

Für Layoutänderungen zusätzlich Desktop/Mobil-Tests und visuelle Prüfung; Browserinstallation
nur, wenn die Umgebung sie benötigt und erlaubt. Nicht jede Dokumentationsänderung benötigt einen Volltest.

## Build-Grenzen

- `npm run build:unsafe`: explizit lokale/statische Buildvariante; enthält keinen Typecheck.
- `npm run build`: echter Wix-Build; benötigt die passende Wix-Umgebung.
- `npm run release`: Veröffentlichung über Wix; kein allgemeiner Prüfbefehl.
- Das vorhandene `lint`-Skript ist derzeit kein verlässliches Gate: ESLint ist nicht als direkte
  Abhängigkeit mit passender Konfiguration eingerichtet. Deshalb kein grünes Lint-Ergebnis behaupten.

## Produktiver SIMIN-Test

1. Startseite und Angebotsnavigation laden, Auswahl und Validierung prüfen.
2. Wix-CMS und aktive Automation im richtigen Projekt prüfen.
3. Erst mit ausdrücklich autorisiertem Testversand eine klar markierte Testanfrage absenden.
4. Datensatz, Anhänge, signierten Zugriff und Eingang der Benachrichtigung einzeln nachweisen.
5. Kein erfolgreicher End-to-End-Status, solange einer dieser Nachweise fehlt.

Keine echten Kundenanfragen zum Testen verwenden. Kundendaten und signierte Downloadlinks
gehören nicht in öffentliche Testberichte. Testdaten nur im autorisierten Umfang entfernen.
