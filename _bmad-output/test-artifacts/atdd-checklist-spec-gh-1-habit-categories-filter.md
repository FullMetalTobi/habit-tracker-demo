---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04-generate-tests', 'step-04c-aggregate']
lastStep: 'step-04c-aggregate'
lastSaved: '2026-11-17'
storyId: 'gh-1'
storyKey: 'spec-gh-1-habit-categories-filter'
storyFile: '_bmad-output/implementation-artifacts/spec-gh-1-habit-categories-filter.md'
atddChecklistPath: '_bmad-output/test-artifacts/atdd-checklist-spec-gh-1-habit-categories-filter.md'
generatedTestFiles:
  - 'tests/habit-categories.test.ts'
  - 'e2e/specs/habit-categories.spec.ts'
inputDocuments:
  - '_bmad-output/implementation-artifacts/spec-gh-1-habit-categories-filter.md'
  - 'AGENTS.md'
  - 'playwright.config.ts'
  - 'vitest.config.ts'
  - 'e2e/support/data.ts'
  - 'e2e/support/fixtures.ts'
  - 'e2e/support/seed.ts'
acceptanceCriteria:
  - { id: 'AC-1', idSource: 'generated', text: 'Habit mit Kategorie bleibt nach Reload zugeordnet' }
  - { id: 'AC-2', idSource: 'generated', text: '/app?category=X frisch geöffnet: Filter aktiv' }
  - { id: 'AC-3', idSource: 'generated', text: 'Aktiver Filter ohne offene X-Habits, andere offen: kein „alles erledigt“' }
  - { id: 'AC-4', idSource: 'generated', text: 'Backup ohne Kategorien importierbar; bestehende IndexedDB-Daten laden unverändert' }
  - { id: 'AC-5', idSource: 'generated', text: 'lint + typecheck + test und test:e2e (Port 3110) grün' }
---

# ATDD-Checkliste: Kategorien für Habits mit Filter (GitHub #1)

## Kontext

- Stack: `frontend` (Nuxt 4 SPA), Runner: Vitest (`unit`, `nuxt`) und Playwright
- `@seontechnologies/playwright-utils` ist nicht installiert, daher Standard-Playwright-Muster mit den Projekt-Fixtures (`e2e/support/fixtures.ts`)
- Modus: AI-Generierung, sequenziell, keine Browser-Aufzeichnung (die UI existiert noch nicht)

## TDD-Rotphase (aktuell)

Rote Scaffolds, alle `skip`:

| AC | Level | Prio | Datei | Erste Assertion (muss rot starten) |
|----|-------|------|-------|-------------------------------------|
| AC-1 | E2E | P0 | `e2e/specs/habit-categories.spec.ts` | persistierter `category`-Key des Habits ist `'health'` |
| AC-2 | E2E | P0 | `e2e/specs/habit-categories.spec.ts` | Karte „Inbox zero“ (Kategorie work) fehlt bei `?category=health`, nachdem „Morning run“ sichtbar ist |
| AC-3 | E2E | P0 | `e2e/specs/habit-categories.spec.ts` | Button „Reset filter“ sichtbar, „Everything due today …“ fehlt |
| AC-4 | Unit | P0 | `tests/habit-categories.test.ts` | `category` eines Altdaten-Habits ist `null` |
| AC-5 | – | – | – | kein Scaffold (siehe unten) |

**AC-5 hat bewusst kein Scaffold.** Es ist ein Gate („Lint, Typecheck, Tests grün“) und kein Verhalten. Der Nachweis ist der Gate-Lauf selbst.

## Aktivierung pro Task

1. `.skip` des passenden Tests entfernen
2. Test laufen lassen und **rot** bestätigen
   - Unit: `npx vitest run --project unit tests/habit-categories.test.ts`
   - E2E: `PORT=3110 E2E_PORT=3110 npx playwright test e2e/specs/habit-categories.spec.ts` (nie Port 3000)
3. Implementieren, bis der Test **grün** ist
4. Assertions nie abschwächen oder löschen (AGENTS.md)
5. Zum Schluss alle Gates laufen lassen

Empfohlene Reihenfolge nach Spec-Tasks: AC-4 (Schema), AC-1 (Form), AC-2 (Filter), AC-3 (Leerzustand).

## Annahmen zur UI (beim Aktivieren prüfen)

- HabitForm hat ein beschriftetes Select **„Category“** mit Optionen Health / Learning / Work. Der Nuxt-UI-Select ist ein `combobox`-Button, die Optionen sind `option`-Rollen. Falls die Rollen abweichen, Locator anpassen, nicht die Assertion.
- Leerzustände bieten einen **Button** „Reset filter“ (laut Spec).
- Der Text „Everything due today has already been reviewed.“ stammt aus `app/pages/app/index.vue` (Open-Tab-Leerzustand).
- Der genaue englische Text von „Alle X-Habits sind erledigt“ ist in der Spec nicht festgelegt. AC-3 prüft deshalb den Reset-Button und die Abwesenheit des falschen Texts. Wenn der Text feststeht, eine Assertion dafür ergänzen.

## Sekundäre Fälle für die Grünphase (nicht als rote Leaves emittiert)

Aus der I/O-Matrix der Spec:

- Unit `app/utils/domain/categories.ts`: `filterByCategory`, Validierung, unbekannter Key, `null`/leer
- Unit `storage-schema`: unbekannter `category`-Wert im Lenient-Import wird `null`; strict-Schema lehnt ihn ab
- Unit `merge-app-data`: Kategorie-Konflikt zwischen zwei Tabs ergibt `AppDataConflict`
- Unit `habits-store`: `createHabit`/`updateHabit` setzen `category`, leer = `null`
- Nuxt `HabitForm`: Kategorie wählbar und leerbar
- E2E: unbekanntes `?category=foo` zeigt „No habits in this category“ + „Reset filter“
- E2E: Filter „nichts fällig“ zeigt „Keine Habits der Kategorie X heute fällig“ und nie „alles erledigt“
- E2E: Habit-Liste `/app/habits?category=…` und Page-Reset bei Filterwechsel
- E2E: „Reset filter“ entfernt `?category=` aus der URL
- Fixture `tests/fixtures/habit-tracker-6-weeks.json` bleibt ohne `category` (Altdaten-Test)
- Builder `makeHabit` in `e2e/support/data.ts` um `category` ergänzen. Danach kann `withCategory()` in der Spec entfallen.

## Hinweise für die Implementierung

- Schema: `HabitSchema` strict `z.enum(CATEGORY_KEYS).nullable().default(null)`, `LenientHabitImportSchema` mit `.catch(null)`, neues ADR 0025, kein `schemaVersion`-Bump
- UI: Filter nur in `route.query`, Logik rein in `app/utils/domain/categories.ts`
- Seiten: `app/pages/app/index.vue` (Leerzustände ~l.511 und ~l.606), `app/pages/app/habits/index.vue`

## Abweichung zu AGENTS.md

AGENTS.md verbietet, Tests zu überspringen, um ein Gate grün zu bekommen. Die ATDD-Scaffolds sind `skip`, weil der Workflow rote Scaffolds so vorsieht, und sie sind nicht abgeschwächt. Sie dürfen nicht dauerhaft übersprungen bleiben. Ein Test mit `.skip` nach Abschluss des zugehörigen Tasks ist ein Verstoß gegen die Regel.
