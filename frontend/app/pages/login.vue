<script setup lang="ts">
const email = ref('')
const password = ref('')
const token = useCookie<string | null>('token')
const router = useRouter()

const login = async () => {
  try {
    const res = await useApiFetch<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value
      }
    })

    token.value = res.access_token
    router.push('/dashboard')
  } catch (e) {
    alert('Login failed')
    console.error(e)
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-6 rounded shadow w-80">
      <h1 class="text-xl font-bold mb-4">Login</h1>

      <p class="text-sm text-gray-600 mb-4">Test credentials: user1@test.com / password123</p>
      <p class="text-sm text-gray-600 mb-6">Or see the <code class="font-mono bg-gray-100 px-1 rounded">/prisma/seed.ts</code> file for more users</p>

      <input v-model="email" placeholder="Email" class="border p-2 w-full mb-2" />
      <input v-model="password" type="password" placeholder="Password" class="border p-2 w-full mb-4" />

      <button @click="login" class="bg-blue-600 text-white w-full p-2 rounded">
        Login
      </button>
    </div>
  </div>
</template>
