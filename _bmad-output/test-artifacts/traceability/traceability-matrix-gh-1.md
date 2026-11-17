---
stepsCompleted: ['step-01-load-context', 'step-02-discover-tests', 'step-03-map-criteria']
lastStep: 'step-03-map-criteria'
lastSaved: '2026-11-17'
coverageBasis: 'acceptance_criteria'
oracleResolutionMode: 'formal_requirements'
oracleConfidence: 'high'
oracleSources:
  - '_bmad-output/implementation-artifacts/spec-gh-1-habit-categories-filter.md'
externalPointerStatus: 'not_used'
scope: 'Phase 1 only (Traceability-Matrix), kein Gate'
---

# Traceability-Matrix: GH-1 Habit-Kategorien mit Filter

Oracle: 5 Acceptance Criteria + I/O-Matrix der Spec (Status `done`, Commit `b7e9c12`).
Phase 2 (Gate) wurde auftragsgemäß **nicht** ausgeführt.

## Ausführungsnachweis

| Suite | Ergebnis |
|---|---|
| `npx vitest run` (Unit + Nuxt) | **453/453 grün**, 50 Dateien (heute gelaufen) |
| Playwright e2e | **nicht ausgeführt** (Port belegt, Vorgabe). Die e2e-Zuordnung unten ist rein statisch (Code gelesen), Grün-Status stammt nur aus dem Review-Log der Spec. |

## Matrix pro Akzeptanzkriterium

| AC | Kriterium | Tests | Ebene | Status |
|---|---|---|---|---|
| AC-1 | Habit mit Kategorie bleibt nach Reload erhalten | e2e `[P0] AC-1 a category assigned in the form survives a reload` (`e2e/specs/habit-categories.spec.ts`; prüft IndexedDB-Key `health` und Select nach Reload). Ergänzend Unit: `habit-categories.test.ts` „keeps a known category through strict parse“; `habits-store.test.ts` (create default null / set / clear / omitted bleibt erhalten); `nuxt/habit-form.test.ts` (emit initial Kategorie, emit null, Feld gerendert) | e2e + Unit + Komponente | **Abgedeckt** (Reload-Beweis nur e2e, nicht ausgeführt) |
| AC-2 | `/app?category=X` frisch geöffnet: Filter aktiv | e2e `[P0] AC-2 a freshly opened /app?category=X link…` (Direktaufruf); `the filter survives a reload and filters the habit list` (Habit-Liste inkl. Reload, Badge „Work“); `picking a category in the filter select…` (Select schreibt/leert URL). Unit: `filterByCategory`, `filterModelsByCategory`, `normalizeCategoryFilter` | e2e + Unit | **Abgedeckt** (e2e nicht ausgeführt) |
| AC-3 | Filter ohne offene X-Habits, andere offen: kein „alles erledigt“ | e2e `[P0] AC-3 no "all done" message…` (asserted „All Health habits are done.“, „Reset filter“, Abwesenheit von „Everything due today…“). Verwandt: `a known category with nothing due…` | e2e | **Abgedeckt** (nur e2e, nicht ausgeführt; keine Unit/Komponenten-Ebene für die Leerzustands-Logik in `index.vue`) |
| AC-4 | Backup ohne Kategorien importiert; bestehende Daten laden | Unit `AC-4 a backup without categories imports…` (`extractImportedHabits` + `parseAppData` → `category: null`); „a V1 payload … migrates with null, schemaVersion 2“; „lenient import turns unknown into null“; „rejects unknown in strict schema“ | Unit | **Abgedeckt, ausgeführt grün** |
| AC-5 | lint + typecheck + `npm test` und e2e grün | `npm test` heute 453/453 grün. lint/typecheck heute nicht erneut gelaufen (laut Review-Log grün). e2e nicht gelaufen | Gate-Kriterium | **Teilweise belegt** (kein Test-Mapping; e2e offen) |

## I/O-Matrix der Spec

| Szenario | Test | Status |
|---|---|---|
| Zuordnen (Form, Reload) | AC-1 e2e, Form-Komponententests | Abgedeckt |
| Leer lassen → `null` | `habit-form` „emits null“, `habits-store` „defaulting to null“ | Abgedeckt (Unit grün) |
| Filter aktiv, Direktaufruf | AC-2 e2e | Abgedeckt (e2e offen) |
| Leer: nichts fällig | e2e `a known category with nothing due…` („No Learning habits due today“ + Reset) | Abgedeckt (e2e offen) |
| Leer: nichts offen | AC-3 e2e | Abgedeckt (e2e offen) |
| Unbekannte Kategorie | e2e `unknown ?category=foo…`, Habit-Liste-Variante; Unit „unknown matches nothing“ | Abgedeckt |
| Alte Daten/Backups | AC-4 Unit | Abgedeckt, grün |
| Zusammenführen (Konflikt) | `merge-app-data.test.ts` „conflicts when two tabs set a different category“ | Abgedeckt, grün |

## Coverage-Statistik (Akzeptanzkriterien AC-1…AC-4, AC-5 als Gate-Kriterium separat)

- AC mit mindestens einem Test: 4/4 (100 %), AC-5 teilweise
- Davon mit **ausgeführtem** grünem Nachweis: 1/4 (AC-4) vollständig; AC-1 nur teilweise (Unit-Anteil)
- Rein e2e-gestützt, heute unverifiziert: AC-2, AC-3 und der Reload-Teil von AC-1
- Prioritäten: AC-1…AC-3 als P0 im Test benannt, AC-4 Unit

## Lücken und Hinweise

1. **e2e unverifiziert**: Drei von vier ACs hängen für den Kernnachweis an e2e-Tests, die nicht gelaufen sind. Vor einer Gate-Entscheidung `PORT=3110 E2E_PORT=3110 npx playwright test e2e/specs/habit-categories.spec.ts` ausführen.
2. **Today-Text „have been reviewed“ unter Filter** (Variante bei komplett bearbeitetem Tag) ungetestet. Bereits als *defer* im Review-Log und in `deferred-work.md` geführt.
3. **Keine Komponenten-/Unit-Ebene für die Leerzustands-Verzweigungen** in `app/pages/app/index.vue` und `habits/index.vue`; AC-3 hat nur e2e (Single-Layer).
4. **Red-first-Nachweis** (Spec: „erst rot, dann grün“) ist aus dem Repo nicht prüfbar; kein Test-Mapping möglich.
5. Strikter Enum bei unbekanntem Key (Downgrade-Pfad) ist getestet („rejects unknown“), das Verhalten ist in ADR-0025 dokumentiert.
6. Der Pausen-Hinweis ignoriert den Filter bewusst (Review-Decision); kein Test, keine Lücke.
