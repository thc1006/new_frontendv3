// middleware/auth.ts
import { defineNuxtRouteMiddleware } from '#app'
import { useUserStore } from '~/stores/user'
import { useRouter } from 'vue-router'
import { createModuleLogger } from '~/utils/logger'

const log = createModuleLogger('Auth')

export default defineNuxtRouteMiddleware(async (to) => {
  const userStore = useUserStore()
  const router = useRouter()
  await userStore.fetchUser()
  log.debug('User Store:', userStore.user)

  if (userStore.user && to.path === '/login') {
    return router.push('/')
  }

  if (to.path === '/register' || to.path === '/login') {
    return
  }

  if (!userStore.user) {
    return router.push('/login')
  }
})
