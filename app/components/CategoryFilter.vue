<script setup lang="ts">
import { CATEGORY_OPTIONS } from '~/utils/domain/categories'

const ALL = 'all'

const props = defineProps<{
  modelValue: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const items = [
  { value: ALL, label: 'All categories' },
  ...CATEGORY_OPTIONS.map(option => ({ value: option.value as string, label: option.label })),
]

const selected = computed({
  get: () => props.modelValue ?? ALL,
  set: (value: string) => emit('update:modelValue', value === ALL ? null : value),
})
</script>

<template>
  <USelect
    v-model="selected"
    :items="items"
    value-key="value"
    aria-label="Filter by category"
    class="w-full sm:w-56"
  />
</template>
