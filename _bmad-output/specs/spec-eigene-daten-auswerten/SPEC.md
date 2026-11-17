---
id: SPEC-eigene-daten-auswerten
companions: []
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Eigene Daten auswerten

## Why

Nutzer sammeln Check-ins, können sie aber nur als JSON-Backup herausholen und auf der Habit-Seite keine Serien oder Lücken über Monate sehen. Der Epic (GitHub Issues #3 und #4) macht die eigenen Daten auswertbar: extern in einer Tabellenkalkulation (CSV) und intern auf einen Blick (Heatmap pro Habit).

## Capabilities

- **CAP-1**
  - **intent:** Nutzer kann in den Einstellungen neben dem JSON-Backup alle Check-ins als CSV-Datei herunterladen, ohne dass Daten verändert werden.
  - **success:** Button "Check-ins als CSV exportieren" lädt `habit-checkins-<datum>.csv` herunter; ein E2E-Test prüft den Download, ein Vergleich der Daten vor und nach dem Export zeigt keine Änderung.
- **CAP-2**
  - **intent:** Die CSV ist in Tabellenkalkulationen korrekt lesbar.
  - **success:** Kopfzeile und Spalten `date, habit_id, habit_name, category, status, reason, note`; Status ist done, missed oder skipped, `reason` der gespeicherte Code (z. B. `forgot`); `category`, `reason` und `note` sind leer, falls nicht vorhanden. Unit-Tests belegen RFC-4180-Escaping von Kommas, Anführungszeichen und Zeilenumbrüchen, erhaltene Umlaute und das Apostroph-Präfix bei Zellen, die mit `=`, `+`, `-`, `@`, Tab oder CR beginnen; die Datei öffnet sich in Excel und Numbers mit korrekten Umlauten.
- **CAP-3**
  - **intent:** Ohne Check-ins entsteht keine leere CSV-Datei.
  - **success:** Bei null Check-ins ist der Button deaktiviert oder ein Hinweis erscheint; es wird keine Datei heruntergeladen (Test belegt es).
- **CAP-4**
  - **intent:** Nutzer sieht auf `/app/habits/[id]` oberhalb des Bearbeitungsformulars eine Heatmap der letzten 12 Monate mit einer Zelle pro Tag, nach Wochen gruppiert.
  - **success:** Die Seite zeigt Heatmap vor dem Formular mit einer Zelle je Kalendertag der letzten 12 Monate; Komponententest und E2E-Test prüfen Zellanzahl und Position.
- **CAP-5**
  - **intent:** Die Darstellung unterscheidet erledigt, verpasst, übersprungen, offen, nicht fällig und Pause; der Wochenbeginn folgt der Einstellung. Offen ist ein fälliger vergangener Tag ohne Check-in; heute zählt wie offen und ist zusätzlich umrandet; die Heatmap endet heute. Tage vor `startDate` sind nicht fällig; Pause hat zusätzlich eine Schraffur.
  - **success:** Ein Test mit einem Habit mit je einem Tag jedes Status zeigt sechs unterscheidbare Darstellungen, Pause auch ohne Farbe erkennbar; Wechsel von `weekStartsOn` zwischen 0 und 1 verschiebt die Wochenspalten entsprechend.
- **CAP-6**
  - **intent:** Die Heatmap ist per Tastatur und Screenreader nutzbar.
  - **success:** Jede Zelle nennt Datum und Status (bei Pause: "Pause") über Tooltip und Textlabel; Zellen sind per Tastatur erreichbar; ein Test prüft Labels und Fokus.
- **CAP-7**
  - **intent:** Die Heatmap funktioniert im Hell- und Dunkelmodus und auf dem Handy.
  - **success:** Bei 375 px Breite scrollt die Seite nicht horizontal, nur der interne Scroll-Container der Heatmap, der rechts bei heute startet; alle Status sind in beiden Farbmodi unterscheidbar (Screenshot-Prüfung).

## Constraints

- CSV-Format: Komma nach RFC 4180, UTF-8 mit BOM.
- Der CSV-Export ist rein lesend; er ändert weder Daten noch Schema und beeinflusst den Backup-Nudge (`lastExportedAt`) nicht.
- Keine neuen Abhängigkeiten für die Heatmap.
- Keine Schemaänderung an `app/types/app-data.ts` oder dem Zod-Schema; sonst braucht es einen neuen ADR (ADR-0006, ADR-0022).
- CSV-Erzeugung und Heatmap-Berechnung liegen als reine Logik in `app/utils/domain/` (ohne Vue und Storage); UI liest aus den Stores.
- Die Seite scrollt nie horizontal; die Heatmap darf einen eigenen Scroll-Container haben.
- Archivierte Habits zeigen die Heatmap normal; die CSV enthält auch archivierte Habits.
- Pause-Tage sind nie fällig (ADR-0010); die Heatmap folgt dieser Fachregel.
- Unit-Tests für die CSV-Erzeugung, E2E-Test für den Download; E2E nie auf Port 3000, Tests nie abschwächen.
- UI-Texte sind Englisch (AGENTS.md), auch wenn die Issues Deutsch sind.

## Lieferung

CSV-Export (CAP-1 bis CAP-3) und Heatmap (CAP-4 bis CAP-7) sind unabhängig voneinander lieferbar.

## Non-goals

- Kein Semikolon-Trennzeichen und keine Locale-Anpassung der CSV.
- Kein CSV-Import und kein Ersatz des JSON-Backups.
- Keine Heatmap über alle Habits (Dashboard/Insights) und kein anderer Zeitraum als 12 Monate.
- Kein Export von Habits, Einstellungen oder Coaching-Vorschlägen.

## Success signal

Nutzer lädt ihre Check-ins als CSV, öffnet sie in Excel oder Numbers mit korrekten Umlauten und sieht auf der Seite eines Habits seine Serien und Lücken der letzten 12 Monate auf einen Blick, auch auf dem Handy im Dunkelmodus.

## Assumptions

- Die CSV enthält alle Zeiträume, sortiert nach Datum, mit CRLF-Zeilenenden (bestätigt).
- "Nicht fällig" heißt: Wochentag nicht im Plan oder Tag vor `startDate`; Pause wird separat dargestellt (bestätigt).
