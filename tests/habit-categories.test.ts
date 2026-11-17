import { describe, expect, it } from 'vitest'
import {
  categoryLabel,
  filterByCategory,
  filterModelsByCategory,
  isCategoryKey,
  normalizeCategoryFilter,
} from '~/utils/domain/categories'
import { createEmptyAppData, parseAppData, parseLenientHabit } from '~/utils/persistence/storage-schema'
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
  it('AC-4 a backup without categories imports, and existing data loads with category null', () => {
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

describe('habit categories: schema', () => {
  it('keeps a known category through strict parse', () => {
    const data = { ...createEmptyAppData(), habits: [{ ...legacyHabit, category: 'work' }] }
    expect(parseAppData(data).habits[0]?.category).toBe('work')
  })

  it('rejects an unknown category in the strict schema', () => {
    const data = { ...createEmptyAppData(), habits: [{ ...legacyHabit, category: 'foo' }] }
    expect(() => parseAppData(data)).toThrow()
  })

  it('lenient import turns an unknown category into null and keeps a known one', () => {
    expect(parseLenientHabit({ ...legacyHabit, category: 'foo' })?.category).toBeNull()
    expect(parseLenientHabit({ ...legacyHabit, category: 'learning' })?.category).toBe('learning')
  })

  it('a V1 payload without category migrates with null and stays on schemaVersion 2', () => {
    const { pauses: _pauses, ...v1Habit } = legacyHabit
    const v1 = { ...createEmptyAppData(), schemaVersion: 1, habits: [v1Habit] }
    const parsed = parseAppData(v1)
    expect(parsed.schemaVersion).toBe(2)
    expect(parsed.habits[0]?.category).toBeNull()
  })
})

describe('habit categories: domain filter', () => {
  const habits = [
    { id: 'a', category: 'health' as const },
    { id: 'b', category: 'work' as const },
    { id: 'c', category: null },
  ]

  it('returns everything without a filter', () => {
    expect(filterByCategory(habits, null)).toHaveLength(3)
  })

  it('keeps only habits of the category', () => {
    expect(filterByCategory(habits, 'health').map(h => h.id)).toEqual(['a'])
  })

  it('an unknown category matches nothing instead of being ignored', () => {
    expect(filterByCategory(habits, 'foo')).toEqual([])
  })

  it('filters wrapper models by their habit', () => {
    expect(filterModelsByCategory(habits.map(habit => ({ habit })), 'work').map(m => m.habit.id)).toEqual(['b'])
  })

  it('normalizes raw query values', () => {
    expect(normalizeCategoryFilter(undefined)).toBeNull()
    expect(normalizeCategoryFilter('')).toBeNull()
    expect(normalizeCategoryFilter(['work', 'health'])).toBe('work')
    expect(normalizeCategoryFilter('foo')).toBe('foo')
  })

  it('validates keys and labels them', () => {
    expect(isCategoryKey('health')).toBe(true)
    expect(isCategoryKey('foo')).toBe(false)
    expect(categoryLabel('learning')).toBe('Learning')
    expect(categoryLabel(null)).toBe('')
  })
})
