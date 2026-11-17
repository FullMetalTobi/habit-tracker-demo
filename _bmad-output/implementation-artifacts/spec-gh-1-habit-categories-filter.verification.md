# Verifikationsbericht: Kategorien für Habits mit Filter (GH-1)

- Spec: `_bmad-output/implementation-artifacts/spec-gh-1-habit-categories-filter.md`
- Datum: 2026-11-17
- Verifier: unabhängig; Anwendungscode und Tests wurden nicht verändert.

## Befehle

| Befehl | Exit-Code | Letzte Ausgabezeilen |
|---|---|---|
| `npx vitest run tests/habit-categories.test.ts && PORT=3110 E2E_PORT=3110 npx playwright test e2e/specs/habit-categories.spec.ts` | 0 | Vitest: `Tests 11 passed (11)`; Playwright: `16 passed (14.8s)`, 0 skipped (erwartet: grün, 0 skipped) |
| `npm run lint && npm run typecheck && npm test` | 0 | `Test Files 50 passed (50)`, `Tests 453 passed (453)` |
| `PORT=3110 E2E_PORT=3110 npm run test:e2e` | 0 | `1 skipped`, `123 passed (44.7s)`. Der eine Skip ist `mobile-pwa.spec.ts:26` (Bottom-Nav) im Desktop-Projekt (`test.skip` bei Viewport ≥ 768, schon vorher vorhanden, nicht Teil von GH-1). |

## Kriterien

| Kriterium | Nachweis | Status |
|---|---|---|
| AC-1: Habit mit Kategorie bleibt nach Reload erhalten | `e2e/specs/habit-categories.spec.ts` › „[P0] AC-1 a category assigned in the form survives a reload“, in chromium und mobile-chrome bestanden. | pass |
| AC-2: `/app?category=X` frisch geöffnet → Filter aktiv | e2e › „[P0] AC-2 a freshly opened /app?category=X link shows only that category“ (chromium + mobile-chrome) und „the filter survives a reload and filters the habit list“, bestanden. | pass |
| AC-3: Filter ohne offene X-Habits, andere offen → kein „alles erledigt“ | e2e › „[P0] AC-3 no "all done" message while other categories are still open“ (beide Projekte) und „a known category with nothing due shows its own message, not "all done"“, bestanden. | pass |
| AC-4: Backup ohne Kategorien importierbar, bestehende Daten laden unverändert | `tests/habit-categories.test.ts` › „AC-4 a backup without categories imports, and existing data loads with category null“ (prüft `extractImportedHabits` und `parseAppData`, jeweils `category: null`), plus „a V1 payload without category migrates with null and stays on schemaVersion 2“, bestanden (11/11). Ergänzend `settings.spec.ts` › „importing a V1 backup upgrades it …“ bestanden. | pass |
| AC-5: lint, typecheck, `npm test` und `npm run test:e2e` (Port 3110) grün | Befehle 2 und 3 haben Exit 0 (453 Unit-Tests, 123 e2e bestanden, 0 fehlgeschlagen). | pass |
| Matrix: unbekannte Kategorie → „No habits in this category“ + „Reset filter“ | e2e › „unknown ?category=foo shows the empty filter state and Reset filter clears the URL“ und „habit list shows the category empty state with a working Reset filter“ bestanden. Unit: „an unknown category matches nothing instead of being ignored“ bestanden. | pass |
| Matrix: Filter-Auswahl schreibt die URL | e2e › „picking a category in the filter select writes the URL, "All categories" clears it“ bestanden. | pass |
| Constraint: kein `schemaVersion`-Bump, `category` additiv, Unbekanntes → null im lenient Pfad | Unit „a V1 payload … stays on schemaVersion 2“, „keeps a known category through strict parse“, „lenient import turns an unknown category into null …“ bestanden. ADR `docs/adr/0025-additive-optional-habit-category-field.md` ist vorhanden. | pass |
| Matrix: Zusammenführen → `AppDataConflict` bei unterschiedlicher Kategorie | Nicht per Befehl der Spec nachgewiesen: `tests/merge-app-data.test.ts` ist in der Suite grün, ich habe aber keinen namentlich zugeordneten Test für `category` geprüft. | unverified |

## Hinweise

- Alle Tests im Bericht wurden in diesem Lauf als bestanden in der Befehlsausgabe bestätigt.
- Nicht geprüft: die Red-first-Reihenfolge (Test zuerst rot) ist aus dem Ergebnisstand nicht beweisbar.

## Verdict

Verdict: FAIL

Gründe:
- Alle drei Befehle liefern Exit 0 und alle fünf Acceptance Criteria sind `pass`.
- Die Matrix-Zeile „Zusammenführen: Zwei Tabs ändern Kategorie unterschiedlich → `AppDataConflict`“ hat keinen namentlich bestätigten Test und bleibt `unverified`. Nach der Verifikationsregel ist ein Verdict `PASS` damit nicht erlaubt.
