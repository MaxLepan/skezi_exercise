// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  devServer: {
    port: 3001,
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE || 'http://localhost:3000',
    },
  },

  routeRules: {
    '/dashboard': { appMiddleware: ['auth'] },
    '/stats': { appMiddleware: ['auth'] },
  },

  modules: ['@nuxtjs/tailwindcss', 'nuxt-charts']
})