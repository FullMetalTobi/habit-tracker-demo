# Plan — Habit categories (create/edit, filter in Habits list and Today)

> Add a fixed category (Health, Learning, Work, Other) to every habit. It is chosen in `HabitForm`, shown as a badge, and used to filter the Habits list and the Today queue. Old data and backups default to "Other" and need no `schemaVersion` bump.

Issue: #1  ·  Status: approved

(Written by a planner agent and approved before implementation. Brainstorming record omitted; decisions are in the table below.)

Assumptions (no issue or comments available, decided by the planner):
- The app UI is English-only; no i18n module. New texts are plain English strings. German example names map to Health / Learning / Work / Other.
- The category list is **fixed, not user-defined**. Custom categories are out of scope.
- Each habit has exactly one category.

## 1. Overview

| # | Decision | Choice |
|---|---|---|
| 1 | Category set | Fixed const tuple `HABIT_CATEGORIES = ['health','learning','work','other']` in `app/types/app-data.ts`, with `HabitCategory` type and `DEFAULT_HABIT_CATEGORY = 'other'` |
| 2 | Field | `Habit.category: HabitCategory` (required on the type, always present after parsing) |
| 3 | Schema version | **No bump** (stays `schemaVersion: 2`). `HabitCategorySchema = z.enum(HABIT_CATEGORIES).catch('other')`. Missing or unknown values become `'other'` (precedent: issue #8 settings fields). |
| 4 | Migration | `migrateToV2` also sets `category: 'other'`. No new registry step. |
| 5 | ADR | One new ADR: "Habit category: additive defaulted field without schemaVersion bump" (exception to ADR-0006). |
| 6 | Store API | `HabitCreateInput.category?: HabitCategory` (defaults `'other'`). `updateHabit` keeps existing category when input omits it. New getter `habitsByCategory(category)`. |
| 7 | Form UI | `USelect` "Category" in a `UFormField`, after "Habit type". Default `'other'` on create. |
| 8 | Filter UI | `USelect` ("All categories" + 4 categories), `aria-label="Filter by category"`. In the Habits filter card next to "Show archived habits" and in the Today queue card header. |
| 9 | Filter state | Page-local state synced to the `?category=` query param (`all` = param omitted). Not persisted. Invalid param -> `all`. |
| 10 | Today filter scope | Applies to Open and Reviewed lists **and** progress counters. Streak strip and paused alert stay unfiltered. |
| 11 | Display | Category badge (icon + label, `neutral` `outline`) on Habit cards and Today queue cards. |
| 12 | Demo data | Each `HABIT_DEFS` entry gets a category. |
| 13 | Import and AI prompts | Lenient import schema gets `category` (`.catch('other')`). AI prompts list the field. |
| 14 | Cross-tab merge | `habitsEqualIgnoringId` compares `category`. |

## 2. Data model and persistence

### Types: `app/types/app-data.ts`
```ts
export const HABIT_CATEGORIES = ['health', 'learning', 'work', 'other'] as const
export type HabitCategory = (typeof HABIT_CATEGORIES)[number]
export const DEFAULT_HABIT_CATEGORY: HabitCategory = 'other'
// Habit: add `category: HabitCategory`
// HabitCreateInput: add `category?: HabitCategory`
```
Update the `AppDataV2` doc comment to mention the additive `category` field.

### Pure metadata: new `app/utils/domain/categories.ts`
- `HABIT_CATEGORY_META: Record<HabitCategory, { label, icon }>`: health "Health" `i-lucide-heart-pulse`; learning "Learning" `i-lucide-book-open`; work "Work" `i-lucide-briefcase`; other "Other" `i-lucide-tag`.
- `CategoryFilter = 'all' | HabitCategory`.
- `parseCategoryFilter(value: unknown): CategoryFilter` (known category -> itself, else `'all'`; handles arrays/undefined).
- `filterByCategory<T extends { category: HabitCategory }>(items, filter)`; `all` returns items unchanged.
- `categoryOptions` (4 items, form) and `categoryFilterOptions` (adds `{ label: 'All categories', value: 'all' }` first).

### Zod: `app/utils/persistence/storage-schema.ts`
- `HabitCategorySchema = z.enum(HABIT_CATEGORIES).catch(DEFAULT_HABIT_CATEGORY)`, shared by strict and lenient schemas.
- Add to `HabitSchema` via `.extend({ pauses, category: HabitCategorySchema })`; `HabitV1Schema` unchanged.
- Add to `LenientHabitImportSchema` (compile-time `AssertSameKeys` enforces sync).
- `migrateToV2`: `habits.map(h => ({ ...h, pauses: [], category: DEFAULT_HABIT_CATEGORY }))`.
- Check `satisfies z.ZodType<Habit>` still compiles.
- No `schemaVersion` / Dexie store version bump (filtering is in-memory).

### Other persistence touchpoints
- `merge-app-data.ts`: add `&& a.category === b.category` to `habitsEqualIgnoringId`; grep for other field-wise habit logic.
- `backup.ts`, `export-backup.ts`, `dexie-persistence-adapter.ts`: no change expected; verify nothing hand-builds a `Habit`.

## 3. Stores and logic
`app/stores/habits.ts`: `createHabit` -> `category: input.category ?? DEFAULT_HABIT_CATEGORY`; `updateHabit` -> `habit.category = input.category ?? habit.category`; getter `habitsByCategory`.

`demo-data-generator.ts`: add `category` to `HabitDef` and generated `Habit`:
Read 20 pages=learning; Morning run=health; No late-night snacks=health; No social media before 18:00=work; 10-minute meditation=health; Drink 8 glasses of water=health; Evening journal=learning.

`ai-prompts.ts`: add `- category: one of "health" | "learning" | "work" | "other" (default "other")` to both prompts and their JSON examples; add `category: habit.category` to the habit-export mapping (~line 75).

## 4. UI
### `HabitForm.vue`
Add `category` to `HabitFormPayload`, `state` (init `props.initial?.category ?? 'other'`), the form Zod schema (`z.enum(HABIT_CATEGORIES)`), and the emitted payload. `UFormField label="Category" name="category"` wrapping `<USelect v-model="state.category" :items="categoryOptions" value-key="value" class="w-full" data-testid="habit-category" />` (verify props against https://ui.nuxt.com/llms.txt raw docs).

### `app/pages/app/habits/new.vue` and `[id].vue`
Extend payload type, pass `category` to `createHabit`/`updateHabit`.

### `app/pages/app/habits/index.vue`
- `categoryFilter` synced with `route.query.category` (write via `router.replace({ query })`).
- `filteredHabits` also applies `filterByCategory`.
- Watcher resets `page` to 1 when category filter or `showArchived` changes.
- Filter `USelect` in the filter card.
- Category badge in each card's badge row (`data-testid="habit-category-badge"`).
- If filter yields 0 habits but habits exist: `UEmpty` "No habits in {Category}" with action "Show all categories". No habits at all: existing empty state.

### `app/pages/app/index.vue` (Today)
- `categoryFilter` wired like on habits page (`?category=`).
- Rename current `dueHabitModels` -> `allDueHabitModels` (unfiltered); `dueHabitModels` = filtered by `model.habit.category`. Counts/progress/open/reviewed derive from filtered list.
- Filter `USelect` in queue card header, only when `allDueHabitModels.length > 0`.
- Existing empty state condition becomes `!allDueHabitModels.length`; when all non-empty but filtered empty show `UEmpty` "No due habits in {Category}" + "Show all categories" action.
- Category badge under the identity statement on both card templates; don't touch fixed-width right-column badges.
- Filter persists across date navigation. Streak strip and paused alert unfiltered.

`ReflectionModal`, `review.vue`, `insights.vue` unchanged.

## 5. Dependencies
None.

## 6. Docs and ADR
- New ADR (implementer allocates number): "Habit category as an additive defaulted field (no schemaVersion bump)"; add to `docs/adr/README.md`.
- `docs/glossary.md` (Category), `docs/architecture.md` only if it lists Habit fields.

## 7. Test plan
Definition of done: `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build` green. e2e: `PORT=3108 E2E_PORT=3108 npm run test:e2e`; never port 3000.

### Automated
- U1 Old V2 payload without `category` -> `ok`, `'other'`.
- U2 Unknown value `'gaming'` -> `'other'`, not quarantined.
- U3 V1 payload migrates -> `migrated`, `pauses: []`, `category: 'other'`.
- U4 Valid category preserved.
- U5 Lenient import: with / without / bad category.
- U6 Backup round trip preserves categories.
- U7 Store create/update (default, explicit, update, omitted; snapshot contains category).
- U8 `habitsByCategory` getter.
- U9 `tests/categories.test.ts` for `parseCategoryFilter` / `filterByCategory`.
- U10 Merge detects category-only change.
- U11 Demo data: valid categories, >=2 distinct, accepted by `parseAppData`.
- U12 AI prompts mention and export `category`.
- U13 Existing fixtures (incl. `public/fixtures/habit-tracker-demo.json`) still parse.
- N1 `tests/nuxt/habit-form.test.ts`: default `'other'`, preselect `'work'`, payload contains `category`.
- E1 create with Learning -> badge; E2 edit to Health; E3 Habits list filter (new `e2e/specs/categories.spec.ts`, seed via `makeAppData`/`makeHabit`); E4 Today filter + counters; E5 persistence after reload.
- E2E support: `e2e/support/data.ts` (`makeHabit` default category), `e2e/support/pages/habit-form.ts` (`chooseCategory`), `e2e/support/pages/dashboard.ts` (filter helper). Fix any `Habit` literals (grep `pauses: \[\]` in `tests/` and `e2e/`).

### Manual QA (against http://localhost:3108/, clean profile, dummy login)
- Q1 Create form has Category select, default Other, options Health/Learning/Work/Other.
- Q2 Create "Run 5k" (Health) -> card badge Health.
- Q3 Create without touching Category -> Other.
- Q4 Edit to Work, reopen -> Work preselected, badge Work.
- Q5 List filter Learning -> only Learning, count matches, URL `?category=learning`.
- Q6 "All categories" resets, param gone.
- Q7 Archived Work habit hidden/visible with archived checkbox under Work filter.
- Q8 Empty category -> empty state with "Show all categories" which resets.
- Q9 >6 habits in one category, page 2, change filter -> page 1.
- Q10 Today filter Health -> Open/Reviewed and counters reflect only Health.
- Q11 Mark Done under filter -> moves to Reviewed, counters update, filter stays.
- Q12 Today filter on category with no due habits -> "No due habits in …", normal empty state NOT shown.
- Q13 Filter persists on previous day navigation.
- Q14 Deep link `/app/habits?category=work` + reload; `?category=bogus` -> all, no error.
- Q15 Category badge on Today cards, layout OK at 390px.
- Q16 Persistence after reload.
- Q17 Demo data has categories (Health, Learning, Work) and filters work.
- Q18 Import old backup without category -> all Other, no recovery banner.
- Q19 Backup export -> delete all -> import restores categories.
- Q20 Habits-only import with `work`, invalid, missing -> Work, Other, Other.
- Q21 Streak strip unfiltered while filter active.

## 8. Acceptance criteria
1. Create/edit forms have Category select (4 options, default Other), saved.
2. Existing data, V1, old backups, imports without `category` load and get `other`; `schemaVersion` stays 2.
3. Habits list and Today filterable by category with reset and sensible empty states.
4. Today progress counters reflect the filter.
5. Cards on both views show the category badge.
6. Demo data, import/export, AI prompts handle `category`.
7. ADR + docs updated; tests cover the above; lint, test, typecheck, build green.

## 9. Out of scope
User-defined/renamed/multiple categories; grouping/sorting/stats on Insights; filtering Review/Insights; persisting the filter; category-aware coaching; schemaVersion 3.
