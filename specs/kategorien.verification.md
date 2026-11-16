# Verification: Habit categories with filter

Branch: kurs/verify-rot @ 927aeae  ·  Verdict: Issues found

> Course branch. It builds on `stufe/08-verify-browser` and brings back the empty-state
> bug from the free prompt (`kurs/kategorien-prompt`) in one commit, `927aeae
> refactor(today): use one empty state on the Open tab`. This report is the result of a
> real `/verify specs/kategorien.md` run on that branch.

## Summary

AC5 is **not met**. With an active category filter and every habit of that category
reviewed, the Open tab on Today says "No open habits" and "Everything due today has
already been reviewed.", although habits of other categories are still open. The e2e
gate catches it (E4 red in both projects), the fresh reviewer flags it as blocking, and
the browser walk reproduces it. The fix goes back to `/code`; this skill does not fix.

## Acceptance criteria
| AC | Code + test | Browser | Result |
| --- | --- | --- | --- |
| AC1 select in create and edit, default Other, survives reload | `HabitForm.vue`, `new.vue`, `[id].vue`, `stores/habits.ts`; `habit-form.test.ts`, `categories.test.ts` U7, e2e E1, E2 (green) | not walked again; unchanged since `stufe/08-verify-browser` | met |
| AC2 badge on list and Today cards | `habits/index.vue`, `index.vue`; e2e E1 (green), E4 (red, but its badge assertion at `categories.spec.ts:121` passed before the failure) | walk 2: Learning badges on both Today cards | met |
| AC3 list filter in `?category=`, reload, shared link, reset, unknown value, page 1 | `use-category-filter.ts`, `habits/index.vue`; `categories.test.ts`; e2e E3, E3b (green) | walk 5: `/app/habits?category=other` shows "No habits in Other" | met |
| AC4 Today filter scopes lists and counter | `index.vue:135` (filtered `dueHabitModels`); e2e E4 up to `categories.spec.ts:133` (`0 of 2`, `1 of 2`, `2 of 2 reviewed`, strip "4 habits", paused alert) | walk 2-4: `0 of 2`, then `2 of 2 reviewed` under Learning, `2 of 7` without filter, strip "7 habits" | met |
| AC5 empty states name the category, Open tab does not claim everything is reviewed, reset | List and "No due habits in <Category>" are in place (`habits/index.vue`, `index.vue:543`). **The Open tab has only the unfiltered alert** (`index.vue:644-650`), no "No open habits in <Category>", no count of open habits in other categories, no "Show all categories". e2e E4 fails at `categories.spec.ts:134` | walk 3: wrong text under the Learning filter, also after reload and at 390 px | **not met** |
| AC6 old data, V1, unknown values, habits-only import | `storage-schema.ts`; `categories.test.ts` U1-U6, U13 (green) | n/a (unit) | met |
| AC7 cross-tab merge, demo data, AI prompts | `merge-app-data.ts`, `demo-data-generator.ts`, `ai-prompts.ts`; `categories.test.ts` U10-U12 (green) | demo data shows Health, Learning and Work | met |
| AC8 ADR-0026, tests for assignment, URL filter and reload | ADR file and index; tests above | n/a | met |

Must requirement "the Open tab must not pretend that everything is done when other
categories still have open habits" (spec Context and AC5): **not met**.

Scope creep: none in behavior. The branch differs from `stufe/08-verify-browser` only in
`app/pages/app/index.vue` (the removed filtered alert and `openHabitsInOtherCategories`).

## Gates
| Gate | Result | Duration |
| --- | --- | --- |
| `npm run lint` | green | 3 s |
| `npm run typecheck` | green | 5 s |
| `npm test` | green, 452 tests in 50 files | 8 s |
| `PORT=3110 E2E_PORT=3110 npm run test:e2e` | **red**: 2 failed, 115 passed, 1 skipped. Failed: `categories.spec.ts:105` E4 in `chromium` and `mobile-chrome` | 48 s |

E4 fails at `e2e/specs/categories.spec.ts:134`:

```
Locator: getByTestId('today-open-filtered-empty')
Expected substring: "No open habits in Health"
Error: element(s) not found
```

Lint, typecheck and the 452 unit tests stay green: no unit test renders the Open tab
under a filter. Only the e2e test written for AC5 catches the bug. The test is right and
stays as it is; it was not rerun and not changed. Because E4 stops at line 134, its later
steps (reload, the "Show all categories" button, "No due habits in Work") did not run in
e2e on this branch; the browser walk covers the Today ones.

## Review findings
The `reviewer` subagent got only the spec path and the branch and reviewed
`git diff main...kurs/verify-rot` (1 min). I checked every finding in the code.

