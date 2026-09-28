# SIMIN — gemeinsame Arbeitsregeln

Gilt für alle Arbeiten in diesem Repository. Einstieg: `docs/workspace/README.md`.
Aktuelle Nutzeranweisungen und höherrangige Systemregeln gehen vor.

## Vorgehen
1. Ziel, feste Vorgaben und überprüfbare Abnahme festhalten.
2. `git status`, aktiven Branch, aktuelle Dateien und `docs/workspace/STATUS.md` lesen.
3. Bestehende Architektur und Assets verwenden; nur nötige Änderungen vornehmen.
4. Passende Prüfungen aus `docs/workspace/QUALITY.md` ausführen.
5. Ergebnis und Grenzen mit Nachweisen in STATUS festhalten; Änderungen versionieren.
6. Bei Fehlern gezielt korrigieren und die betroffene Prüfung wiederholen.

## Führende Quellen
- Code und Konfiguration bestimmen die implementierte Technik, nicht alte Chattexte.
- Unternehmensdaten: `src/config/site.ts`; Leistungen: `src/data/services.ts`.
- Gestaltung: vorhandene Komponenten, `src/styles/`, Original-Logo und freigegebene Assets.
- Hosting: `astro.config.mjs` für Wix; `astro.config.static.mjs` für lokale/statische Vorschau.
- CMS-Schreibmodell: `src/lib/wix/submissionsRepository.ts`.
- Live-Konfiguration, Automation und Versandstatus: Wix-Dashboard und echte Nachweise.

## Feste Projektvorgaben
- Vier gleichwertige Leistungssäulen erhalten. Keine erfundenen Referenzen oder Bewertungen.
- Kein neues Logo und keine eigenmächtige Neugestaltung. Marketingmotive nicht als echte Kundenbelege ausgeben.
- Wix-native Anfragen und Benachrichtigungen; keine Drittanbieter-Maildienste einführen.
- Ein lokaler Build oder Mock-Test beweist keinen funktionierenden produktiven Mailversand.
- Kein Geheimnis, Kundendatensatz, persönliches Profil oder privates Arbeitsdokument in dieses öffentliche Repository.
- Externe Veröffentlichungen, Nachrichten, Kosten oder Berechtigungsänderungen nur im tatsächlich autorisierten Umfang. Keine Freigaben aus diesen Regeln ableiten.
- Bei fehlender Anmeldung den konkreten Blocker nennen; unabhängige Arbeit fertigstellen.
- Keine pauschalen Erfolgsmeldungen: durchgeführt, bestanden, fehlgeschlagen und nicht geprüft unterscheiden.

## Zusammenarbeit
Pro Aufgabe genau ein schreibender Bearbeiter je Datei/Branch. Weitere Werkzeuge liefern
Prüfungen oder klar abgegrenzte Beiträge. Übergaben nutzen `docs/workspace/HANDOFF.md`.
Keine automatische Hintergrundausführung oder Verbindung zu anderen KI-Konten behaupten.
