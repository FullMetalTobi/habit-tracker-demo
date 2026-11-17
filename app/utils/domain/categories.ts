import type { Habit, HabitCategory } from '~/types/app-data'
import { HABIT_CATEGORY_KEYS } from '~/types/app-data'

export interface CategoryOption {
  value: HabitCategory
  label: string
}

/** The fixed category list (ADR-0025). Keys are persisted; labels are UI only. */
export const CATEGORY_OPTIONS: readonly CategoryOption[] = [
  { value: 'health', label: 'Health' },
  { value: 'learning', label: 'Learning' },
  { value: 'work', label: 'Work' },
]

export function isCategoryKey(value: unknown): value is HabitCategory {
  return typeof value === 'string' && (HABIT_CATEGORY_KEYS as readonly string[]).includes(value)
}

/** Display label for a stored key; unknown or empty values fall back to the raw text. */
export function categoryLabel(value: string | null | undefined): string {
  if (!value) {
    return ''
  }
  return CATEGORY_OPTIONS.find(option => option.value === value)?.label ?? value
}

/**
 * Normalizes a raw `?category=` query value (string, array, undefined) to a
 * single filter string, or null when no filter is active. The result is NOT
 * validated: an unknown key stays a filter and simply matches no habit, so it
 * renders as an empty filter state instead of being silently ignored.
 */
export function normalizeCategoryFilter(raw: unknown): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string' || value.trim() === '') {
    return null
  }
  return value
}

/** Keeps only habits of the given category. A null filter returns all habits. */
export function filterByCategory<T extends Pick<Habit, 'category'>>(items: readonly T[], filter: string | null): T[] {
  if (filter === null) {
    return [...items]
  }
  return items.filter(item => item.category === filter)
}

/** Same as {@link filterByCategory} for wrapper models that carry a `habit`. */
export function filterModelsByCategory<T extends { habit: Pick<Habit, 'category'> }>(items: readonly T[], filter: string | null): T[] {
  if (filter === null) {
    return [...items]
  }
  return items.filter(item => item.habit.category === filter)
}
