// Run before other plugins
export default defineNuxtPlugin({
  enforce: 'pre',
  setup() {
    // Use import.meta.dev instead of process.dev
    if (!import.meta.dev) return

    // Basic Safari detection
    const ua = navigator.userAgent
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua)
    if (!isSafari) return

    // Stub Vue Devtools global hook to prevent Safari crashes
    // (types added below in a .d.ts file)
    window.__VUE_DEVTOOLS_GLOBAL_HOOK__ = {
      emit: () => {},
      on: () => {},
      once: () => {},
      off: () => {}
    }
  }
})
