import { Api } from '../apis/Api'

// 後端使用 Flask-Login session-based 認證
// 瀏覽器會自動攜帶 session cookie，不需要手動設置 Authorization header
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const api = new Api({
    baseURL: config.public.apiBase as string,
    // 啟用 withCredentials 確保跨域請求攜帶 cookie（用於 Flask-Login session）
    withCredentials: true,
  })

  return {
    provide: {
      apiClient: api,
    },
  }
})
