<script setup lang="ts">
type OccupancyRow = {
  bucket_start: string
  room_name: string
  occupancy_rate: number
}

type TopRoomRow = {
  room_name: string
  reservation_count: number
}

type AvgDurationRow = {
  bucket_start: string
  avg_minutes: number | null
  count: number
}

const props = defineProps<{
  period: 'day' | 'week' | 'month'
  fromIso: string
  toIso: string
  occupancy: OccupancyRow[]
  topRooms: TopRoomRow[]
  avgDuration: AvgDurationRow[]
}>()

const selectedRoom = ref<string | null>(null)

const roomNames = computed(() => {
  const set = new Set(props.occupancy.map(r => r.room_name))
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

watch(
  roomNames,
  (names) => {
    if (!selectedRoom.value && names.length && names[0]) selectedRoom.value = names[0]
  },
  { immediate: true }
)

// --- Chart 1: Occupancy line (1 room selected)
const occupancyData = computed(() => {
  const room = selectedRoom.value
  const rows = props.occupancy
    .filter(r => !room || r.room_name === room)
    .sort((a, b) => new Date(a.bucket_start).getTime() - new Date(b.bucket_start).getTime())

  return rows.map(r => ({
    date: new Date(r.bucket_start).toLocaleDateString(),
    occupancy: Math.round(r.occupancy_rate * 1000) / 10, // % avec 1 décimale
  }))
})

const occupancyCategories = {
  occupancy: { name: 'Occupancy (%)', color: '#3b82f6' },
}

const occupancyXFormatter = (tick: number) => String(occupancyData.value[tick]?.date ?? '')

// --- Chart 2: Top rooms bar
const topRoomsData = computed(() => {
  const rows = [...props.topRooms].sort((a, b) => b.reservation_count - a.reservation_count)
  return rows.map(r => ({ room: r.room_name, count: r.reservation_count }))
})

const topRoomsCategories = {
  count: { name: 'Reservations', color: '#22c55e' },
}
const topRoomsXFormatter = (tick: number) => String(topRoomsData.value[tick]?.room ?? '')

// --- Chart 3: Avg duration line
const avgDurationData = computed(() => {
  const rows = [...props.avgDuration].sort(
    (a, b) => new Date(a.bucket_start).getTime() - new Date(b.bucket_start).getTime()
  )

  return rows.map(r => ({
    date: new Date(r.bucket_start).toLocaleDateString(),
    avg: r.avg_minutes == null ? 0 : Number(r.avg_minutes), // ✅ force number
  }))
})

const avgDurationMax = computed(() => {
  const max = Math.max(...avgDurationData.value.map(d => d.avg))
  // arrondi “propre” pour l’axe (ex: 103 -> 110)
  return Math.max(10, Math.ceil(max / 10) * 10)
})


const avgDurationCategories = {
  avg: { name: 'Avg duration (min)', color: '#f59e0b' },
}

const avgDurationXFormatter = (tick: number) => String(avgDurationData.value[tick]?.date ?? '')
</script>

<template>
  <div class="space-y-6">
    <!-- Occupancy -->
    <section class="bg-white rounded shadow p-4 space-y-3">
      <div class="flex items-center justify-between gap-3">
        <h2 class="font-semibold">Occupancy by room</h2>

        <select v-model="selectedRoom" class="border rounded p-2 text-sm">
          <option v-for="name in roomNames" :key="name" :value="name">
            {{ name }}
          </option>
        </select>
      </div>

      <LineChart
        :data="occupancyData"
        :height="280"
        :categories="occupancyCategories"
        :x-formatter="occupancyXFormatter"
        y-label="Occupancy (%)"
        :x-num-ticks="4"
        :y-num-ticks="4"
        :y-grid-line="true"
      />
    </section>

    <!-- Top rooms -->
    <section class="bg-white rounded shadow p-4 space-y-3">
      <h2 class="font-semibold">Top 3 most reserved rooms</h2>

      <BarChart
        :data="topRoomsData"
        :height="280"
        :categories="topRoomsCategories"
        :x-formatter="topRoomsXFormatter"
        :y-axis="['count']"
        y-label="Reservations"
        :x-num-ticks="3"
        :y-num-ticks="4"
        :y-grid-line="true"
      />
    </section>

    <!-- Avg duration -->
    <section class="bg-white rounded shadow p-4 space-y-3">
      <h2 class="font-semibold">Average meeting duration</h2>

      <LineChart
        :data="avgDurationData"
        :height="280"
        :categories="avgDurationCategories"
        :x-formatter="avgDurationXFormatter"
        y-label="Minutes"
        :x-num-ticks="4"
        :y-num-ticks="4"
        :y-grid-line="true"
        :y-max="avgDurationMax"
      />
    </section>
  </div>
</template>
