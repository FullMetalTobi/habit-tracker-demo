import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import HabitForm from '~/components/HabitForm.vue'
import type { Habit } from '~/types/app-data'

// Hoisted spy so the mocked `useToast` auto-import shares one instance across the
// module factory and the assertions below.
const { toastAdd } = vi.hoisted(() => ({ toastAdd: vi.fn() }))

mockNuxtImport('useToast', () => () => ({
  add: toastAdd,
  update: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
  toasts: [],
}))

function buildInitialHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit_1',
    name: 'Read 10 pages',
    type: 'build',
    identityStatement: 'I am a person who reads every day.',
    scheduleWeekdays: [],
    reminderTime: null,
    startDate: '2026-02-08',
    archived: false,
    pauses: [],
    category: null,
    createdAt: '2026-02-08T00:00:00.000Z',
    updatedAt: '2026-02-08T00:00:00.000Z',
    ...overrides,
  }
}

describe('HabitForm — weekday validation', () => {
  afterEach(() => {
    toastAdd.mockReset()
  })

  it('warns and does not emit submit when no weekday is selected', async () => {
    // Otherwise-valid habit with an empty schedule exercises the component guard
    // directly through the real UForm/UCheckbox integration.
    const wrapper = await mountSuspended(HabitForm, {
      props: { initial: buildInitialHabit() },
    })

    await wrapper.find('form').trigger('submit')
    // Let UForm run its async Zod validation and the resulting render tick settle.
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()

    expect(toastAdd).toHaveBeenCalledWith({
      title: 'Select at least one day',
      description: 'A habit needs at least one planned weekday.',
      color: 'warning',
    })
    expect(wrapper.emitted('submit')).toBeUndefined()
  })
})

describe('HabitForm — category', () => {
  afterEach(() => {
    toastAdd.mockReset()
  })

  async function submit(initial: Habit) {
    const wrapper = await mountSuspended(HabitForm, { props: { initial } })
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    return wrapper
  }

  it('emits the initial category key on submit', async () => {
    const wrapper = await submit(buildInitialHabit({ scheduleWeekdays: [1], category: 'learning' }))
    const payload = wrapper.emitted('submit')?.[0]?.[0] as { category: string | null }
    expect(payload.category).toBe('learning')
  })

  it('emits null when no category is set', async () => {
    const wrapper = await submit(buildInitialHabit({ scheduleWeekdays: [1] }))
    const payload = wrapper.emitted('submit')?.[0]?.[0] as { category: string | null }
    expect(payload.category).toBeNull()
  })

  it('renders a Category field', async () => {
    const wrapper = await mountSuspended(HabitForm, { props: { initial: buildInitialHabit() } })
    expect(wrapper.text()).toContain('Category')
  })
})
