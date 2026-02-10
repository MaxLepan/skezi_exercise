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

function dayRangeToIso(dayStr: string) {
  // dayStr: "YYYY-MM-DD" in local time
  const start = new Date(`${dayStr}T00:00:00`)
  const end = new Date(`${dayStr}T23:59:59`)
  return { from: start.toISOString(), to: end.toISOString() }
}

const load = async () => {
  if (!selectedRoomId.value) return
  loading.value = true
  errorMsg.value = null
  try {
    const { from, to } = dayRangeToIso(day.value)
    roomReservations.value = await useApiFetch<Reservation[]>(
      `/rooms/${selectedRoomId.value}/reservations?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    )
  } catch (e) {
    errorMsg.value = "Impossible de charger le planning de la salle."
  } finally {
    loading.value = false
  }
}

watch([selectedRoomId, day], load, { immediate: true })

function fmt(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString()
}
</script>

<template>
  <section class="bg-white p-4 rounded shadow space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="font-semibold">Planning d’une salle</h2>
      <button class="text-sm underline" @click="load">Refresh</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <label class="block text-sm text-gray-600 mb-1">Salle</label>
        <select v-model.number="selectedRoomId" class="border rounded p-2 w-full">
          <option v-for="r in rooms" :key="r.id" :value="r.id">
            {{ r.name }}
          </option>
        </select>
      </div>

      <div>
        <label class="block text-sm text-gray-600 mb-1">Jour</label>
        <input v-model="day" type="date" class="border rounded p-2 w-full" />
      </div>
    </div>

    <div v-if="loading" class="text-sm text-gray-600">Chargement...</div>
    <p v-if="errorMsg" class="text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded">
      {{ errorMsg }}
    </p>

    <div v-if="!loading && !errorMsg">
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
          <div class="text-xs text-gray-400">room {{ res.roomId }}</div>
        </div>
      </div>

      <div v-else class="text-sm text-gray-500">
        Aucune réservation ce jour-là ✅ (salle libre)
      </div>
    </div>
  </section>
</template>
