<script setup lang="ts">
type Room = { id: number; name: string; maxCapacity: number }
type Reservation = { id: number; roomId: number; startAt: string; endAt: string }

const props = defineProps<{
  rooms: Room[]
  editingReservation?: Reservation | null
}>()

const emit = defineEmits<{
  (e: 'created'): void
  (e: 'updated'): void
  (e: 'cancelEdit'): void
}>()

const selectedRoomId = ref<number | null>(null)
const startAtLocal = ref<string>('')
const endAtLocal = ref<string>('')

const availability = ref<null | { available: boolean }>(null)
const checking = ref(false)
const submitting = ref(false)
const errorMsg = ref<string | null>(null)

const isEditMode = computed(() => !!props.editingReservation?.id)

function toIsoFromDatetimeLocal(value: string): string {
  return new Date(value).toISOString()
}

function toDatetimeLocalFromIso(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mi = pad(d.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

watch(
  () => props.editingReservation,
  (res) => {
    errorMsg.value = null
    availability.value = null

    if (res) {
      selectedRoomId.value = res.roomId
      startAtLocal.value = toDatetimeLocalFromIso(res.startAt)
      endAtLocal.value = toDatetimeLocalFromIso(res.endAt)
    } else {
      selectedRoomId.value = props.rooms[0]?.id ?? null
      startAtLocal.value = ''
      endAtLocal.value = ''
    }
  },
  { immediate: true }
)

const canCheckAvailability = computed(() => {
  return !!selectedRoomId.value && !!startAtLocal.value && !!endAtLocal.value
})

const canSubmit = computed(() => {
  if (!canCheckAvailability.value) return false
  if (availability.value && availability.value.available === false) return false
  return true
})

async function checkAvailability() {
  if (!canCheckAvailability.value) return
  errorMsg.value = null
  availability.value = null
  checking.value = true

  try {
    const roomId = selectedRoomId.value as number
    const startAt = toIsoFromDatetimeLocal(startAtLocal.value)
    const endAt = toIsoFromDatetimeLocal(endAtLocal.value)

    const res = await useApiFetch<{ available: boolean }>(
      `/rooms/${roomId}/availability?startAt=${encodeURIComponent(startAt)}&endAt=${encodeURIComponent(endAt)}`
    )

    availability.value = res
  } catch (e: any) {
    errorMsg.value = 'Cannot check availability.'
  } finally {
    checking.value = false
  }
}

async function submit() {
  if (!canSubmit.value) return
  errorMsg.value = null
  submitting.value = true

  try {
    const roomId = selectedRoomId.value as number
    const startAt = toIsoFromDatetimeLocal(startAtLocal.value)
    const endAt = toIsoFromDatetimeLocal(endAtLocal.value)

    if (!isEditMode.value) {
      await useApiFetch(`/reservations`, {
        method: 'POST',
        body: { roomId, startAt, endAt }
      })
      emit('created')
      availability.value = null
      startAtLocal.value = ''
      endAtLocal.value = ''
    } else {
      const id = props.editingReservation!.id
      await useApiFetch(`/reservations/${id}`, {
        method: 'PATCH',
        body: { startAt, endAt }
      })
      emit('updated')
      emit('cancelEdit')
    }
  } catch (e: any) {
    const msg =
      e?.data?.message ||
      e?.response?._data?.message ||
      (typeof e?.message === 'string' ? e.message : null)

    errorMsg.value = msg ? String(msg) : 'Error saving reservation.'
  } finally {
    submitting.value = false
  }
}

function cancelEdit() {
  emit('cancelEdit')
}
</script>

<template>
  <section class="bg-white p-4 rounded shadow space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="font-semibold">
        {{ isEditMode ? `Modify reservation #${editingReservation?.id}` : 'Create a reservation' }}
      </h2>

      <button
        v-if="isEditMode"
        class="text-sm underline text-gray-600"
        type="button"
        @click="cancelEdit"
      >
        Cancel edit
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <label class="block text-sm text-gray-600 mb-1">Room</label>
        <select v-model.number="selectedRoomId" class="border rounded p-2 w-full">
          <option v-for="r in rooms" :key="r.id" :value="r.id">
            {{ r.name }} ({{ r.maxCapacity }})
          </option>
        </select>
      </div>

      <div>
        <label class="block text-sm text-gray-600 mb-1">Start</label>
        <input v-model="startAtLocal" type="datetime-local" class="border rounded p-2 w-full" />
      </div>

      <div>
        <label class="block text-sm text-gray-600 mb-1">End</label>
        <input v-model="endAtLocal" type="datetime-local" class="border rounded p-2 w-full" />
      </div>
    </div>

    <div class="flex flex-wrap gap-2 items-center">
      <button
        type="button"
        class="border rounded px-3 py-2"
        :disabled="!canCheckAvailability || checking"
        @click="checkAvailability"
      >
        {{ checking ? 'Checking...' : 'Check availability' }}
      </button>

      <div v-if="availability" class="text-sm">
        <span
          v-if="availability.available"
          class="text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded"
        >
          Available ✅
        </span>
        <span
          v-else
          class="text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded"
        >
          Unavailable ❌
        </span>
      </div>

      <button
        type="button"
        class="bg-blue-600 text-white rounded px-4 py-2 ml-auto disabled:opacity-50"
        :disabled="!canSubmit || submitting"
        @click="submit"
      >
        {{ submitting ? 'Sending...' : (isEditMode ? 'Update' : 'Create') }}
      </button>
    </div>

    <p v-if="errorMsg" class="text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded">
      {{ errorMsg }}
    </p>
  </section>
</template>
