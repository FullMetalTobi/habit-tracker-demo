# 25. Additive optional habit category field without a schema version bump

- **Status:** Accepted
- **Date:** 2026-11-17

## Context

With many habits there is no overview: habits cannot be grouped, and neither the Today view
nor the habit list can be filtered by topic (GitHub #1). Grouping needs a new persisted field
on `Habit`. ADR-0006 and ADR-0022 require that any schema change keeps old data and old
backups loading.

## Decision

Add an optional `category` to `Habit` (`app/types/app-data.ts`): one of the fixed keys
`health`, `learning`, `work`, or `null` for no category. There are no free-form or user-defined
categories and no category management page.

- **Additive, no version bump.** `HabitSchema` declares
  `z.enum(HABIT_CATEGORY_KEYS).nullable().default(null)`. Stored data, V1 payloads, legacy
  `localStorage` data and backups without the field parse to `category: null`. This follows the
  precedent of `settings.lastExportedAt`. `APP_DATA_SCHEMA_VERSION` stays `2`, there is no new
  migration step, and the Dexie store version and indexes are unchanged. `migrateToV2` only sets
  `category: null` to satisfy the output type.
- **Lenient import.** `LenientHabitImportSchema` uses `.catch(null)`, so an unknown value in a
  hand-edited habit list imports as `null`. The strict schema rejects unknown values.
- **Merge.** `habitsEqualIgnoringId` in `merge-app-data.ts` compares `category`, so two tabs
  that set different categories produce an `AppDataConflict` like any other field.
- **Filter state lives in the URL.** Today (`/app`) and the habit list (`/app/habits`) read
  `?category=<key>` through `useCategoryFilter()`. The state is not stored, so reloads and shared
  links keep the filter. Filter logic is pure and lives in `app/utils/domain/categories.ts`.
- **Honest empty states.** An unknown `?category=` value is not ignored: it behaves like an
  empty filter ("No habits in this category" plus "Reset filter"). A filtered queue never says
  "Everything due today has already been reviewed" while other categories are still open.

## Consequences

- **Pros:** old data and backups load unchanged; no migration risk; shareable filter links.
- **Trade-offs:** an older app version importing a newer export silently strips the unknown
  `category` field (Zod default object behavior), so categories are lost on a round trip through
  an older version. The fixed list needs a code change to extend; adding a key is itself an
  additive change, removing or renaming a key would need a new ADR.
- **Supersedes nothing.** Extends ADR-0006 and ADR-0022.

## References

- `app/types/app-data.ts`, `app/utils/persistence/storage-schema.ts`,
  `app/utils/persistence/merge-app-data.ts`, `app/utils/domain/categories.ts`,
  `app/composables/use-category-filter.ts`.
- Tests: `tests/habit-categories.test.ts`, `e2e/specs/habit-categories.spec.ts`.
