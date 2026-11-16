import { test, expect } from '../support/fixtures'
import { HabitFormPage } from '../support/pages/habit-form'
import { addDaysKey, makeAppData, makeHabit, todayKey } from '../support/data'
import { appRoutePattern } from '../support/url'

function dailyHabit(name: string, category: 'health' | 'learning' | 'work' | 'other', extra = {}) {
  return makeHabit({
    name,
    category,
    scheduleWeekdays: [0, 1, 2, 3, 4, 5, 6],
    startDate: addDaysKey(todayKey(), -3),
    reminderTime: null,
    ...extra,
  })
}

test.describe('Habit categories', () => {
  test('E1: create with a category shows its badge; default is Other', async ({ authedPage: page }) => {
    const form = new HabitFormPage(page)
    await form.gotoNew()
    await expect(page.getByTestId('habit-category')).toContainText('Other')

    await form.fill({ name: 'Study Spanish', identityStatement: 'I am a learner.', weekdays: [1], category: 'learning' })
    await form.submit()
    await expect(page).toHaveURL(appRoutePattern('/app/habits'))
    await expect(
      page.locator('.habit-card').filter({ hasText: 'Study Spanish' }).getByTestId('habit-category-badge'),
    ).toContainText('Learning')

    await form.gotoNew()
    await form.fill({ name: 'Plain habit', identityStatement: 'I am plain.', weekdays: [1] })
    await form.submit()
    await expect(
      page.locator('.habit-card').filter({ hasText: 'Plain habit' }).getByTestId('habit-category-badge'),
    ).toContainText('Other')
  })

  test('E2/E5: editing the category persists across reload', async ({ authedPage: page, seed }) => {
    const habit = dailyHabit('Run 5k', 'other')
    await seed(makeAppData({ habits: [habit] }))
    await page.goto(`/habits/${habit.id}`)
    const form = new HabitFormPage(page)
    await expect(page.getByTestId('habit-category')).toContainText('Other')
    await form.chooseCategory('Health')
    await form.submit()

    const badge = () => page.locator('.habit-card').filter({ hasText: 'Run 5k' }).getByTestId('habit-category-badge')
    await expect(badge()).toContainText('Health')
    // Let the debounced save flush, then reload.
    await page.waitForTimeout(1500)
    await page.reload()
    await expect(badge()).toContainText('Health')
  })
})
