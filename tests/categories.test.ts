import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useHabitsStore } from '~/stores/habits'
import {
  APP_DATA_SCHEMA_VERSION,
  DEFAULT_SETTINGS,
  HABIT_CATEGORIES,
  type AppData,
  type Habit,
  type HabitCreateInput,
  type HabitUpdateInput,
} from '~/types/app-data'
import { extractImportedHabits, serializeBackup } from '~/utils/persistence/backup'
import { generateDemoData } from '~/utils/domain/demo-data-generator'
import { mergeAppData } from '~/utils/persistence/merge-app-data'
import { parseAppData, parseAppDataResult, parseLenientHabit } from '~/utils/persistence/storage-schema'

function rawHabit(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'h1',
    name: 'Read',
    type: 'build',
    identityStatement: 'Reader',
    scheduleWeekdays: [1],
    reminderTime: null,
    startDate: '2026-02-01',
    archived: false,
    pauses: [],
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
    ...overrides,
  }
}

function rawEnvelope(habits: Record<string, unknown>[], schemaVersion = 2): Record<string, unknown> {
  const withPauses = schemaVersion === 1
    ? habits.map(({ pauses: _pauses, ...rest }) => rest)
    : habits
  return {
    schemaVersion,
    habits: withPauses,
    entries: [],
    suggestions: [],
    settings: { ...DEFAULT_SETTINGS },
  }
}

function habit(overrides: Partial<Habit> = {}): Habit {
  return { ...(rawHabit() as unknown as Habit), category: 'other', ...overrides }
}

function appData(habits: Habit[]): AppData {
  return {
    schemaVersion: APP_DATA_SCHEMA_VERSION,
    habits,
    entries: [],
    suggestions: [],
    settings: { ...DEFAULT_SETTINGS },
  }
}

describe('habit category: schema and migration', () => {
  it('U0 exposes the fixed category set', () => {
    expect([...HABIT_CATEGORIES]).toEqual(['health', 'learning', 'work', 'other'])
  })

  it('U1 loads old V2 data without category as other, schemaVersion stays 2', () => {
    const result = parseAppDataResult(rawEnvelope([rawHabit()]))
    expect(result.status).toBe('ok')
    if (result.status === 'unrecoverable') throw new Error('unexpected')
    expect(result.data.schemaVersion).toBe(2)
    expect(result.data.habits[0]!.category).toBe('other')
  })

  it('U2 keeps a valid category', () => {
    const data = parseAppData(rawEnvelope([rawHabit({ category: 'health' })]))
    expect(data.habits[0]!.category).toBe('health')
  })

  it('U3 turns an unknown category into other without failing the load', () => {
    const result = parseAppDataResult(rawEnvelope([rawHabit({ category: 'sports' })]))
    expect(result.status).toBe('ok')
    if (result.status === 'unrecoverable') throw new Error('unexpected')
    expect(result.data.habits[0]!.category).toBe('other')
  })

  it('U4 migrates V1 data to V2 with category other', () => {
    const result = parseAppDataResult(rawEnvelope([rawHabit()], 1))
    expect(result.status).toBe('migrated')
    if (result.status === 'unrecoverable') throw new Error('unexpected')
    expect(result.data.schemaVersion).toBe(2)
    expect(result.data.habits[0]!.category).toBe('other')
  })

  it('U5 lenient import keeps valid categories and defaults the rest', () => {
    expect(parseLenientHabit(rawHabit({ category: 'work' }))?.category).toBe('work')
    expect(parseLenientHabit(rawHabit({ category: 42 }))?.category).toBe('other')
    expect(parseLenientHabit(rawHabit())?.category).toBe('other')
  })

  it('U6 habits-only import keeps valid categories', () => {
    const habits = extractImportedHabits([rawHabit({ category: 'learning' }), rawHabit({ id: 'h2', category: 'nope' })])
    expect(habits.map(h => h.category)).toEqual(['learning', 'other'])
  })

  it('U7 backup round trip keeps the category', () => {
    const data = appData([habit({ category: 'work' })])
    const parsed = parseAppData(JSON.parse(serializeBackup(data)))
    expect(parsed.habits[0]!.category).toBe('work')
  })

  it('U8 the V1 fixture loads with category other', () => {
    const parsed = parseAppData(JSON.parse(readFileSync('tests/fixtures/habit-tracker-6-weeks.json', 'utf8')))
    expect(parsed.habits.every(h => h.category === 'other')).toBe(true)
  })
})

describe('habit category: store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const input = (overrides: Partial<HabitCreateInput> = {}): HabitCreateInput => ({
    name: 'Run',
    type: 'build',
    identityStatement: 'I run.',
    scheduleWeekdays: [1],
    reminderTime: null,
    startDate: '2026-02-08',
    ...overrides,
  })

  it('U9a createHabit defaults to other and stores a given category', () => {
    const store = useHabitsStore()
    expect(store.createHabit(input()).category).toBe('other')
    expect(store.createHabit(input({ category: 'health' })).category).toBe('health')
  })

  it('U9b updateHabit changes the category and keeps it when omitted', () => {
    const store = useHabitsStore()
    const created = store.createHabit(input({ category: 'health' }))
    const update = (overrides: Partial<HabitUpdateInput>) =>
      store.updateHabit(created.id, { ...input(), archived: false, ...overrides })
    expect(update({ category: 'work' })!.category).toBe('work')
    expect(update({})!.category).toBe('work')
  })
})

describe('habit category: cross-tab merge, demo data', () => {
  it('U10 merge takes a one-sided category change', () => {
    const base = appData([habit()])
    const ours = appData([habit({ category: 'health' })])
    const result = mergeAppData(base, ours, structuredClone(base))
    expect(result.status).toBe('merged')
    if (result.status !== 'merged') throw new Error('unexpected')
    expect(result.data.habits[0]!.category).toBe('health')
  })

  it('U10b merge conflicts when both tabs set different categories', () => {
    const base = appData([habit()])
    const result = mergeAppData(base, appData([habit({ category: 'work' })]), appData([habit({ category: 'health' })]))
    expect(result.status).toBe('conflict')
  })

  it('U11 demo data uses at least two categories and never other-only', () => {
    const categories = new Set(generateDemoData(new Date(2026, 0, 15)).habits.map(h => h.category))
    expect(categories.size).toBeGreaterThanOrEqual(2)
    expect(categories.has('other')).toBe(false)
  })
})
