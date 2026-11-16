import { test, expect } from '../support/fixtures'
import { addDaysKey, makeAppData, makeEntry, makeHabit, todayKey, weekdayOf } from '../support/data'
import type { AppData, HabitEntry } from '../../app/types/app-data'

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0]

/**
 * One daily habit with four weeks of check-ins before today (today stays open).
 * Every check-in on `weakWeekday` is missed, all others are done. Inside 7 days each
 * weekday has a single check-in (too little data); inside 30 days each has four.
 */
function fourWeeksWithWeakDay(weakWeekday: number): AppData {
  const today = todayKey()
  const habit = makeHabit({ name: 'Morning walk', startDate: addDaysKey(today, -28) })
  const entries: HabitEntry[] = []
  for (let offset = 28; offset >= 1; offset -= 1) {
    const date = addDaysKey(today, -offset)
    entries.push(makeEntry({ habitId: habit.id, date, status: weekdayOf(date) === weakWeekday ? 'missed' : 'done' }))
  }
  return makeAppData({ habits: [habit], entries })
}

test.describe('Insights: weekday rhythm (#2)', () => {
  test('follows the time range and names the strongest and weakest weekday', async ({ authedPage: page, seed }) => {
    const weakWeekday = weekdayOf(addDaysKey(todayKey(), -1))
    // All other weekdays tie at 100%; the first one in Monday-first order wins.
    const strongWeekday = MONDAY_FIRST.find(day => day !== weakWeekday)!

    await seed(fourWeeksWithWeakDay(weakWeekday))
    await page.goto('/app/insights')

    const card = page.getByRole('region', { name: 'Weekday rhythm' })
    await expect(card).toBeVisible()

    // Default 7 days: one check-in per weekday is not enough to compare.
    await expect(card.getByText('Not enough check-ins yet')).toBeVisible()
    await expect(card.getByText('Strongest day')).toHaveCount(0)

    await page.getByRole('button', { name: '30 days' }).click()
    await expect(card.getByText('Strongest day')).toBeVisible()
    await expect(card.getByText(WEEKDAY_NAMES[strongWeekday]!, { exact: true })).toBeVisible()
    await expect(card.getByText(WEEKDAY_NAMES[weakWeekday]!, { exact: true })).toBeVisible()
    await expect(card.getByText('100%')).toBeVisible()
    await expect(card.getByText('0%', { exact: true })).toBeVisible()
    await expect(card.getByText('Based on 28 check-ins for the last 30 days.', { exact: false })).toBeVisible()

    await page.getByRole('button', { name: 'All time' }).click()
    await expect(card.getByText('Based on 28 check-ins for all time.', { exact: false })).toBeVisible()

    // The result is derived from persisted check-ins, so it survives a reload.
    await page.reload()
    await page.getByRole('button', { name: '30 days' }).click()
    await expect(card.getByText(WEEKDAY_NAMES[weakWeekday]!, { exact: true })).toBeVisible()
    await expect(card.getByText('0%', { exact: true })).toBeVisible()
  })

  test('shows the empty state without any history', async ({ authedPage: page }) => {
    await page.goto('/app/insights')

    const card = page.getByRole('region', { name: 'Weekday rhythm' })
    await expect(card.getByText('Not enough check-ins yet')).toBeVisible()
    await expect(card.getByText(/\d+%/)).toHaveCount(0)
  })
})
