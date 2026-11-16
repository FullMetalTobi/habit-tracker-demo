# Insights card: strongest and weakest weekday

Issue: #2  ·  Status: approved

## Context
People who track several habits want to see patterns, for example that Monday keeps
falling apart. A new card on the Insights page names the weekday with the highest and
the lowest completion rate in the selected window. It uses the existing check-ins only.

## Research
| File | Why it matters |
| --- | --- |
| `app/utils/domain/stats.ts` | Pure, pause-aware analytics. The new function goes here (issue AC). |
| `app/utils/domain/date.ts` | `isHabitDueOnDate` (schedule, start date, archive, pauses), `dateKeyRange`, `weekdayFromDateKey`. |
| `app/utils/domain/weekdays.ts` | `WEEKDAY_LABELS`, `weekdayRank` for the display order of `weekStartsOn`. |
| `app/pages/app/insights.vue` | Window toggle (7 / 30 days / all time), `selectedWindowStart`, `today`; cards are `UCard` with icon header and `UEmpty` empty states. |
| `app/stores/settings.ts` | `weekStartsOn` getter. |
| `tests/stats.test.ts`, `tests/nuxt/insights-page.test.ts` | Unit and rendered tests for Insights. |
| `e2e/specs/insights.spec.ts`, `e2e/support/data.ts`, `e2e/support/fixtures.ts` | E2E pattern: `authedPage`, `seed`, today-relative builders `makeHabit` / `makeEntry` / `makeAppData`. |

ADRs: ADR-0010 (paused day = not due, no entry), ADR-0012 (pure logic in the Node
`unit` project), ADR-0014 (`domain/` utilities import only domain types and helpers),
ADR-0018 (read the reactive `todayKey`). No data change, so no new ADR.

Decisions (made by the author, no open questions left):
1. A habit-day counts when the habit was due (`isHabitDueOnDate`) **and** has a `done`
   or `missed` entry. `skipped` and still-open days (no entry yet, e.g. today) are left
   out, so they neither raise nor lower a rate.
2. Rate per weekday = done / (done + missed), rounded to whole percent.
3. "Enough data" = at least 2 weekdays with at least 2 counted habit-days each.
4. Ties are broken by more counted days, then by the display order of `weekStartsOn`.
5. If the best and the worst qualifying weekday have the same rate, the card says so
   instead of naming one day as both.
6. UI text in English like the rest of the app; the card is its own component.

## Requirements
### Must
- Pure function in `stats.ts` that returns the strongest and weakest weekday with rate,
  or a reason why there is not enough data.
- Card "Weekday rhythm" on `/app/insights` with both weekdays and their rates.
- The card follows the 7 days / 30 days / all time toggle.
- Empty state when there is too little data.
### Should
- Show how many check-ins the result is based on.
- Respect `weekStartsOn` for tie-breaking.
### Won't (this time)
- A full seven-day chart, per-habit breakdown, or time-of-day analysis.

## Non-goals
No change to the data schema, the stores, persistence or the existing cards.

## Tasks
1. `weekdayCompletionRates` and `weekdayExtremes` in `app/utils/domain/stats.ts`, tests in
   `tests/stats.test.ts`: due-only, skipped and open excluded, pauses, window bounds,
   thresholds, ties, even rates.
2. `app/components/InsightsWeekdayCard.vue` (props: `habits`, `entries`, `fromDate`,
   `toDate`, `weekStartsOn`), rendered tests in `tests/nuxt/insights-weekday-card.test.ts`.
3. Mount the card in `app/pages/app/insights.vue` with the page's window.
4. E2E `e2e/specs/insights-weekday.spec.ts` with today-relative seed data: result, window
   switch, empty state, reload.

## Acceptance criteria
- [ ] AC1: The card shows the strongest and the weakest weekday with their completion rate in percent.
- [ ] AC2: Only due days count; paused, skipped and still-open days do not change a rate.
- [ ] AC3: The card follows the selected window (7 days, 30 days, all time).
- [ ] AC4: With too little data the card shows an explanatory empty state, not numbers.
- [ ] AC5: If all qualifying weekdays have the same rate, the card says so.
- [ ] AC6: The calculation is a pure function in `app/utils/domain/stats.ts` with unit tests.

## Verification plan
| AC | How we prove it | Type (unit / e2e / browser) |
| --- | --- | --- |
| AC1 | `weekdayExtremes` picks best/worst; card renders labels + rates; seeded Mon weak / Wed strong | unit, nuxt, e2e |
| AC2 | Tests with skipped entries, pause ranges, off-schedule entries, open today | unit |
| AC3 | Seed where 7 days is empty but 30 days has a result; toggle buttons | e2e, browser |
| AC4 | No habits; one habit in 7 days | unit, nuxt, e2e |
| AC5 | All weekdays at 100% | unit, nuxt |
| AC6 | `tests/stats.test.ts` | unit |

Gates: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`.

Browser walk: `/login` → Settings → "Load demo data" → Insights. Read the "Weekday
rhythm" card at 7 days, then click "30 days" and "All time"; the values change with the
window. Reload, the card shows the same values. Then Settings → "Delete all data" →
Insights: the card shows the empty state. Check at 1280x800 and 390x844.
