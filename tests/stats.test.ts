import { describe, expect, it } from 'vitest'
import {
  coachUptake,
  completionRateForHabit,
  dailyCompletionRate,
  overallCompletionRate,
  reasonDistribution,
  streakForHabit,
  weekdayCompletionRates,
  weekdayExtremes,
} from '~/utils/domain/stats'
import type { CoachingSuggestion, Habit, HabitEntry } from '~/types/app-data'

function buildHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit_1',
    name: 'Morning run',
    type: 'build',
    identityStatement: 'I am a runner.',
    scheduleWeekdays: [0, 1, 2, 3, 4, 5, 6],
    reminderTime: null,
    startDate: '2026-01-01',
    archived: false,
    pauses: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function buildEntry(overrides: Partial<HabitEntry> = {}): HabitEntry {
  return {
    id: 'entry_1',
    habitId: 'habit_1',
    date: '2026-02-08',
    status: 'done',
    completedAt: '2026-02-08T10:00:00.000Z',
    missReasonCode: null,
    missReasonNote: null,
    ...overrides,
  }
}

function buildSuggestion(overrides: Partial<CoachingSuggestion> = {}): CoachingSuggestion {
  return {
    id: 'sug_1',
    entryId: 'entry_1',
    law: 'obvious',
    direction: 'increase',
    title: 'Make it obvious',
    action: 'Set out your shoes.',
    rationale: 'Cue the behavior.',
    createdAt: '2026-02-08T00:00:00.000Z',
    ...overrides,
  }
}

describe('stats — streakForHabit', () => {
  it('returns 0 for a habit with no entries', () => {
    expect(streakForHabit([], 'habit_1')).toBe(0)
  })

  it('returns 0 when the habit has no done entries', () => {
    const entries = [
      buildEntry({ id: 'e1', date: '2026-02-06', status: 'missed', completedAt: null }),
      buildEntry({ id: 'e2', date: '2026-02-07', status: 'skipped', completedAt: null }),
    ]

    expect(streakForHabit(entries, 'habit_1')).toBe(0)
  })

  it('counts consecutive trailing done entries as the streak', () => {
    const entries = [
      buildEntry({ id: 'e1', date: '2026-02-06', status: 'done' }),
      buildEntry({ id: 'e2', date: '2026-02-07', status: 'done' }),
      buildEntry({ id: 'e3', date: '2026-02-08', status: 'done' }),
    ]

    expect(streakForHabit(entries, 'habit_1')).toBe(3)
  })

  // CHARACTERIZATION: trailing non-done entries are skipped before counting
  // begins, so they do not reset a run built earlier — done,done,missed,missed
  // reports 2, not 0 (relocated from entries-store.test.ts).
  it('trailing misses do not reset the streak — done,done,missed,missed reports 2', () => {
    const entries = [
      buildEntry({ id: 'e1', date: '2026-02-05', status: 'done' }),
      buildEntry({ id: 'e2', date: '2026-02-06', status: 'done' }),
      buildEntry({ id: 'e3', date: '2026-02-07', status: 'missed', completedAt: null }),
      buildEntry({ id: 'e4', date: '2026-02-08', status: 'missed', completedAt: null }),
    ]

    expect(streakForHabit(entries, 'habit_1')).toBe(2)
  })

  it('a miss between done entries breaks the earlier run — done,missed,done reports 1', () => {
    const entries = [
      buildEntry({ id: 'e1', date: '2026-02-06', status: 'done' }),
      buildEntry({ id: 'e2', date: '2026-02-07', status: 'missed', completedAt: null }),
      buildEntry({ id: 'e3', date: '2026-02-08', status: 'done' }),
    ]

    expect(streakForHabit(entries, 'habit_1')).toBe(1)
  })

  it('a skipped entry between done entries breaks the streak', () => {
    const entries = [
      buildEntry({ id: 'e1', date: '2026-02-06', status: 'done' }),
      buildEntry({ id: 'e2', date: '2026-02-07', status: 'skipped', completedAt: null }),
      buildEntry({ id: 'e3', date: '2026-02-08', status: 'done' }),
    ]

    expect(streakForHabit(entries, 'habit_1')).toBe(1)
  })

  it('sorts by date before counting, so input order does not matter', () => {
    const entries = [
      buildEntry({ id: 'e3', date: '2026-02-08', status: 'done' }),
      buildEntry({ id: 'e1', date: '2026-02-06', status: 'done' }),
      buildEntry({ id: 'e2', date: '2026-02-07', status: 'done' }),
    ]

    expect(streakForHabit(entries, 'habit_1')).toBe(3)
  })

  it('ignores entries belonging to other habits', () => {
    const entries = [
      buildEntry({ id: 'e1', habitId: 'habit_2', date: '2026-02-08', status: 'done' }),
    ]

    expect(streakForHabit(entries, 'habit_1')).toBe(0)
  })
})

