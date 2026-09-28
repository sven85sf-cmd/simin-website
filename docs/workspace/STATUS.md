# Arbeitsstand — 2026-09-28

## Aufgabe
Gemeinsame KI-Arbeitsgrundlage im vorhandenen SIMIN-Projekt einrichten und an
bestehenden Abläufen prüfen. Ausgangscommit: `39434dfc1dd91e21eca8054c9c50cc9e39f05b27`.
Arbeitsbranch: `codex/workspace-architecture-20260928`.

## Umgesetzt
- Gemeinsame Regeln in AGENTS.md und Claude-Einstieg mit Verweis auf dieselbe Quelle.
- Workspace-Einstieg, Rollen, führende Quellen, Übergabevorlage und Qualitätsablauf.
- Pull-Request-Vorlage mit Prüfstand, Grenzen und Veröffentlichungsstatus.
- README korrigiert: Wix-Produktion versus Node-Vorschau, tatsächliche npm-Befehle,
  aktuelle Anhangsfelder, Origin-Prüfung und historische Auditangaben.
- Testserver explizit an 127.0.0.1 gebunden; zuvor Timeout der Bereitschaftsprüfung, danach 11 API-Tests bestanden.
- Keine Änderung an Website-Funktionen, Markenassets oder produktiver Wix-Konfiguration.

## Nachweise
| Prüfung | Ergebnis | Grenze |
|---|---|---|
| Repository-Zugriff | Lesen, Klonen und Schreiben über GitHub verfügbar | Öffentliches Repository |
| Abhängigkeiten | npm ci erfolgreich, 746 Pakete | Keine pauschale Sicherheitsfreigabe aller Abhängigkeiten |
| Astro/TypeScript | 80 Dateien, 0 Fehler, 0 Warnungen, 0 Hinweise | Lokale Konfiguration |
| Regression | 68 Tests bestanden | Kein produktiver CMS-/Mailnachweis |
| API-Tests | 11 Tests bestanden nach expliziter IPv4-Bindung | Lokaler Server, keine produktive Speicherung/Benachrichtigung |
| Live-Startseite | Geladen, vier Leistungsbereiche und Kontaktinformationen sichtbar | Kein vollständiger visueller Audit |
| Live-Angebotsnavigation | Startseite → /angebot erfolgreich | Nicht abgesendet |
| Pflichtfeldprüfung | Ohne Leistung sichtbare Fehlermeldung | Erster Schritt |
| Schrittnavigation | Winterdienst → Objektauswahl erfolgreich | Keine Kundendaten eingegeben |
| Wix-Backend | Anmeldung erforderlich | CMS und Automation nicht eingesehen |

## Offener Abschluss
Produktive Abnahme blockiert an der Wix-Anmeldung. Danach im bestehenden Projekt
CMS-Feldschema und aktive Automation kontrollieren. Ein echter Testversand mit
Benachrichtigung benötigt eine konkrete Versandautorisierung. Erfolg erst nach
Nachweis von Datensatz, Anhangszugriff und Nachrichteneingang dokumentieren.

Integration der Projektregeln über den Arbeitsbranch; eine produktive Website-
Veröffentlichung ist für diese Dokumentationsänderung nicht erforderlich.
