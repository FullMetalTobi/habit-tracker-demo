# Verification: Habit categories with filter

Branch: seminar/kategorien @ 54a7b76  ·  Verdict: Pass

Scope: 8 commits ahead of `main`, 36 files (+1052 / -21).

## Gates
| Gate | Result | Duration |
| --- | --- | --- |
| `npm run lint` | green, no findings | 3 s |
| `npm run typecheck` | green, 0 errors | 7 s |
| `npm test` | green, 51 files, 459 tests passed | 13 s |

## Not verified
- **E2E suite** (`PORT=3110 E2E_PORT=3110 npm run test:e2e`) was not run in this
  verification. It last ran green during `/code` (115 passed, 1 skipped, chromium and
  mobile-chrome) at the code state before the docs-only commit `54a7b76`.
- **AC7 at runtime:** the cross-tab merge between two live tabs and the two AI prompts
  as shown on the settings page were only checked by unit tests (`tests/categories.test.ts`,
  `tests/ai-prompts.test.ts`), not driven in a browser.
- **AC8:** ADR-0026 and its index entry exist; the "Accepted" status is the author's
  call and was not reviewed by a human here.
- AC1 to AC6 were observed in a manual browser run (real UI, demo data, Settings import
  of old V1/V2 and habits-only files, 390x844 viewport). That run is described in the
  conversation, not in this file.
- Browser Back does not step through filter states (the filter uses `router.replace`).
  The spec does not require it.
