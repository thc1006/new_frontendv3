// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  app: {
    head: {
      title: 'WiSDON',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico?v=2' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png?v=2' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png?v=2' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png?v=2' }
      ]
    }
  },
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
  vite: {
    // 生產環境移除 console.log/debugger，保留 error/warn 用於錯誤追蹤
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['debugger'] : [],
      pure: process.env.NODE_ENV === 'production' ? ['console.log'] : [],
    },
    // 強制 bundler 使用單一 three.js 實例，避免多實例警告
    // 注意: threebox-plugin 內部 bundled 了自己的 three.js (r132)，使用 CommonJS require('./three.js')
    // Vite dedupe 和 alias 無法攔截這種相對路徑的 CommonJS import
    // 這是 threebox-plugin 的已知限制，console 會顯示 "Multiple instances of Three.js" 警告
    // 但不影響功能，只是提示訊息
    resolve: {
      dedupe: ['three'],
    },
    // Code Splitting: 將大型依賴分離成獨立 chunk
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // 地圖相關 (~800KB)
            'mapbox': ['mapbox-gl'],
            // 3D 渲染相關 (~600KB)
            'three': ['three'],
            // Vuetify UI 組件 (~300KB)
            'vuetify': ['vuetify'],
          },
        },
      },
    },
  },
  // Vue Query 全域設定 - 減少不必要的重複請求
  vueQuery: {
    queryClientOptions: {
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 資料新鮮度 5 分鐘
          refetchOnWindowFocus: false, // 視窗聚焦時不自動重新請求
          retry: 1, // 失敗只重試一次
        },
      },
    },
  },
  // Nitro server configuration
  nitro: {
    // Proxy external APIs to bypass CORS
    routeRules: {
      // App Control API proxy (140.113.144.121:8088)
      '/api/app-control/**': {
        proxy: 'http://140.113.144.121:8088/**'
      },
      // FL Training API proxy (140.113.144.121:3032, 正式上線改 9005)
      '/api/fl-training/**': {
        proxy: 'http://140.113.144.121:3032/**'
      }
    }
  },
  runtimeConfig: {
    public: {
      apiBase: '/api', // 使用相對路徑，讓 nginx 反向代理處理
      NOMINATIM_API_URL: process.env.NUXT_PUBLIC_NOMINATIM_API_URL || '',
      logoStyle: process.env.NUXT_PUBLIC_LOGO_STYLE || 'WiSDON',
      isOnline: process.env.NUXT_PUBLIC_IS_ONLINE === 'true',
      offlineMapboxGLJSURL: process.env.NUXT_PUBLIC_OFFLINE_MAPBOX_GL_JS_URL || 'http://127.0.0.1/tiles/styles/basic-preview/style.json',
      // Grafana dashboard URLs
      grafanaNesUrl: process.env.NUXT_PUBLIC_GRAFANA_NES_URL || 'http://140.113.144.121:2982/d/adkys2aoyeqkgf/nes',
      grafanaMroUrl: process.env.NUXT_PUBLIC_GRAFANA_MRO_URL || 'http://140.113.144.121:2982/d/bdl9s0tm6mebkf/mro',
      // TODO: 待後端提供實際 dashboard URL
      grafanaAiModelUrl: process.env.NUXT_PUBLIC_GRAFANA_AI_MODEL_URL || '',
      grafanaRanSliceUrl: process.env.NUXT_PUBLIC_GRAFANA_RAN_SLICE_URL || '',
      // Sentry error tracking (optional)
      sentryDsn: process.env.NUXT_PUBLIC_SENTRY_DSN || ''
    },
  }
})