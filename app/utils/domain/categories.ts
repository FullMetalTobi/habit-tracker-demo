import { HABIT_CATEGORIES, type HabitCategory } from '~/types/app-data'

/** Pure category helpers (ADR-0026): labels, icons, form options and the URL filter parser. */

const CATEGORY_META: Record<HabitCategory, { label: string, icon: string }> = {
  health: { label: 'Health', icon: 'i-lucide-heart-pulse' },
  learning: { label: 'Learning', icon: 'i-lucide-book-open' },
  work: { label: 'Work', icon: 'i-lucide-briefcase' },
  other: { label: 'Other', icon: 'i-lucide-tag' },
}

export const CATEGORY_OPTIONS: Array<{ value: HabitCategory, label: string, icon: string }> = HABIT_CATEGORIES.map(
  value => ({ value, ...CATEGORY_META[value] }),
)

export function categoryLabel(category: HabitCategory): string {
  return CATEGORY_META[category].label
}

export function categoryIcon(category: HabitCategory): string {
  return CATEGORY_META[category].icon
}

/**
 * Parse a raw `?category=` query value. Anything that is not exactly one known
 * category (unknown, empty, wrong case) means "no filter" (`null`). For a repeated
 * param the first value wins.
 */
export function parseCategoryFilter(raw: unknown): HabitCategory | null {
  const value = Array.isArray(raw) ? raw[0] : raw
  return HABIT_CATEGORIES.find(category => category === value) ?? null
}

/** Filter by category; `null` keeps everything. `select` unwraps view models that hold a habit. */
export function filterByCategory<T extends { category: HabitCategory }>(items: readonly T[], category: HabitCategory | null): T[]
export function filterByCategory<T>(items: readonly T[], category: HabitCategory | null, select: (item: T) => { category: HabitCategory }): T[]
export function filterByCategory<T>(
  items: readonly T[],
  category: HabitCategory | null,
  select: (item: T) => { category: HabitCategory } = item => item as unknown as { category: HabitCategory },
): T[] {
  return category === null ? [...items] : items.filter(item => select(item).category === category)
}
