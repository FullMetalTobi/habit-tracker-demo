import { computed } from 'vue'
import type { HabitCategory } from '~/types/app-data'
import { parseCategoryFilter } from '~/utils/domain/categories'

/**
 * Category filter that lives only in the URL (`?category=`, ADR-0026). An invalid
 * value reads as "all". Setting `null` removes the param; other query params are kept.
 */
export function useCategoryFilter() {
  const route = useRoute()
  const router = useRouter()

  const category = computed<HabitCategory | null>(() => parseCategoryFilter(route.query.category))

  async function setCategory(next: HabitCategory | null): Promise<void> {
    const { category: _previous, ...rest } = route.query
    await router.replace({ query: next === null ? rest : { ...rest, category: next } })
  }

  return { category, setCategory }
}
