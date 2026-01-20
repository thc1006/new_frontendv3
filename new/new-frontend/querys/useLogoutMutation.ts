import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { createModuleLogger } from '~/utils/logger'

const log = createModuleLogger('Auth')

export default function useLogoutMutation() {
  const { $apiClient } = useNuxtApp()

  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => $apiClient.auth.logoutCreate(),
    onSettled: () => {
      queryClient.removeQueries()
      log.debug('Logout mutation settled, invalidating queries')
    },
  })
}