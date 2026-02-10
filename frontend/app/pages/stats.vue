<script setup lang="ts">
type Period = 'day' | 'week' | 'month'

const period = ref<Period>('week')

// filtres communs (date inputs)
const fromDate = ref<string>((() => {
  const d = new Date()
  d.setDate(d.getDate() - 14)
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
})()) as Ref<string>

const toDate = ref<string>((() => {
  const d = new Date()
  return d.toISOString().slice(0, 10)
})()) as Ref<string>

function toIsoStartOfDay(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toISOString()
}
function toIsoEndExclusive(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00`)
  return new Date(start.getTime() + 24 * 60 * 60 * 1000).toISOString()
}

const fromIso = computed(() => toIsoStartOfDay(fromDate.value))
const toIso = computed(() => toIsoEndExclusive(toDate.value))

async function fetchAll() {
  const q = `period=${period.value}&from=${encodeURIComponent(fromIso.value)}&to=${encodeURIComponent(toIso.value)}`

  const [occupancy, topRooms, avgDuration] = await Promise.all([
    useApiFetch<any[]>(`/stats/rooms/occupancy?${q}`),
    useApiFetch<any[]>(`/stats/rooms/top?${q}&limit=3`),
    useApiFetch<any[]>(`/stats/meetings/avg-duration?${q}`),
  ])

  return { occupancy, topRooms, avgDuration }
}

const { data, pending, error, refresh } = await useAsyncData('stats', fetchAll, {
  watch: [period, fromIso, toIso],
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-5xl mx-auto p-6 space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Stats</h1>
        <div class="space-x-4">
          <NuxtLink to="/dashboard" class="text-sm underline">Back to dashboard</NuxtLink>
          <button class="text-sm underline" @click="() => refresh()">Refresh</button>
        </div>
      </div>

      <!-- Filtres globaux -->
      <section class="bg-white rounded shadow p-4 space-y-3">
        <div class="flex flex-wrap gap-2 items-center">
          <span class="text-sm text-gray-600">Scope</span>

          <button
            class="px-3 py-1 rounded border text-sm"
            :class="period === 'day' ? 'bg-gray-100' : ''"
            @click="period = 'day'"
          >Daily</button>

          <button
            class="px-3 py-1 rounded border text-sm"
            :class="period === 'week' ? 'bg-gray-100' : ''"
            @click="period = 'week'"
          >Weekly</button>

          <button
            class="px-3 py-1 rounded border text-sm"
            :class="period === 'month' ? 'bg-gray-100' : ''"
            @click="period = 'month'"
          >Monthly</button>

          <div class="ml-auto flex flex-wrap gap-2 items-center">
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-600">From</label>
              <input v-model="fromDate" type="date" class="border rounded p-2 text-sm" />
            </div>
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-600">To</label>
              <input v-model="toDate" type="date" class="border rounded p-2 text-sm" />
            </div>
          </div>
        </div>

        <p class="text-xs text-gray-500">
          Applied to all charts: {{ fromIso }} → {{ toIso }}
        </p>
      </section>

      <div v-if="pending" class="text-sm text-gray-600">Loading…</div>
      <div v-else-if="error" class="text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded">
        Failed to load stats.
      </div>

      <StatsCharts
        v-else
        :period="period"
        :from-iso="fromIso"
        :to-iso="toIso"
        :occupancy="data!.occupancy"
        :top-rooms="data!.topRooms"
        :avg-duration="data!.avgDuration"
      />
    </div>
  </div>
</template>
