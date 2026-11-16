<script setup lang="ts">
import type { AppSettings, Habit, HabitEntry } from '~/types/app-data'
import { WEEKDAY_MIN_CHECK_INS, weekdayExtremes } from '~/utils/domain/stats'

const props = defineProps<{
  habits: Habit[]
  entries: HabitEntry[]
  fromDate: string
  toDate: string
  weekStartsOn: AppSettings['weekStartsOn']
  /** Length of the selected window in days, or `null` for all time. */
  windowDays: number | null
}>()

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

const result = computed(() =>
  weekdayExtremes(props.habits, props.entries, props.fromDate, props.toDate, props.weekStartsOn),
)

const extremes = computed(() => {
  const value = result.value
  if (value.status !== 'ok') {
    return []
  }

  return [
    { key: 'strongest', label: 'Strongest day', color: 'success' as const, item: value.strongest },
    { key: 'weakest', label: 'Weakest day', color: 'warning' as const, item: value.weakest },
  ]
})

const windowPhrase = computed(() =>
  props.windowDays === null ? 'all time' : `the last ${props.windowDays} days`,
)

function checkInsLabel(count: number): string {
  return `${count} check-in${count === 1 ? '' : 's'}`
}
</script>

<template>
  <UCard
    as="section"
    aria-labelledby="weekday-rhythm-heading"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-calendar-range"
          class="size-5 text-muted"
        />
        <h2
          id="weekday-rhythm-heading"
          class="text-lg font-semibold"
        >
          Weekday rhythm
        </h2>
      </div>
    </template>

    <div class="space-y-3 p-1">
      <UEmpty
        v-if="result.status === 'insufficient'"
        icon="i-lucide-calendar-range"
        title="Not enough check-ins yet"
        :description="`To compare weekdays, at least two of them need ${WEEKDAY_MIN_CHECK_INS} or more done or missed check-ins. There are not enough for ${windowPhrase} yet: try a longer time range or keep logging.`"
      />

      <UAlert
        v-else-if="result.status === 'even'"
        color="neutral"
        variant="subtle"
        icon="i-lucide-equal"
        title="No weekday stands out"
        :description="`All ${result.weekdays} tracked weekdays sit at ${result.rate}% for ${windowPhrase}.`"
      />

      <div
        v-else
        class="grid gap-3 sm:grid-cols-2"
      >
        <div
          v-for="extreme in extremes"
          :key="extreme.key"
          class="rounded-lg border border-default/60 p-3"
        >
          <p class="text-sm text-muted">
            {{ extreme.label }}
          </p>
          <div class="mt-1 flex items-end justify-between gap-3">
            <p class="text-2xl font-semibold">
              {{ WEEKDAY_NAMES[extreme.item.weekday] }}
            </p>
            <UBadge
              :color="extreme.color"
              variant="subtle"
              size="lg"
            >
              {{ extreme.item.rate }}%
            </UBadge>
          </div>
          <p class="mt-1 text-xs text-muted">
            {{ extreme.item.done }} of {{ checkInsLabel(extreme.item.total) }} done
          </p>
        </div>
      </div>

      <p
        v-if="result.status !== 'insufficient'"
        class="text-xs text-muted"
      >
        Based on {{ checkInsLabel(result.checkIns) }} for {{ windowPhrase }}. Skipped, paused and still open days are not counted.
      </p>
    </div>
  </UCard>
</template>
