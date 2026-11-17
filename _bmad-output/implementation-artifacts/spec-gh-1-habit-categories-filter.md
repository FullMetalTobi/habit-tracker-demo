---
title: 'Kategorien für Habits mit Filter (GitHub #1)'
type: 'feature'
created: '2026-11-17'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/docs/adr/0006-zod-validated-versioned-data-schema.md'
  - '{project-root}/docs/adr/0022-version-keyed-schema-migration-registry.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Bei vielen Habits fehlt der Überblick: Habits lassen sich nicht gruppieren, und weder Today-Ansicht noch Habit-Liste können nach einem Thema gefiltert werden.

**Approach:** `Habit` bekommt ein optionales Feld `category`. HabitForm setzt es, Today (`/app`) und Habit-Liste (`/app/habits`) filtern über `?category=…` in der URL. Daten bleiben lokal (Dexie); das Feld ist additiv, kein `schemaVersion`-Bump.

## Boundaries & Constraints

**Always:** Per task, first write a failing test and run it red, then implement.
Schema-Änderung nur mit neuem ADR (0025); alte Daten und alte Backups müssen laden (ADR-0006, ADR-0022). Filterlogik rein in `app/utils/domain/` (kein Vue, kein Storage); Seiten lesen aus den Stores. UI-Texte Englisch. Ports: nie 3000 (`PORT=3110`). Kein Test darf abgeschwächt, übersprungen oder gelöscht werden.

**Decisions (human):** Feste Kategorienliste im Code: `health` (Health), `learning` (Learning), `work` (Work); gespeichert wird der Key, `null` = keine Kategorie. Keine freien Kategorien. Unbekannter `?category=`-Wert in der URL: wie leerer Filterzustand behandeln („No habits in this category“ + „Reset filter“), nicht still ignorieren.

**Never:** Kein `schemaVersion`-Bump, keine neue Migration, keine Dexie-Version/Index-Änderung. Kein Backend. Keine Kategorie-Verwaltungsseite, keine nutzerdefinierten Kategorien.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Zuordnen | Form: Kategorie gewählt, speichern, Reload | Habit trägt Kategorie weiter | N/A |
| Leer lassen | Form ohne Kategorie | `category: null` | N/A |
| Filter aktiv | `/app?category=X` (auch nach Reload / geteilter Link) | Nur fällige Habits der Kategorie X | N/A |
| Leer: nichts fällig | Filter X, keine Habits in X heute fällig | Hinweis „Keine Habits der Kategorie X heute fällig“ + Button „Reset filter“ | Kein „alles erledigt“ |
| Leer: nichts offen | Filter X, alle fälligen X-Habits erledigt, andere Kategorien noch offen | Open-Tab: „Alle X-Habits sind erledigt“ + Reset-Button; nie „Everything due today has been reviewed“ wenn global noch Habits offen sind | N/A |
| Unbekannte Kategorie | `/app?category=foo` | „No habits in this category“ + „Reset filter“ | Kein Fehler, kein Ignorieren |
| Alte Daten/Backups | Habit ohne `category` | Lädt als `category: null`, Backup-Import ok | Kein Quarantäne-Fall |
| Zusammenführen | Zwei Tabs ändern Kategorie unterschiedlich | Konflikt wie bei anderen Feldern (`merge-app-data`) | `AppDataConflict` |

</frozen-after-approval>

## Code Map

