# Verification: Insights card: strongest and weakest weekday

Branch: kurs/harness @ 9d46be2  ·  Verdict: Pass

## Acceptance criteria
| AC | Code + test | Browser | Result |
| --- | --- | --- | --- |
| AC1 strongest and weakest weekday with rate | `weekdayExtremes` in `app/utils/domain/stats.ts`, `app/components/InsightsWeekdayCard.vue`; `tests/stats.test.ts`, `tests/nuxt/insights-weekday-card.test.ts`, `e2e/specs/insights-weekday.spec.ts` | Demo data, 7 days: Friday 100%, Tuesday 67% | met |
| AC2 only due days; pauses, skipped, open days ignored | `weekdayCompletionRates` gates on `isHabitDueOnDate` and `done`/`missed`; unit test "ignores skipped days, open days, off-schedule entries and paused days" | Footnote on the card says so | met |
| AC3 follows 7 days / 30 days / all time | Props `fromDate`/`toDate`/`windowDays` from `insights.vue`; e2e toggles all three | 7 days: 33 check-ins, 30 days: 165 (Friday 100% / Tuesday 83%), all time: 887 (Friday 89% / Monday 82%) | met |
| AC4 empty state with too little data | `status: 'insufficient'` (fewer than 2 weekdays with 2+ check-ins); unit, nuxt and e2e tests | Before demo data: "Not enough check-ins yet" | met |
| AC5 no weekday stands out | `status: 'even'`; unit and nuxt tests | Not reachable with demo data | met (tests only) |
| AC6 pure function with unit tests | `tests/stats.test.ts`, 10 new cases | n/a | met |

No scope creep: the diff touches only the stats module, one new component, one line block in
`insights.vue`, and tests.

## Gates
| Gate | Result | Duration |
| --- | --- | --- |
| `npm run lint` | green | 3 s |
| `npm run typecheck` | green | 6 s |
| `npm test` | green, 448 tests | 8 s |
| `PORT=3110 E2E_PORT=3110 npm run test:e2e` | green, 111 passed, 1 skipped (mobile-only PWA test on desktop) | 44 s |

## Review findings
A fresh subagent reviewed `git diff` against the spec. Fixed in 9d46be2: the even state said
"tracked weekdays" although it counts only compared ones; the weakest-day tie-break had no test.

### Blocking
None.

### Non-blocking
- `stats.ts`: rates are compared after rounding, so 199/200 and 200/200 both read 100% and
  count as even. Intended (the card compares what the user sees), noted for a follow-up.
- The component keeps its own list of full weekday names; `weekdays.ts` only has short labels.
- No page-level Nuxt test checks that the card receives the page's window; the e2e test covers it.

## Not verified
- AC5 in the browser (no demo data produces equal rates on all weekdays).
- Dark mode only; light mode not checked. Desktop 1280x800 and mobile 390x844 checked, no
  horizontal scroll, no console errors.
