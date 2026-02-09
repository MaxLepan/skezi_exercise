<script setup lang="ts">
type Room = { id: number; name: string; maxCapacity: number }
type Reservation = { id: number; roomId: number; startAt: string; endAt: string }

const rooms = ref<Room[]>([])
const myReservations = ref<Reservation[]>([])
const loading = ref(true)

const load = async () => {
  loading.value = true
  try {
    rooms.value = await useApiFetch<Room[]>('/rooms')
    myReservations.value = await useApiFetch<Reservation[]>('/reservations/me')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-5xl mx-auto p-6 space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Dashboard</h1>
        <button class="text-sm underline" @click="load">Refresh</button>
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

        <section class="bg-white p-4 rounded shadow">
          <h2 class="font-semibold mb-3">My reservations</h2>
          <ul v-if="myReservations.length" class="space-y-2">
            <li v-for="res in myReservations" :key="res.id" class="border rounded p-2">
              <div class="flex justify-between">
                <div class="font-medium">Reservation #{{ res.id }} (room {{ res.roomId }})</div>
              </div>
              <div class="text-sm text-gray-600">
                {{ res.startAt }} → {{ res.endAt }}
              </div>
            </li>
          </ul>
          <div v-else class="text-gray-500 text-sm">No reservations yet.</div>
        </section>
      </div>
    </div>
  </div>
</template>
