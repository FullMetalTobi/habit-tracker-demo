<script setup lang="ts">
import { HABIT_CATEGORIES, HABIT_CATEGORY_LABELS } from '~/types/app-data'
import type { HabitCategoryFilter } from '~/types/app-data'

const model = defineModel<HabitCategoryFilter>({ default: 'all' })

const items = [
  { value: 'all', label: 'All categories' },
  ...HABIT_CATEGORIES.map(category => ({ value: category, label: HABIT_CATEGORY_LABELS[category] })),
]
</script>

<template>
  <USelect
    v-model="model"
    :items="items"
    value-key="value"
    icon="i-lucide-tag"
    aria-label="Filter by category"
    data-testid="category-filter"
    class="w-full sm:w-52"
  />
</template>
