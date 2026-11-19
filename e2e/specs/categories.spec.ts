import { test, expect } from '../support/fixtures'
import { HabitFormPage } from '../support/pages/habit-form'
import { flushSave, readPersistedStore } from '../support/seed'
import { makeAppData, makeHabit } from '../support/data'
import { appRoutePattern } from '../support/url'

async function waitForPersistedCategory(page: import('@playwright/test').Page, name: string, category: string) {
  await flushSave(page)
  await expect
    .poll(async () =>
      (await readPersistedStore<{ name: string, category: string }>(page, 'habits')).some(
        h => h.name === name && h.category === category,
      ),
    )
    .toBe(true)
}

test.describe('Habit categories', () => {
  test('E1 new habit defaults to Other, a picked category shows as badge and survives reload', async ({ authedPage: page }) => {
    const form = new HabitFormPage(page)
    await form.gotoNew()
    await expect(page.getByTestId('habit-category')).toContainText('Other')

    await form.fill({ name: 'Plain habit', identityStatement: 'I am consistent.', weekdays: [1] })
    await form.submit()
    await expect(page).toHaveURL(appRoutePattern('/app/habits'))
    await expect(page.locator('.habit-card').filter({ hasText: 'Plain habit' }).getByTestId('habit-category-badge')).toHaveText('Other')

    await form.gotoNew()
    await form.fill({ name: 'Study habit', identityStatement: 'I am a learner.', category: 'Learning', weekdays: [1] })
    await form.submit()

    const card = page.locator('.habit-card').filter({ hasText: 'Study habit' })
    await expect(card.getByTestId('habit-category-badge')).toHaveText('Learning')

    await waitForPersistedCategory(page, 'Study habit', 'learning')
    await page.reload()
    await expect(page.locator('.habit-card').filter({ hasText: 'Study habit' }).getByTestId('habit-category-badge')).toHaveText('Learning')
  })

  test('E2 editing preselects the stored category, a change is saved and survives reload', async ({ authedPage: page, seed }) => {
    const habit = makeHabit({ name: 'Run', identityStatement: 'I am a runner.', category: 'work' })
    await seed(makeAppData({ habits: [habit] }))
    await page.goto(`/app/habits/${habit.id}`)

    const form = new HabitFormPage(page)
    await expect(page.getByTestId('habit-category')).toContainText('Work')
    await form.setCategory('Health')
    await form.submit()

    await expect(page.locator('.habit-card').filter({ hasText: 'Run' }).getByTestId('habit-category-badge')).toHaveText('Health')

    await waitForPersistedCategory(page, 'Run', 'health')
    await page.reload()
    await expect(page.locator('.habit-card').filter({ hasText: 'Run' }).getByTestId('habit-category-badge')).toHaveText('Health')
  })

  test('E3 list filter: URL sync, deep link, reload, reset, unknown value, page reset, empty state', async ({ authedPage: page, seed }) => {
    const learning = Array.from({ length: 7 }, (_, i) =>
      makeHabit({ name: `Study ${i + 1}`, category: 'learning', updatedAt: `2026-01-0${i + 1}T00:00:00.000Z` }))
    const work = makeHabit({ name: 'Inbox zero', category: 'work' })
    await seed(makeAppData({ habits: [...learning, work] }))

    const cards = page.locator('.habit-card')
    const filter = page.getByTestId('category-filter')

    // Deep link and reload keep the filter.
    await page.goto('/app/habits?category=work')
    await expect(cards).toHaveCount(1)
    await expect(cards.first()).toContainText('Inbox zero')
    await expect(filter).toContainText('Work')
    await page.reload()
    await expect(cards).toHaveCount(1)

    // Picking a category writes the URL; page 2 exists for 7 habits.
    await filter.click()
    await page.getByRole('option', { name: 'Learning' }).click()
    await expect(page).toHaveURL(/category=learning/)
    await expect(cards).toHaveCount(6)
    await page.getByRole('button', { name: 'Page 2' }).click()
    await expect(cards).toHaveCount(1)

    // A filter change jumps back to page 1.
    await filter.click()
    await page.getByRole('option', { name: 'Work' }).click()
    await expect(page).toHaveURL(/category=work/)
    await expect(cards).toHaveCount(1)
    await expect(cards.first()).toContainText('Inbox zero')

    // Empty state names the category and resets the filter.
    await filter.click()
    await page.getByRole('option', { name: 'Health' }).click()
    await expect(page.getByText('No habits in Health')).toBeVisible()
    await page.getByRole('button', { name: 'Show all categories' }).click()
    await expect(page).not.toHaveURL(/category=/)
    await expect(cards).toHaveCount(6)
    await expect(page.getByText('8 habits shown')).toBeVisible()

    // "All categories" removes the param.
    await filter.click()
    await page.getByRole('option', { name: 'Work' }).click()
    await filter.click()
    await page.getByRole('option', { name: 'All categories' }).click()
    await expect(page).not.toHaveURL(/category=/)

    // An unknown value shows everything.
    await page.goto('/app/habits?category=bogus')
    await expect(page.getByText('8 habits shown')).toBeVisible()
    await expect(filter).toContainText('All categories')
  })
})
