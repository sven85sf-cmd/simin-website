# SIMIN Workspace

Diese Projektgrundlage verbindet Planung, Umsetzung, Prüfung und Übergabe im bestehenden Repository.
Persönliche Workspace-Architektur und andere Projekte werden getrennt und privat geführt.

## Einstieg

1. [Gemeinsame Regeln](../../AGENTS.md)
2. [Aktueller Status](STATUS.md)
3. [Qualitätsprüfung](QUALITY.md)
4. [Übergabevorlage](HANDOFF.md)
5. [Technische Anleitung](../../README.md)

## Rollen

| Rolle | Aufgabe | Verbindliches Ergebnis |
|---|---|---|
| Auftraggeber | Ziel, unveränderliche Vorgaben und notwendige Entscheidungen | Auftrag und Abnahme |
| Planender Assistent | Quellen, Abhängigkeiten, Werkzeugwahl, nächster Schritt | Bearbeitbarer Auftrag |
| Codex oder Claude als Bearbeiter | Umsetzung im selben Repository | Diff und Commit |
| Prüfung | Angemessene Tests und Sichtkontrolle | Nachweise und offene Grenzen |

Die Rollentrennung verlangt keine zusätzlichen Abos und behauptet keine automatische
Kommunikation zwischen KI-Diensten. Ein Bearbeiter kann mehrere Rollen nacheinander übernehmen.

## Datenfluss

Auftrag → aktuelle Quelldateien → Arbeitsbranch → Änderung → Prüfung → Status/Übergabe → Integration.
Produktive Wix-Veröffentlichung ist ein eigener Schritt mit passender Autorisierung.
Bei fehlgeschlagener Prüfung zurück zur betroffenen Änderung; bei fehlendem Zugang
Blocker dokumentieren und unabhängige Aufgaben abschließen.

## Architekturentscheidung 2026-09-28

Das bestehende GitHub-Repository bleibt führend für Code und technische Projektregeln.
Wix bleibt Laufzeit, CMS und Automation. Keine zusätzliche Datenbank und kein zweites
Dashboard für dieselben Projektinformationen. Freigegebene Designquellen bleiben an
ihrem bisherigen Ort; bearbeitete Website-Assets liegen im Repository.

Eine Änderung ist abgeschlossen, wenn das vereinbarte Verhalten umgesetzt, angemessen
geprüft und dauerhaft versioniert ist. Eine produktive Integration ist erst abgeschlossen,
wenn auch die benötigten Live-Nachweise vorliegen.
