import { test, expect } from '../support/fixtures'
import { HabitFormPage } from '../support/pages/habit-form'
import { DashboardPage } from '../support/pages/dashboard'
import { makeAppData, makeEntry, makeHabit, todayKey } from '../support/data'
import { readPersistedStore } from '../support/seed'
import type { Habit } from '../../app/types/app-data'

// ATDD red-phase scaffolds for GitHub #1 "Habit categories + filter"
// (_bmad-output/implementation-artifacts/spec-gh-1-habit-categories-filter.md).
//
// One leaf per acceptance criterion (AC-1..AC-3 live here, AC-4 in
// tests/habit-categories.test.ts). Each is `test.skip` until the developer
// activates it for the current task: remove `.skip`, run it RED, implement,
// run it GREEN. Never weaken or delete these assertions.
//
// Each journey is wrapped in ONE `expect(...).resolves` so a failure anywhere
// (navigation, locator, interaction, outcome) keeps its criterion provenance.
//
// Assumed UI contract (confirm against the real UI when activating):
//   - HabitForm has a labelled select "Category" with options Health / Learning / Work
//   - Today and the habit list read the filter from `?category=<key>`
//   - Empty filter states offer a button "Reset filter"

// `category` is not on `Habit` yet (red phase), so attach it without a type error.
function withCategory(habit: Habit, category: string | null): Habit {
  return Object.assign(habit, { category })
}

test.describe('Habit categories & filter (GH-1, ATDD)', () => {
  test.skip('[P0] AC-1 a category assigned in the form survives a reload', async ({ authedPage: page }) => {
    await expect(
      (async () => {
        const form = new HabitFormPage(page)
        await form.gotoNew()
        await form.fill({
          type: 'build',
          name: 'Morning run',
          identityStatement: 'I am a runner.',
          weekdays: [0, 1, 2, 3, 4, 5, 6],
        })
        await page.getByLabel('Category').click()
        await page.getByRole('option', { name: 'Health' }).click()
        await form.submit()

        // Criterion-defining assertion: the persisted key, once the debounced save landed.
        await expect
          .poll(async () => {
            const habits = await readPersistedStore<{ name: string, category?: string | null }>(page, 'habits')
            return habits.find(habit => habit.name === 'Morning run')?.category
          })
          .toBe('health')

        await page.reload()
        await page.goto('/app/habits')
        await page.locator('.habit-card').filter({ hasText: 'Morning run' }).getByRole('link', { name: 'Edit' }).click()
        await expect(page.getByLabel('Category')).toContainText('Health')
      })(),
    ).resolves.toBeUndefined()
  })

  test.skip('[P0] AC-2 a freshly opened /app?category=X link shows only that category', async ({ authedPage: page, seed }) => {
    await expect(
      (async () => {
        const run = withCategory(makeHabit({ name: 'Morning run' }), 'health')
        const email = withCategory(makeHabit({ name: 'Inbox zero' }), 'work')
        await seed(makeAppData({ habits: [run, email] }))

        // Direct open (shared link), not an in-app navigation.
        await page.goto('/app?category=health')

        const dash = new DashboardPage(page)
        // Wait for the queue first: a count-0 check alone passes vacuously before the page renders.
        await expect(dash.card('Morning run')).toBeVisible()
        await expect(dash.card('Inbox zero')).toHaveCount(0)
      })(),
    ).resolves.toBeUndefined()
  })

  test.skip('[P0] AC-3 no "all done" message while other categories are still open', async ({ authedPage: page, seed }) => {
    await expect(
      (async () => {
        const run = withCategory(makeHabit({ name: 'Morning run' }), 'health')
        const email = withCategory(makeHabit({ name: 'Inbox zero' }), 'work')
        await seed(makeAppData({
          habits: [run, email],
          entries: [makeEntry({ habitId: run.id, date: todayKey(), status: 'done' })],
        }))

        await page.goto('/app?category=health')
        await new DashboardPage(page).openTab()

        // Every due Health habit is done, Work is still open: offer the reset, and
        // never claim that everything due today has been reviewed.
        await expect(page.getByRole('button', { name: 'Reset filter' })).toBeVisible()
        await expect(page.getByText('Everything due today has already been reviewed.')).toHaveCount(0)
      })(),
    ).resolves.toBeUndefined()
  })
})
