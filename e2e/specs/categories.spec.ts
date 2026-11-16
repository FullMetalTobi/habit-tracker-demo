import { test, expect } from '../support/fixtures'
import { HabitFormPage } from '../support/pages/habit-form'
import { makeAppData, makeHabit } from '../support/data'

test.describe('Habit categories', () => {
  test('creates a habit with a category and edits it', async ({ authedPage: page }) => {
    const form = new HabitFormPage(page)
    await form.gotoNew()
    await form.fill({
      name: 'Stretch daily',
      identityStatement: 'I take care of my body.',
      weekdays: [0, 1, 2, 3, 4, 5, 6],
    })
    await page.getByTestId('habit-category').click()
    await page.getByRole('option', { name: 'Health' }).click()
    await form.submit()

    const card = page.locator('.habit-card').filter({ hasText: 'Stretch daily' })
    await expect(card.getByTestId('habit-category-badge')).toHaveText('Health')

    await card.getByRole('link', { name: /edit/i }).click()
    await page.getByTestId('habit-category').click()
    await page.getByRole('option', { name: 'Work' }).click()
    await form.submit()
    await expect(
      page.locator('.habit-card').filter({ hasText: 'Stretch daily' }).getByTestId('habit-category-badge'),
    ).toHaveText('Work')
  })

  test('filters the habit list and the Today queue by category', async ({ authedPage: page, seed }) => {
    await seed(makeAppData({
      habits: [
        makeHabit({ name: 'Run', category: 'health' }),
        makeHabit({ name: 'Study', category: 'learning' }),
        makeHabit({ name: 'Inbox zero', category: 'work' }),
      ],
    }))

    await page.goto('/app')
    await expect(page.locator('.queue-card')).toHaveCount(3)
    await page.getByTestId('category-filter').click()
    await page.getByRole('option', { name: 'Learning' }).click()
    await expect(page.locator('.queue-card')).toHaveCount(1)
    await expect(page.locator('.queue-card').first()).toContainText('Study')

    await page.goto('/app/habits')
    await expect(page.locator('.habit-card')).toHaveCount(3)
    await page.getByTestId('category-filter').click()
    await page.getByRole('option', { name: 'Health' }).click()
    await expect(page.locator('.habit-card')).toHaveCount(1)
    await expect(page.locator('.habit-card').first()).toContainText('Run')
  })
})
