// stores/user.ts
import { defineStore } from 'pinia'
import { useNuxtApp } from '#app'
import type { User } from '~/apis/Api'

export const useUserStore = defineStore('user', () => {
  // English comments: Keep plain reactive state in the store.
  const user = ref<User | null>(null)
  const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
  const { $apiClient } = useNuxtApp()

  // English comments: Fetch user via direct API call (no vue-query hook here).
  async function fetchUser() {
    status.value = 'loading'
    try {
      const res = await $apiClient.user.getUser()
      user.value = res.data
      status.value = 'success'
      return true
    } catch (e) {
      console.error(e)
      user.value = null
      status.value = 'error'
      return false
    }
  }

  // English comments: Logout via API and clear local state.
  async function logout() {
    try {
      await $apiClient.auth.logoutCreate()
    } catch (e) {
      console.error(e)
      // Even if API fails, proceed to clear local state
    } finally {
      user.value = null
      status.value = 'idle'
    }
  }

  return {
    user,
    status,
    fetchUser,
    logout,
  }
})
