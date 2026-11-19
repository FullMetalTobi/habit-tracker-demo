# 26. Habit category as an additive defaulted field

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

Users want to group habits into categories and filter the Habits list and the Today queue by
them (specs/kategorien.md). That adds a field to `Habit`. ADR-0006 and ADR-0022 say a change of
the persisted shape bumps `schemaVersion` and gets a migration step. The field is purely
additive and has a safe default, so a bump would force every old backup through a migration for
no information gain. `lastExportedAt` in `SettingsSchema` is the precedent for a defaulted field
without a bump.

## Decision

- `Habit.category` is one of `health | learning | work | other` (`HABIT_CATEGORIES`). The set is
  fixed; there are no user-defined categories and no multiple categories per habit.
- "No category" is the value `other`, not `null`. The filter therefore has one value per state.
- The Zod schemas use `HabitCategorySchema` with `.catch('other')`: a missing or unknown value
  loads as `other` without a recovery banner. This applies to the strict schema, the lenient
  import schema and `migrateToV2`.
- `APP_DATA_SCHEMA_VERSION` stays `2`. This is a deliberate exception to ADR-0006 and ADR-0022,
  limited to additive fields that have a total default. Removing, renaming or re-typing a field
  still needs a bump and a migration.
- No Dexie store or index change; filtering happens in memory.
- `habitsEqualIgnoringId` (ADR-0024) compares `category`, so cross-tab edits are merged.
- The active filter lives only in the URL (`?category=`) and is not persisted. An invalid value
  means "all".

## Consequences

- Old data, V1 data and old backups load unchanged, with `other`.
- An older app version that opens newer data silently drops `category` on its next save (Zod
  strips unknown keys). Accepted for a local-first single-user app.
- Every new additive field needs a judgment call: default and no bump, or bump and migration.
  This ADR only covers the first case.