describe('stats — completionRateForHabit', () => {
  it('returns 0 when there are no due dates in the window', () => {
    // Habit is only due on Saturdays (weekday 6); the window is Mon–Fri.
    const habit = buildHabit({ scheduleWeekdays: [6] })

    expect(completionRateForHabit(habit, [], '2026-02-09', '2026-02-13')).toBe(0)
  })

  it('returns Math.round percentage for done entries over due dates', () => {
    // 2 of 3 due days done → 66.67 → 67.
    const habit = buildHabit({ startDate: '2026-02-09' })
    const entries = [
      buildEntry({ id: 'e1', date: '2026-02-09', status: 'done' }),
      buildEntry({ id: 'e2', date: '2026-02-10', status: 'done' }),
      buildEntry({ id: 'e3', date: '2026-02-11', status: 'missed', completedAt: null }),
    ]

    expect(completionRateForHabit(habit, entries, '2026-02-09', '2026-02-11')).toBe(67)
  })

  it('returns 100 when all due entries are done', () => {
    const habit = buildHabit({ startDate: '2026-02-09' })
    const entries = [
      buildEntry({ id: 'e1', date: '2026-02-09', status: 'done' }),
      buildEntry({ id: 'e2', date: '2026-02-10', status: 'done' }),
    ]

    expect(completionRateForHabit(habit, entries, '2026-02-09', '2026-02-10')).toBe(100)
  })

  it('returns 0 when no entries are done', () => {
    const habit = buildHabit({ startDate: '2026-02-09' })
    const entries = [
      buildEntry({ id: 'e1', date: '2026-02-09', status: 'missed', completedAt: null }),
      buildEntry({ id: 'e2', date: '2026-02-10', status: 'skipped', completedAt: null }),
    ]

    expect(completionRateForHabit(habit, entries, '2026-02-09', '2026-02-10')).toBe(0)
  })

  it('excludes paused days from the denominator (relocated from pause-mode)', () => {
    // 2026-03-01..2026-03-06 = 6 scheduled days; 3 are paused → 3 due days.
    const habit = buildHabit({
      startDate: '2026-03-01',
      pauses: [{ start: '2026-03-03', end: '2026-03-05' }],
    })
    const entries = [
      buildEntry({ id: 'a', date: '2026-03-01', status: 'done' }),
      buildEntry({ id: 'b', date: '2026-03-02', status: 'done' }),
      buildEntry({ id: 'c', date: '2026-03-06', status: 'missed', completedAt: null }),
    ]

    // 2 done out of 3 due days = 67%.
    expect(completionRateForHabit(habit, entries, '2026-03-01', '2026-03-06')).toBe(67)
  })
})

describe('stats — overallCompletionRate', () => {
  it('averages done over all due habit-days in the window', () => {
    // One daily habit over a two-day window → 2 due habit-days; 1 done → 50%.
    const habit = buildHabit({ startDate: '2026-02-09' })
    const entries = [
      buildEntry({ id: 'e1', date: '2026-02-09', status: 'done' }),
      buildEntry({ id: 'e2', date: '2026-02-10', status: 'missed', completedAt: null }),
    ]

    expect(overallCompletionRate([habit], entries, '2026-02-09', '2026-02-10')).toBe(50)
  })

  it('returns 0 when nothing is due', () => {
    const habit = buildHabit({ scheduleWeekdays: [6] })

    expect(overallCompletionRate([habit], [], '2026-02-09', '2026-02-13')).toBe(0)
  })
})

describe('stats — dailyCompletionRate', () => {
  it('reports the done share of habits due on a single date', () => {
    const habits = [
      buildHabit({ id: 'habit_1' }),
      buildHabit({ id: 'habit_2', name: 'Meditate' }),
    ]
    const entries = [
      buildEntry({ id: 'e1', habitId: 'habit_1', date: '2026-02-09', status: 'done' }),
      buildEntry({ id: 'e2', habitId: 'habit_2', date: '2026-02-09', status: 'missed', completedAt: null }),
    ]

    expect(dailyCompletionRate(habits, entries, '2026-02-09')).toBe(50)
  })

  it('returns 0 when nothing is due on the date', () => {
    const habit = buildHabit({ startDate: '2026-03-01' })

    expect(dailyCompletionRate([habit], [], '2026-02-09')).toBe(0)
  })
})

