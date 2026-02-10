<script setup lang="ts">
type Room = { id: number; name: string; maxCapacity: number }
type Reservation = { id: number; roomId: number; startAt: string; endAt: string }

const props = defineProps<{
  rooms: Room[]
}>()

const selectedRoomId = ref<number | null>(props.rooms[0]?.id ?? null)
const day = ref<string>(() => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}) as Ref<string>

const roomReservations = ref<Reservation[]>([])
const loading = ref(false)
const errorMsg = ref<string | null>(null)

function fmt(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString()
}

function dayStartLocal(dayStr: string) {
  return new Date(`${dayStr}T00:00:00`)
}

function dayEndLocal(dayStr: string) {
  const start = dayStartLocal(dayStr)
  return new Date(start.getTime() + 24 * 60 * 60 * 1000)
}

function toIsoRange(dayStr: string) {
  const from = dayStartLocal(dayStr).toISOString()
  const to = dayEndLocal(dayStr).toISOString()
  return { from, to }
}

const load = async () => {
  if (!selectedRoomId.value) return
  loading.value = true
  errorMsg.value = null
  try {
    const { from, to } = toIsoRange(day.value)
    roomReservations.value = await useApiFetch<Reservation[]>(
      `/rooms/${selectedRoomId.value}/reservations?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    )
  } catch (e) {
    errorMsg.value = "Failed to load reservations for the selected day and room."
  } finally {
    loading.value = false
  }
}

watch([selectedRoomId, day], load, { immediate: true })

type Segment = {
  id: number
  leftPct: number
  widthPct: number
  label: string
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function minutesSinceDayStart(date: Date, dayStart: Date) {
  return (date.getTime() - dayStart.getTime()) / 60000
}

const segments = computed<Segment[]>(() => {
  const start = dayStartLocal(day.value)
  const end = dayEndLocal(day.value)
  const totalMinutes = 24 * 60

  return roomReservations.value
    .map((r) => {
      const s = new Date(r.startAt)
      const e = new Date(r.endAt)

      const sClamped = s < start ? start : s
      const eClamped = e > end ? end : e

      const startMin = clamp(minutesSinceDayStart(sClamped, start), 0, totalMinutes)
      const endMin = clamp(minutesSinceDayStart(eClamped, start), 0, totalMinutes)

      const duration = Math.max(0, endMin - startMin)
      const leftPct = (startMin / totalMinutes) * 100
      const widthPct = (duration / totalMinutes) * 100

      const label = `${sClamped.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}–${eClamped.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`

      return { id: r.id, leftPct, widthPct, label }
    })
    .filter((seg) => seg.widthPct > 0.05)
})
</script>

<template>
  <section class="bg-white p-4 rounded shadow space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="font-semibold">Room planning</h2>
      <button class="text-sm underline" @click="load">Refresh</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <label class="block text-sm text-gray-600 mb-1">Room</label>
        <select v-model.number="selectedRoomId" class="border rounded p-2 w-full">
          <option v-for="r in rooms" :key="r.id" :value="r.id">
            {{ r.name }}
          </option>
        </select>
      </div>

      <div>
        <label class="block text-sm text-gray-600 mb-1">Day</label>
        <input v-model="day" type="date" class="border rounded p-2 w-full" />
      </div>
    </div>

    <div v-if="loading" class="text-sm text-gray-600">Loading...</div>
    <p v-if="errorMsg" class="text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded">
      {{ errorMsg }}
    </p>

    <div v-if="!loading && !errorMsg" class="space-y-3">
      <!-- Timeline -->
      <div>
        <div class="text-sm text-gray-600 mb-2">Timeline 24h</div>

        <div class="relative border rounded h-10 bg-gray-50 overflow-hidden">
          <!-- segments -->
          <div
            v-for="seg in segments"
            :key="seg.id"
            class="absolute top-1 bottom-1 rounded bg-blue-600/70 border border-blue-700/30"
            :style="{ left: seg.leftPct + '%', width: seg.widthPct + '%' }"
            :title="`#${seg.id} ${seg.label}`"
          ></div>

          <!-- time markers -->
          <div class="absolute inset-0 pointer-events-none">
            <div class="absolute left-0 top-0 bottom-0 w-px bg-gray-300"></div>
            <div class="absolute left-1/4 top-0 bottom-0 w-px bg-gray-200"></div>
            <div class="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200"></div>
            <div class="absolute left-3/4 top-0 bottom-0 w-px bg-gray-200"></div>
            <div class="absolute right-0 top-0 bottom-0 w-px bg-gray-300"></div>
          </div>
        </div>

        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>

        <div v-if="segments.length === 0" class="text-sm text-green-700 mt-2">
          No reservations for the day ✅ (room available all day)
        </div>
      </div>

      <!-- List (still useful) -->
      <div>
        <div class="text-sm text-gray-600 mb-2">Reservations for the day</div>

        <div v-if="roomReservations.length" class="space-y-2">
          <div
            v-for="res in roomReservations"
            :key="res.id"
            class="border rounded p-2 flex justify-between"
          >
            <div>
              <div class="font-medium">#{{ res.id }}</div>
              <div class="text-sm text-gray-600">{{ fmt(res.startAt) }} → {{ fmt(res.endAt) }}</div>
            </div>
          </div>
        </div>

        <div v-else class="text-sm text-gray-500">
          Nothing to display.
        </div>
      </div>
    </div>
  </section>
</template>
