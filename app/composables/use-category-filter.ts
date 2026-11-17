import { categoryLabel, normalizeCategoryFilter } from '~/utils/domain/categories'

/**
 * URL-bound category filter (ADR-0025). The filter lives only in
 * `route.query.category`, so it survives reloads and shared links and is never
 * stored. An unknown value stays active and matches no habit (empty state).
 */
export function useCategoryFilter() {
  const route = useRoute()
  const router = useRouter()

  const filter = computed(() => normalizeCategoryFilter(route.query.category))
  const label = computed(() => categoryLabel(filter.value))

  function setFilter(value: string | null): void {
    const query = { ...route.query }
    if (value === null || value === '') {
      delete query.category
    }
    else {
      query.category = value
    }
    void router.replace({ query })
  }

  function reset(): void {
    setFilter(null)
  }

  return { filter, label, setFilter, reset }
}
