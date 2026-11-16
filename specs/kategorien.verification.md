# Verification: Habit categories with filter

Branch: stufe/07-verify-review @ 4ed2aeb  ·  Verdict: Pass

## Acceptance criteria
| AC | Code + test | Result |
| --- | --- | --- |
| AC1 select in create and edit, default Other, survives reload | `HabitForm.vue:41,54,221`, `new.vue`, `[id].vue`, `stores/habits.ts:62,84`; `habit-form.test.ts` "defaults to other, preselects …", `categories.test.ts` U7 and "exposes four form options", e2e E1, E2/E5 | met |
| AC2 badge on list and Today cards | `habits/index.vue:200`, `index.vue:599,695`; e2e E1 (list), E4 (Today) | met |
| AC3 list filter in `?category=`, reload, shared link, reset, unknown value, page 1 | `use-category-filter.ts`, `habits/index.vue:30,61`; `categories.test.ts` `parseCategoryFilter`, `filterByCategory`; e2e E3 (URL, reload, reset, `?category=work`, `?category=bogus`), E3b (page 1) | met |
| AC4 Today filter scopes lists and counter, strip and paused alert unfiltered | `index.vue:136` (filtered `dueHabitModels`), `:122` and `:165` unfiltered; e2e E4 (`0 of 2 reviewed`, `4 habits`, `1 habit is paused today` under Health and Work, filter kept after reload) | met |
| AC5 empty states name the category and reset | `habits/index.vue:145`, `index.vue:549` and `:659` (Open tab counts open habits in other categories); e2e E3 ("No habits in Other"), E4 ("No open habits in Health", "1 open habit is in other categories.", no "Everything due today …", "No due habits in Work", both resets) | met |
| AC6 old data, V1, unknown values, habits-only import | `storage-schema.ts:68,72,114,211`; `categories.test.ts` U1 (status `ok`, no quarantine), U2, U3, U4, U5, U5b, U6, U13 | met |
| AC7 cross-tab merge, demo data, AI prompts | `merge-app-data.ts:82`, `demo-data-generator.ts`, `ai-prompts.ts:31,55,78,110`; `categories.test.ts` U10, U11, U12 | met |
| AC8 ADR-0026, tests for assignment, URL filter and reload | `docs/adr/0026-habit-category-additive-defaulted-field.md`, index in `docs/adr/README.md`; tests above | met |

All Must requirements are covered by AC1 to AC7. The Should items are in: page reset
(E3b) and `habitsByCategory` (U8).

Scope creep: none in behavior. `categories.ts` exports `categoryLabel`, which nothing uses
yet. Outside the feature the diff carries the course material (`.claude/skills/`,
`AGENTS.md`, `KURS.md`, `specs/`).

## Gates
| Gate | Result | Duration |
| --- | --- | --- |
| `npm run lint` | green | 3 s |
| `npm run typecheck` | green | 5 s |
| `npm test` | green, 452 tests in 50 files | 8 s |
| `PORT=3110 E2E_PORT=3110 npm run test:e2e` | green, 117 passed, 1 skipped (mobile-only bottom-nav test in the desktop project); `categories.spec.ts` 5 tests x 2 projects | 46 s |

## Review findings
The `reviewer` subagent got only the spec path and the branch and reviewed
`git diff main...HEAD` (2.5 min). I checked every finding in the code; all of them hold.

### Blocking
None.

### Non-blocking
- `docs/adr/0026-habit-category-additive-defaulted-field.md:34` calls a rollback "safe".
  An older build or a stale PWA tab strips `category` on load and its next save writes
  the habits without it, so all categories fall back to Other. The ADR should name that
  data loss.
- `app/pages/app/habits/index.vue:29-31`: with the filter on `all`, `filterByCategory`
  returns its input, so `.sort()` sorts the cached `visibleHabits` array in place.
  Harmless today (nothing else reads it), but a side effect inside a computed.
- `e2e/specs/categories.spec.ts:48`: E2 opens the legacy path `/habits/<id>`, which the
  auth middleware maps to `/app/habits/<id>`. The list's own Edit button uses the same
  path, so it mirrors the app, but E2 also depends on that mapping.
- `e2e/specs/categories.spec.ts:57`: E2 waits a fixed 1.5 s for the debounced save before
  the reload; E4 polls the persisted store instead. The fixed wait can flake on slow CI.
- `app/utils/domain/categories.ts:34`: `categoryLabel` is exported but unused.
- AC1 reload is proven for an edited habit (E2), not for a newly created one (E1).

## Not verified
- No browser check; the user-facing criteria are proven by e2e tests only.
- AC6 "without a recovery banner" is proven by the parse status `ok` (U1, U2), not in the UI.