- `app/types/app-data.ts` -- `Habit`, `HabitCreateInput`; `category` ergänzen, `FIELD_LIMITS` ggf. erweitern
- `app/utils/persistence/storage-schema.ts` -- `HabitSchema` (strict, `z.enum(CATEGORY_KEYS).nullable().default(null)`), `LenientHabitImportSchema` (`.catch(null)` (unbekannter Wert → null); Key-Coverage-Typcheck erzwingt beides), `HabitV1Schema`/`migrateToV2` unverändert (Default greift per Parse)
- `app/utils/persistence/merge-app-data.ts` -- `habitsEqualIgnoringId` field-by-field: `category` ergänzen
- `app/stores/habits.ts` -- `createHabit`/`updateHabit` (Zeilen ~45–80) setzen `category`
- `app/components/HabitForm.vue` -- Auswahlfeld; `app/pages/app/habits/new.vue`, `[id].vue` reichen Input durch
- `app/pages/app/index.vue` -- `dueHabits` (~l.110), `openHabits`, Empty-States l.511 und l.606 („No open habits“ sagt heute „Everything due today …“)
- `app/pages/app/habits/index.vue` -- `filteredHabits` (l.20), `UEmpty` „No habits yet“, `page`-Reset bei Filterwechsel
- `app/utils/domain/` -- neue reine Datei (z. B. `categories.ts`): feste Kategorienliste (health/learning/work), Validierung, `filterByCategory`
- `app/utils/domain/demo-data-generator.ts`, `e2e/support/data.ts`, `tests/fixtures/*.json` -- Builder um `category` ergänzen (Fixture bleibt ohne = Altdaten-Test)
- `docs/adr/` + `README.md` -- neues ADR 0025; nicht ändern: ADR-0006/0010/0022
- `tests/habit-categories.test.ts`, `e2e/specs/habit-categories.spec.ts` -- ATDD-Scaffolds (TEA, `skip`) für AC-1 bis AC-4; Liste und Annahmen in `_bmad-output/test-artifacts/atdd-checklist-spec-gh-1-habit-categories-filter.md`

## Tasks & Acceptance

**Execution:**
- [ ] `tests/habit-categories.test.ts`, `e2e/specs/habit-categories.spec.ts` -- vor dem Code, den jeder Test abdeckt: `.skip` entfernen, Test laufen lassen und rot sehen; danach grün machen. Assertions nicht abschwächen -- ATDD (TEA)
- [ ] `tests/…` + `app/types/app-data.ts`, `storage-schema.ts` -- `category` additiv in strict + lenient Schema; Test: Altdaten/V1/Backup ohne Feld laden mit `null` -- Rückwärtskompatibilität
- [ ] `merge-app-data.ts`, `stores/habits.ts` -- Feld mergen/speichern -- Konsistenz
- [ ] `app/utils/domain/categories.ts` -- Filterlogik inkl. Unit-Tests der Matrix-Fälle
- [ ] `HabitForm.vue`, `new.vue`, `[id].vue` -- Kategorie wählbar/leerbar; Nuxt-Test
- [ ] `pages/app/index.vue`, `pages/app/habits/index.vue` -- URL-gebundener Filter, ehrliche Leerzustände mit Reset
- [ ] `e2e/specs/` -- Zuordnung überlebt Reload; Filter in URL überlebt Reload und Direktaufruf; Leerzustand + Reset
- [ ] `docs/adr/0025-…md`, `README.md`, `docs/architecture.md` -- ADR: additives optionales Feld ohne Versionsbump

**Acceptance Criteria:**
- Given ein Habit mit Kategorie, when die Seite neu geladen wird, then bleibt die Zuordnung erhalten.
- Given `/app?category=X`, when der Link frisch geöffnet wird, then ist der Filter aktiv.
- Given aktiver Filter ohne offene X-Habits, aber offene Habits anderer Kategorien, then steht dort kein „alles erledigt“.
- Given ein Backup ohne Kategorien, when importiert, then gelingt der Import; bestehende IndexedDB-Daten laden unverändert.
- Given `npm run lint && npm run typecheck && npm test` und `npm run test:e2e` (Port 3110), then grün.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Design Notes

Gewählt: additives Feld statt V3, Präzedenz `settings.lastExportedAt` (Zod `.default`, „ohne schemaVersion-Bump“). Ältere App-Versionen strippen das unbekannte Feld beim Import still (Zod-Standard) — im ADR dokumentieren. Filterzustand lebt nur in `route.query`, nicht im Store.

## Verification

**Commands:**
- `npx vitest run tests/habit-categories.test.ts && PORT=3110 E2E_PORT=3110 npx playwright test e2e/specs/habit-categories.spec.ts` -- expected: grün, 0 skipped
- `npm run lint && npm run typecheck && npm test` -- expected: grün
- `PORT=3110 E2E_PORT=3110 npm run test:e2e` -- expected: grün
