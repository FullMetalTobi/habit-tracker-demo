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
})