describe('stats — reasonDistribution', () => {
  it('filters by window, sorts desc, computes percent, and skips nulls', () => {
    const entries = [
      // In window, with reasons.
      buildEntry({ id: 'e1', date: '2026-02-06', status: 'missed', completedAt: null, missReasonCode: 'forgot' }),
      buildEntry({ id: 'e2', date: '2026-02-07', status: 'missed', completedAt: null, missReasonCode: 'no_time' }),
      buildEntry({ id: 'e3', date: '2026-02-08', status: 'missed', completedAt: null, missReasonCode: 'forgot' }),
      // In window but no reason → skipped.
      buildEntry({ id: 'e4', date: '2026-02-08', habitId: 'habit_2', status: 'missed', completedAt: null, missReasonCode: null }),
      // Reason but before the window → excluded.
      buildEntry({ id: 'e5', date: '2026-02-01', status: 'missed', completedAt: null, missReasonCode: 'no_time' }),
      // Reason but after the window → excluded.
      buildEntry({ id: 'e6', date: '2026-02-20', status: 'missed', completedAt: null, missReasonCode: 'too_hard' }),
    ]

    const result = reasonDistribution(entries, '2026-02-06', '2026-02-08')

    expect(result).toEqual([
      { code: 'forgot', count: 2, percent: 67 },
      { code: 'no_time', count: 1, percent: 33 },
    ])
  })

  it('counts across all entries when no window is given', () => {
    const entries = [
      buildEntry({ id: 'e1', date: '2026-02-01', status: 'missed', completedAt: null, missReasonCode: 'forgot' }),
      buildEntry({ id: 'e2', date: '2026-02-20', status: 'missed', completedAt: null, missReasonCode: 'forgot' }),
    ]

    expect(reasonDistribution(entries)).toEqual([{ code: 'forgot', count: 2, percent: 100 }])
  })

  it('returns an empty array when no missed reasons are present', () => {
    const entries = [
      buildEntry({ id: 'e1', date: '2026-02-08', status: 'done' }),
      buildEntry({ id: 'e2', date: '2026-02-09', status: 'missed', completedAt: null, missReasonCode: null }),
    ]

    expect(reasonDistribution(entries, '2026-02-01', '2026-02-28')).toEqual([])
  })
})

describe('stats — coachUptake', () => {
  it('returns 0 when no suggestion maps to an in-window entry', () => {
    const suggestions = [buildSuggestion({ id: 's1', entryId: 'missing' })]

    expect(coachUptake(suggestions, [], '2026-02-01', '2026-02-20', null)).toBe(0)
  })

  it('reports the improved share over the observation window (windowDays = null)', () => {
    const entries = [
      // habit_1 missed then completed the next day → improved.
      buildEntry({ id: 'm1', habitId: 'habit_1', date: '2026-02-05', status: 'missed', completedAt: null, missReasonCode: 'forgot' }),
      buildEntry({ id: 'f1', habitId: 'habit_1', date: '2026-02-06', status: 'done' }),
      // habit_2 missed with no later completion → observable but not improved.
      buildEntry({ id: 'm2', habitId: 'habit_2', date: '2026-02-10', status: 'missed', completedAt: null, missReasonCode: 'no_time' }),
    ]
    const suggestions = [
      buildSuggestion({ id: 's1', entryId: 'm1' }),
      buildSuggestion({ id: 's2', entryId: 'm2' }),
    ]

    // 2 observable, 1 improved → 50%.
    expect(coachUptake(suggestions, entries, '2026-02-01', '2026-02-20', null)).toBe(50)
  })

  it('clamps the observation window to windowDays and returns 100 when all improve', () => {
    const entries = [
      buildEntry({ id: 'm1', habitId: 'habit_1', date: '2026-02-05', status: 'missed', completedAt: null, missReasonCode: 'forgot' }),
      buildEntry({ id: 'f1', habitId: 'habit_1', date: '2026-02-07', status: 'done' }),
    ]
    const suggestions = [buildSuggestion({ id: 's1', entryId: 'm1' })]

    // Observation window 2026-02-06..2026-02-12 (miss+1 .. miss+7) contains the done.
    expect(coachUptake(suggestions, entries, '2026-02-01', '2026-02-20', 7)).toBe(100)
  })

  it('returns 0 when the only suggestion is unobservable (miss on toDate)', () => {
    const entries = [
      buildEntry({ id: 'm1', habitId: 'habit_1', date: '2026-02-20', status: 'missed', completedAt: null, missReasonCode: 'forgot' }),
    ]
    const suggestions = [buildSuggestion({ id: 's1', entryId: 'm1' })]

    // observationStart (2026-02-21) is after toDate (2026-02-20) → nothing observable.
    expect(coachUptake(suggestions, entries, '2026-02-01', '2026-02-20', null)).toBe(0)
  })
})

