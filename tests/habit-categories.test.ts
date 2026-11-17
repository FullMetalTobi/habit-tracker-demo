import { describe, expect, it } from 'vitest'
import { createEmptyAppData, parseAppData } from '~/utils/persistence/storage-schema'
import { extractImportedHabits } from '~/utils/persistence/backup'

// ATDD red-phase scaffold for GitHub #1, AC-4 (backward compatibility).
// Spec: _bmad-output/implementation-artifacts/spec-gh-1-habit-categories-filter.md
// Skipped until activated for the schema task: remove `.skip`, run RED, implement
// the additive `category` field (ADR-0025), run GREEN. Do not weaken it.
//
// AC-1..AC-3 are the E2E scaffolds in e2e/specs/habit-categories.spec.ts.

// A habit exactly as persisted/exported before categories existed: no `category` key.
const legacyHabit = {
  id: 'h-legacy',
  name: 'Read',
  type: 'build',
  identityStatement: 'I am a reader.',
  scheduleWeekdays: [1, 2, 3],
  reminderTime: '08:00',
  startDate: '2026-02-01',
  archived: false,
  pauses: [],
  createdAt: '2026-02-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
}

// `category` is not on `Habit` yet (red phase).
const categoryOf = (habit: unknown) => (habit as { category?: unknown }).category

describe('habit categories: old data and backups (GH-1 AC-4)', () => {
  it.skip('AC-4 a backup without categories imports, and existing data loads with category null', () => {
    // Criterion-defining assertion first: the exact newly promised scalar.
    const imported = extractImportedHabits({ habits: [legacyHabit] })
    expect(categoryOf(imported[0])).toBeNull()

    // Existing stored data (no migration, no schemaVersion bump) loads unchanged otherwise.
    const data = { ...createEmptyAppData(), habits: [legacyHabit] }
    const parsed = parseAppData(data)
    expect(categoryOf(parsed.habits[0])).toBeNull()
    expect(parsed.habits[0]).toMatchObject({ id: 'h-legacy', name: 'Read', type: 'build' })
  })
})
