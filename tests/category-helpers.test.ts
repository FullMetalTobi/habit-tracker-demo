import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useHabitsStore } from '~/stores/habits'
import type { Habit } from '~/types/app-data'
import {
  CATEGORY_OPTIONS,
  categoryIcon,
  categoryLabel,
  filterByCategory,
  parseCategoryFilter,
} from '~/utils/domain/categories'

const h = (id: string, category: Habit['category']) => ({ id, category }) as Habit

describe('category helpers', () => {
  it('labels and options cover every category in a stable order', () => {
    expect(CATEGORY_OPTIONS.map(option => option.value)).toEqual(['health', 'learning', 'work', 'other'])
    expect(CATEGORY_OPTIONS.map(option => option.label)).toEqual(['Health', 'Learning', 'Work', 'Other'])
    expect(categoryLabel('learning')).toBe('Learning')
    expect(categoryIcon('work')).toMatch(/^i-lucide-/)
  })

  it('parseCategoryFilter accepts valid values and maps everything else to null', () => {
    expect(parseCategoryFilter('health')).toBe('health')
    expect(parseCategoryFilter('other')).toBe('other')
    expect(parseCategoryFilter(['work', 'health'])).toBe('work')
    for (const bad of ['bogus', '', 'HEALTH', undefined, null, [], 3]) {
      expect(parseCategoryFilter(bad)).toBeNull()
    }
  })

  it('filterByCategory returns all items for null and only matches otherwise', () => {
    const items = [h('1', 'health'), h('2', 'work'), h('3', 'health')]
    expect(filterByCategory(items, null)).toEqual(items)
    expect(filterByCategory(items, 'health').map(i => i.id)).toEqual(['1', '3'])
    expect(filterByCategory(items, 'learning')).toEqual([])
  })

  it('filterByCategory accepts wrappers via a selector', () => {
    const models = [{ habit: h('1', 'work') }, { habit: h('2', 'other') }]
    expect(filterByCategory(models, 'other', model => model.habit).map(m => m.habit.id)).toEqual(['2'])
  })
})

describe('habitsByCategory getter', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('returns the habits of one category, including archived ones', () => {
    const store = useHabitsStore()
    store.hydrate([h('1', 'health'), { ...h('2', 'health'), archived: true } as Habit, h('3', 'work')])
    expect(store.habitsByCategory('health').map(x => x.id)).toEqual(['1', '2'])
    expect(store.habitsByCategory('learning')).toEqual([])
  })
})