// 2026-02-02 is a Monday; 2026-02-02..2026-02-15 covers every weekday twice.
const TWO_WEEKS_FROM = '2026-02-02'
const TWO_WEEKS_TO = '2026-02-15'

function twoWeeksOfEntries(habitId: string, statusFor: (date: string) => HabitEntry['status'] | null): HabitEntry[] {
  const entries: HabitEntry[] = []
  for (let day = 2; day <= 15; day += 1) {
    const date = `2026-02-${String(day).padStart(2, '0')}`
    const status = statusFor(date)
    if (status) {
      entries.push(buildEntry({ id: `${habitId}_${date}`, habitId, date, status, completedAt: null }))
    }
  }
  return entries
}

describe('weekdayCompletionRates (#2)', () => {
  it('counts done and missed check-ins on due days per weekday', () => {
    const habit = buildHabit()
    // Mondays missed, every other day done.
    const entries = twoWeeksOfEntries('habit_1', date => (date === '2026-02-02' || date === '2026-02-09' ? 'missed' : 'done'))

    const rates = weekdayCompletionRates([habit], entries, TWO_WEEKS_FROM, TWO_WEEKS_TO)

    expect(rates).toHaveLength(7)
    expect(rates.find(rate => rate.weekday === 1)).toEqual({ weekday: 1, done: 0, total: 2, rate: 0 })
    expect(rates.find(rate => rate.weekday === 3)).toEqual({ weekday: 3, done: 2, total: 2, rate: 100 })
  })

  it('ignores skipped days, open days, off-schedule entries and paused days', () => {
    const habit = buildHabit({
      scheduleWeekdays: [1, 2],
      pauses: [{ start: '2026-02-09', end: '2026-02-09' }],
    })
    const entries = [
      buildEntry({ id: 'e1', date: '2026-02-02', status: 'done' }), // Mon, counted
      buildEntry({ id: 'e2', date: '2026-02-03', status: 'skipped' }), // Tue, skipped → ignored
      buildEntry({ id: 'e3', date: '2026-02-04', status: 'missed' }), // Wed, not scheduled → ignored
      buildEntry({ id: 'e4', date: '2026-02-09', status: 'missed' }), // Mon, paused → ignored
      // 2026-02-10 (Tue) has no entry yet → open, ignored
    ]

    const rates = weekdayCompletionRates([habit], entries, TWO_WEEKS_FROM, TWO_WEEKS_TO)

    expect(rates).toEqual([{ weekday: 1, done: 1, total: 1, rate: 100 }])
  })

  it('only counts dates inside the window and skips archived habits', () => {
    const active = buildHabit()
    const archived = buildHabit({ id: 'habit_2', archived: true })
    const entries = [
      buildEntry({ id: 'in', date: '2026-02-03', status: 'done' }),
      buildEntry({ id: 'before', date: '2026-02-01', status: 'missed' }),
      buildEntry({ id: 'arch', habitId: 'habit_2', date: '2026-02-03', status: 'missed' }),
    ]

    expect(weekdayCompletionRates([active, archived], entries, '2026-02-02', '2026-02-03')).toEqual([
      { weekday: 2, done: 1, total: 1, rate: 100 },
    ])
  })
})

