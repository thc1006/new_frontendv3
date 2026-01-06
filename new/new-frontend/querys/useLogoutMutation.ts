import { useMutation, useQueryClient } from '@tanstack/vue-query'

export default function useLogoutMutation() {
  const { $apiClient } = useNuxtApp()

  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => $apiClient.auth.logoutCreate(),
    onSettled: () => {
      queryClient.removeQueries()
      console.log('Logout mutation settled, invalidating queries')
    },
  })
}