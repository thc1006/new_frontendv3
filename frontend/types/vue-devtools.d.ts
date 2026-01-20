export {}
declare global {
  interface Window {
    __VUE_DEVTOOLS_GLOBAL_HOOK__?: {
      emit: (...args: any[]) => void
      on: (...args: any[]) => void
      once: (...args: any[]) => void
      off: (...args: any[]) => void
    }
  }
}