describe('weekdayExtremes (#2)', () => {
  it('returns the strongest and the weakest weekday', () => {
    const habit = buildHabit()
    const entries = twoWeeksOfEntries('habit_1', (date) => {
      if (date === '2026-02-02' || date === '2026-02-09') return 'missed' // Mondays 0%
      if (date === '2026-02-03') return 'missed' // Tuesdays 50%
      return 'done'
    })

    const result = weekdayExtremes([habit], entries, TWO_WEEKS_FROM, TWO_WEEKS_TO, 1)

    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.weakest).toMatchObject({ weekday: 1, rate: 0 })
    // Wed..Sun tie at 100%: the first in display order (week starts Monday) wins.
    expect(result.strongest).toMatchObject({ weekday: 3, rate: 100 })
    expect(result.checkIns).toBe(14)
  })

  it('breaks ties by the configured week start', () => {
    const habit = buildHabit()
    const entries = twoWeeksOfEntries('habit_1', date => (date === '2026-02-04' || date === '2026-02-11' ? 'missed' : 'done'))

    const mondayFirst = weekdayExtremes([habit], entries, TWO_WEEKS_FROM, TWO_WEEKS_TO, 1)
    const sundayFirst = weekdayExtremes([habit], entries, TWO_WEEKS_FROM, TWO_WEEKS_TO, 0)

    expect(mondayFirst.status === 'ok' && mondayFirst.strongest.weekday).toBe(1)
    expect(sundayFirst.status === 'ok' && sundayFirst.strongest.weekday).toBe(0)
  })

  it('prefers the weekday with more check-ins on equal rates', () => {
    const habits = [buildHabit(), buildHabit({ id: 'habit_2', scheduleWeekdays: [5] })]
    const entries = [
      ...twoWeeksOfEntries('habit_1', date => (date === '2026-02-03' || date === '2026-02-10' ? 'missed' : 'done')),
      ...twoWeeksOfEntries('habit_2', date => (date === '2026-02-06' || date === '2026-02-13' ? 'done' : null)),
    ]

    const result = weekdayExtremes(habits, entries, TWO_WEEKS_FROM, TWO_WEEKS_TO, 1)

    // Friday has 4 done check-ins, the other 100% days only 2.
    expect(result.status === 'ok' && result.strongest).toMatchObject({ weekday: 5, total: 4 })
  })

  it('breaks ties for the weakest weekday by more check-ins', () => {
    const habits = [buildHabit(), buildHabit({ id: 'habit_2', scheduleWeekdays: [6] })]
    // Daily habit: Fridays and Saturdays missed. Second habit misses Saturdays too.
    const entries = [
      ...twoWeeksOfEntries('habit_1', date => (['2026-02-06', '2026-02-07', '2026-02-13', '2026-02-14'].includes(date) ? 'missed' : 'done')),
      ...twoWeeksOfEntries('habit_2', date => (date === '2026-02-07' || date === '2026-02-14' ? 'missed' : null)),
    ]

    const result = weekdayExtremes(habits, entries, TWO_WEEKS_FROM, TWO_WEEKS_TO, 1)

    // Friday and Saturday are both 0%; Saturday has 4 check-ins, Friday 2.
    expect(result.status === 'ok' && result.weakest).toMatchObject({ weekday: 6, total: 4, rate: 0 })
  })

  it('reports even when every qualifying weekday has the same rate', () => {
    const entries = twoWeeksOfEntries('habit_1', () => 'done')

    expect(weekdayExtremes([buildHabit()], entries, TWO_WEEKS_FROM, TWO_WEEKS_TO, 1)).toEqual({
      status: 'even',
      rate: 100,
      weekdays: 7,
      checkIns: 14,
    })
  })

  it('needs at least two weekdays with two check-ins each', () => {
    const habit = buildHabit()
    // One week only: every weekday has a single check-in.
    const oneWeek = twoWeeksOfEntries('habit_1', date => (date <= '2026-02-08' ? 'done' : null))
    // Two weeks, but only Mondays are scheduled.
    const mondaysOnly = buildHabit({ scheduleWeekdays: [1] })
    const mondays = twoWeeksOfEntries('habit_1', () => 'done')

    expect(weekdayExtremes([habit], oneWeek, TWO_WEEKS_FROM, TWO_WEEKS_TO, 1)).toEqual({
      status: 'insufficient',
      checkIns: 7,
    })
    expect(weekdayExtremes([mondaysOnly], mondays, TWO_WEEKS_FROM, TWO_WEEKS_TO, 1)).toEqual({
      status: 'insufficient',
      checkIns: 2,
    })
    expect(weekdayExtremes([], [], TWO_WEEKS_FROM, TWO_WEEKS_TO, 1)).toEqual({ status: 'insufficient', checkIns: 0 })
  })

  it('leaves out weekdays below the threshold when picking extremes', () => {
    const habit = buildHabit()
    const entries = [
      ...twoWeeksOfEntries('habit_1', (date) => {
        if (date === '2026-02-02' || date === '2026-02-09') return 'done' // Mon 100%
        if (date === '2026-02-03' || date === '2026-02-10') return 'missed' // Tue 0%
        return null
      }),
      buildEntry({ id: 'wed', date: '2026-02-04', status: 'missed' }), // Wed: one check-in only
    ]

    const result = weekdayExtremes([habit], entries, TWO_WEEKS_FROM, TWO_WEEKS_TO, 1)

    expect(result.status === 'ok' && [result.strongest.weekday, result.weakest.weekday]).toEqual([1, 2])
  })
})
