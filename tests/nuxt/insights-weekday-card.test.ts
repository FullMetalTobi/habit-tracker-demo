import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import InsightsWeekdayCard from '~/components/InsightsWeekdayCard.vue'
import type { Habit, HabitEntry } from '~/types/app-data'

// 2026-02-02 is a Monday; the window covers every weekday twice.
const FROM = '2026-02-02'
const TO = '2026-02-15'

function buildHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit_1',
    name: 'Read 10 pages',
    type: 'build',
    identityStatement: 'I am a reader.',
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

function entriesFor(statusFor: (date: string) => HabitEntry['status']): HabitEntry[] {
  return Array.from({ length: 14 }, (_, index) => {
    const date = `2026-02-${String(index + 2).padStart(2, '0')}`
    return {
      id: `entry_${date}`,
      habitId: 'habit_1',
      date,
      status: statusFor(date),
      completedAt: null,
      missReasonCode: null,
      missReasonNote: null,
    }
  })
}

function mountCard(entries: HabitEntry[], habits: Habit[] = [buildHabit()], windowDays: number | null = 30) {
  return mountSuspended(InsightsWeekdayCard, {
    props: { habits, entries, fromDate: FROM, toDate: TO, weekStartsOn: 1, windowDays },
  })
}

describe('InsightsWeekdayCard (#2)', () => {
  it('names the strongest and the weakest weekday with their rates', async () => {
    // Mondays missed, everything else done.
    const wrapper = await mountCard(entriesFor(date => (date === '2026-02-02' || date === '2026-02-09' ? 'missed' : 'done')))
    const text = wrapper.text()

    expect(text).toContain('Weekday rhythm')
    expect(text).toContain('Strongest day')
    expect(text).toContain('Tuesday')
    expect(text).toContain('100%')
    expect(text).toContain('Weakest day')
    expect(text).toContain('Monday')
    expect(text).toContain('0%')
    expect(text).toContain('Based on 14 check-ins for the last 30 days.')
  })

  it('shows an empty state instead of numbers when there is too little data', async () => {
    const wrapper = await mountCard([], [], 7)
    const text = wrapper.text()

    expect(text).toContain('Not enough check-ins yet')
    expect(text).toContain('the last 7 days')
    expect(text).not.toContain('Strongest day')
    expect(text).not.toMatch(/\d+%/)
  })

  it('says so when every weekday has the same rate', async () => {
    const wrapper = await mountCard(entriesFor(() => 'done'), [buildHabit()], null)
    const text = wrapper.text()

    expect(text).toContain('No weekday stands out')
    expect(text).toContain('All 7 tracked weekdays sit at 100% for all time.')
    expect(text).not.toContain('Strongest day')
  })
})
