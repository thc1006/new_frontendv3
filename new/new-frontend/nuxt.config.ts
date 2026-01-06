// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  typescript: {
    typeCheck: true
  },
  devtools: { enabled: false },
  modules: ['@nuxt/eslint', '@pinia/nuxt', 'vuetify-nuxt-module','@hebilicious/vue-query-nuxt'],
  css: ['vuetify/styles'],
  ssr: false,
  build: {
    transpile: ['vuetify'],
  },
  runtimeConfig: {
    public: {
      apiBase: '/api', // 使用相對路徑，讓 nginx 反向代理處理
      NOMINATIM_API_URL: process.env.NUXT_PUBLIC_NOMINATIM_API_URL || '',
      logoStyle: process.env.NUXT_PUBLIC_LOGO_STYLE || 'WiSDON',
      isOnline: process.env.NUXT_PUBLIC_IS_ONLINE === 'true',
      offlineMapboxGLJSURL: process.env.NUXT_PUBLIC_OFFLINE_MAPBOX_GL_JS_URL || 'http://127.0.0.1/tiles/styles/basic-preview/style.json'
    },
  }
})