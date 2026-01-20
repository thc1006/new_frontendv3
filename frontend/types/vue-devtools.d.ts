export {}
declare global {
  interface Window {
    __VUE_DEVTOOLS_GLOBAL_HOOK__?: {
      emit: (...args: unknown[]) => void
      on: (...args: unknown[]) => void
      once: (...args: unknown[]) => void
      off: (...args: unknown[]) => void
    }
  }
}
