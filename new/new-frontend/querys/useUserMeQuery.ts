// querys/useUserQuery.ts
import { useQuery } from '@tanstack/vue-query'
import { useNuxtApp } from '#app'

/**
 * 取得目前使用者資訊的 Vue Query Composable
 * @param options - 可選的 Query 設定
 */
export function useUserMeQuery() {
  const { $apiClient } = useNuxtApp()
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => $apiClient.user.getUser(),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 分鐘
  })
}
