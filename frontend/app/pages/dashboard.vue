<script setup lang="ts">
type Room = { id: number; name: string; maxCapacity: number }
type Reservation = { id: number; roomId: number; startAt: string; endAt: string }

const rooms = ref<Room[]>([])
const myReservations = ref<Reservation[]>([])
const loading = ref(true)
const editingReservation = ref<Reservation | null>(null)

const load = async () => {
  loading.value = true
  try {
    rooms.value = await useApiFetch<Room[]>('/rooms')
    myReservations.value = await useApiFetch<Reservation[]>('/reservations/me')
  } finally {
    loading.value = false
  }
}

const onEdit = (res: Reservation) => {
  editingReservation.value = res
}

const onCancelEdit = () => {
  editingReservation.value = null
}

const onDelete = async (res: Reservation) => {
  if (!confirm('Are you sure you want to delete this reservation?')) {
    return
  }

  await useApiFetch(`/reservations/${res.id}`, { method: 'DELETE' })
  await load()
}

const onCreatedOrUpdated = async () => {
  await load()
}

function fmt(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString()
}

onMounted(load)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-5xl mx-auto p-6 space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Dashboard</h1>
        <div class="space-x-4">
          <NuxtLink to="/stats" class="text-sm underline">View stats</NuxtLink>
          <button class="text-sm underline" @click="load">Refresh</button>
        </div>
      </div>

      <div v-if="loading">Loading...</div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section class="bg-white p-4 rounded shadow">
          <h2 class="font-semibold mb-3">Rooms</h2>
          <ul class="space-y-2">
            <li v-for="r in rooms" :key="r.id" class="border rounded p-2 flex justify-between">
              <div>
                <div class="font-medium">{{ r.name }}</div>
                <div class="text-sm text-gray-500">Capacity: {{ r.maxCapacity }}</div>
              </div>
              <div class="text-sm text-gray-500">#{{ r.id }}</div>
            </li>
          </ul>
        </section>

        <ReservationForm
          :rooms="rooms"
          :editing-reservation="editingReservation"
          @created="onCreatedOrUpdated"
          @updated="onCreatedOrUpdated"
          @cancelEdit="onCancelEdit"
        />

        <section class="bg-white p-4 rounded shadow">
          <h2 class="font-semibold mb-3">My reservations</h2>
          <ul class="space-y-2">
            <li v-for="res in myReservations" :key="res.id" class="border rounded p-2 flex justify-between">
              <div>
                <div class="font-medium">#{{ res.id }} — {{rooms.find(r => r.id === res.roomId)?.name }}</div>
                <div class="text-sm text-gray-600">{{ fmt(res.startAt) }} → {{ fmt(res.endAt) }}</div>
              </div>
              <button class="text-sm underline" @click="onEdit(res)">Edit</button>
              <button class="text-sm underline text-red-600" @click="onDelete(res)">Delete</button>
            </li>
          </ul>
        </section>

        <RoomSchedule :rooms="rooms" />
      </div>
    </div>
  </div>
</template>