### Blocking
- `app/pages/app/index.vue:644-650`: the Open tab's empty state ignores the filter. When
  `openHabits` is empty it always shows "No open habits" and "Everything due today has
  already been reviewed." There is no category variant, no "Show all categories" action
  and no `data-testid="today-open-filtered-empty"`. Breaks AC5. (Confirmed in the code and
  in the browser.)
- `e2e/specs/categories.spec.ts:134-143`: E4 expects `today-open-filtered-empty` and "1
  open habit is in other categories."; neither exists in `app/`. The e2e gate is red. Per
  the hard rules the fix is in the code, not in the test. (Same root cause as above.)

The reviewer also flagged the old report (Pass for `stufe/08-verify-browser`) as stale
for this branch. It held at review time; this report replaces it.

### Non-blocking
Unchanged from `stufe/08-verify-browser`, all still valid:
- `app/pages/app/habits/index.vue:30-31`: `.sort()` sorts the cached `visibleHabits`
  array in place when the filter is `all`.
- `docs/adr/0026-habit-category-additive-defaulted-field.md:34` calls a rollback "safe";
  an older build drops `category` on its next save.
- `e2e/specs/categories.spec.ts:57`: fixed 1.5 s wait before the reload in E2.
- `e2e/specs/categories.spec.ts:48`: E2 opens the legacy path `/habits/<id>`.
- `e2e/specs/categories.spec.ts:24-42`: AC1 reload is proven for an edited habit, not a
  new one.
- `app/utils/domain/categories.ts:34`: `categoryLabel` is exported but unused.
- `app/pages/app/index.vue:449`: "0 of 0 reviewed" with a filter that matches nothing.

## Browser walk
`PORT=3110 npm run dev`, `playwright-cli` in a fresh session, 1280x800. Gates ran before
the dev server started; browser and server were stopped afterwards.

1. `/login` → "Continue with demo login" → Settings → "Load demo data" (7 habits due
   today: Health, Learning, Work). `/app` shows "0 of 7 reviewed", strip "7 habits".
2. AC4: open `/app?category=learning`. Select says Learning, "0 of 2 reviewed", two cards
   "Read 20 pages" and "Evening journal" with badge Learning, strip still "7 habits".
3. AC5, **the bug**: "Done" on both cards. Counter "2 of 2 reviewed". The Open tab shows
   **"No open habits" / "Everything due today has already been reviewed."** There is no
   "No open habits in Learning", no hint at the open habits in other categories and no
   "Show all categories". `reload`: filter kept, same wrong text.
4. Cross-check: open `/app` without filter: "2 of 7 reviewed" and **5 open cards** with
   "Done" buttons. The claim in step 3 is false.
5. Other AC5 states are fine: `/app?category=other` shows "No due habits in Other" with
   "Show all categories"; `/app/habits?category=other` shows "No habits in Other" with
   "Show all categories".
6. 390x844, `/app?category=learning`: the same wrong text on the Open tab, bottom nav
   present, `scrollWidth` 390 = viewport.
7. Console: 0 errors, 0 warnings.

### Steps to reproduce
1. `git switch kurs/verify-rot && PORT=3110 npm run dev`, open `http://localhost:3110/login`,
   demo login, Settings → "Load demo data".
2. Open `http://localhost:3110/app?category=learning` and click "Done" on both cards.
3. Expected (AC5): "No open habits in Learning", "5 open habits are in other
   categories.", button "Show all categories". Actual: "Everything due today has already
   been reviewed."
4. Without the browser: `PORT=3110 E2E_PORT=3110 npx playwright test e2e/specs/categories.spec.ts -g E4`.

## Recommended fix (back to `/code`)
Run `/code specs/kategorien.md` with this report as input; task 6 of the spec (Today
filtered empty states, including the Open tab) is not done.

In `app/pages/app/index.vue`, before the unfiltered alert on the Open tab, add an alert
for `!openHabits.length && categoryFilter !== 'all'`:
- title "No open habits in <Category>" (`HABIT_CATEGORY_META[categoryFilter].label`),
- description with the open habits hidden by the filter (open in `allDueHabitModels`
  minus `openHabits`): "<n> open habit(s) is/are in other categories.", or "Every due
  habit in this category has been reviewed." when there are none,
- action "Show all categories" that sets the filter to `all`,
- `data-testid="today-open-filtered-empty"`.

Keep "Everything due today has already been reviewed." only for the unfiltered case. The
test E4 stays unchanged and must turn green; then run `/verify` again. A unit test in
`tests/nuxt/` that renders the Open tab under a filter would catch this before e2e.

## Not verified
- AC1 create and edit were not walked again in the browser; the code is unchanged since
  `stufe/08-verify-browser` and E1, E2 are green.
- The paused alert under a filter was not walked (no pause in the demo data); E4 checks it
  before it fails.
- The E4 steps after line 134 (reload with the filtered alert, its reset button, "No due
  habits in Work") did not run in e2e; steps 3 and 5 of the walk cover them in the browser.
