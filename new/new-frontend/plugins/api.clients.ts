import { Api } from '../apis/Api'
type SecData = { headers: Record<string, string> }

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const api = new Api<SecData>({
    baseURL: config.public.apiBase as string, // Axios 基礎 URL
    securityWorker: () => {
      const token = localStorage.getItem('token')
      return token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {}
    },
  })

  return {
    provide: {
      apiClient: api,
    },
  }
})
