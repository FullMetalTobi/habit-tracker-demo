---
name: schema-change
description: Checklist for any change to the persisted data shape (Habit, HabitEntry, CoachingSuggestion, AppSettings or the AppData envelope). Use before and while you add, rename or remove a stored field, so validation, migration, merge, demo data, old backups and tests stay in sync.
---

# Schema change

Persisted data is validated on every load and import (ADR-0006). A field that is
missing in one of the places below gets silently dropped, breaks old backups or
reverts edits from another tab. Work through the list in order.

## 0. Decide: additive field or new schema version

- **Additive with a safe default** (an optional field old data can omit): give it a
  Zod `.default(...)` and keep `APP_DATA_SCHEMA_VERSION`. Precedent:
  `lastExportedAt` / `backupNudgeSnoozedUntil` in `SettingsSchema`, `Habit.category`
  (ADR-0026).
- **Structural** (a required field, a rename, a changed meaning): bump
  `APP_DATA_SCHEMA_VERSION` and add a migration step (ADR-0010 did this for
  `pauses`, ADR-0022 describes the registry).
- Either way, write a new ADR (next free number in `docs/adr/`, add it to
  `docs/adr/README.md`). Never edit an accepted one.

## 1. Type

- `app/types/app-data.ts`: the interface, `HabitCreateInput`/`HabitUpdateInput`
  if users edit the field, `DEFAULT_SETTINGS`, and `FIELD_LIMITS` or
  `COLLECTION_LIMITS` for every new string or array.
- On a version bump: add `AppDataV3`, point `AppData` at it, bump the constant.

## 2. Zod schema

`app/utils/persistence/storage-schema.ts`:

- The strict schema (`HabitSchema`, `HabitEntrySchema`, `SettingsSchema`, ...)
  with the limits from step 1.
- `LenientHabitImportSchema` for habit fields, with a `.catch()` default. The
  `AssertSameKeys` anchor fails `npm run typecheck` until you do this.
- `createEmptyAppData()` if the envelope changes.

## 3. Migration (only on a version bump)

- Keep the old schema as migration input (like `HabitV1Schema`), write a pure,
  idempotent `migrateToVn()`, and register a step in `SCHEMA_MIGRATIONS` that
  advances exactly one version. `assertMigrationRegistryInvariants` checks the chain.
- The engine lives in `app/utils/persistence/schema-migrations.ts`; do not change it.
- No Dexie store bump unless you add an index
  (`app/utils/persistence/dexie-persistence-adapter.ts`). If you do, mirror it in
  `e2e/support/seed.ts`.

## 4. Merge and tab sync

`app/utils/persistence/merge-app-data.ts` compares field by field
(`habitsEqualIgnoringId`, `entriesEqualIgnoringId`, `mergeSettings`). Add the new
field there, or a change to it in one tab is lost when another tab saves (ADR-0024).

## 5. Writers and demo data

- Stores that create records: `app/stores/habits.ts`, `app/stores/entries.ts`,
  `app/stores/settings.ts`.
- `app/utils/domain/demo-data-generator.ts` and `public/fixtures/habit-tracker-demo.json`.
- Test builders: `e2e/support/data.ts` (`makeHabit`, `makeEntry`, `makeAppData`).

## 6. Old data and backups

- A backup from the current and from every older version must still import, both
  as full import and as habits-only import (`app/utils/persistence/backup.ts`).
- Legacy `localStorage` data goes through the same parse path
  (`app/utils/persistence/legacy-migration.ts`).

## 7. Tests

| What | Where |
| --- | --- |
| Strict and lenient schema, defaults, limits | `tests/storage-schema.test.ts` |
| Migration chain and the new step | `tests/schema-migrations.test.ts`, `tests/pause-mode.test.ts` (V1 → V2 as a template) |
| Merge of the new field | `tests/merge-app-data.test.ts` |
| Backup import of old versions | `tests/backup.test.ts`, `e2e/specs/settings.spec.ts` |
| Fixture still parses | `tests/fixture-data.test.ts`, `tests/demo-data-generator.test.ts` |

Fast loop: `npx vitest run --project unit storage-schema schema-migrations merge-app-data backup pause-mode`.
Then all gates: `npm run lint`, `npm run typecheck`, `npm test`,
`PORT=3110 E2E_PORT=3110 npm run test:e2e` (never port 3000).
