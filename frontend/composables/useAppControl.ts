/**
 * App Control API Composable
 * Integrates with Computation Platform API at 140.113.144.121:8088
 */

interface AppCommand {
  project_id: string
  app_id: string
  version_id: string
}

interface RetrainCommand extends AppCommand {
  enabled: boolean
}

interface AppResponse {
  key?: string
  snapshot?: {
    instance_id: string
    logical_state: number
    state_id: number
    state_name: string
    created_at: string
    last_aitrplat_payload: unknown
  }
  docker?: {
    status: string
    container?: {
      id: string
      name: string
      image: string[]
      status: string
    }
  }
  removed?: string[]
  docker_delete?: {
    status: string
    containers: Array<{
      id: string
      name: string
      stopped: boolean
      removed: boolean
      error: string | null
    }>
  }
  docker_update?: {
    status: string
    steps: unknown
  }
  retrain_enabled?: boolean
}

export function useAppControl() {
  // Use local proxy to bypass CORS (proxies to http://140.113.144.121:8088)
  const APP_CONTROL_BASE_URL = '/api/app-control'

  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastResponse = ref<AppResponse | null>(null)

  /**
   * Create a new app instance
   */
  async function createApp(command: AppCommand): Promise<AppResponse> {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<AppResponse>(`${APP_CONTROL_BASE_URL}/app/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: command
      })
      lastResponse.value = response
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create app'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Enable an app instance
   */
  async function enableApp(command: AppCommand): Promise<AppResponse> {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<AppResponse>(`${APP_CONTROL_BASE_URL}/app/enable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: command
      })
      lastResponse.value = response
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to enable app'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update an app instance (change version)
   */
  async function updateApp(command: AppCommand): Promise<AppResponse> {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<AppResponse>(`${APP_CONTROL_BASE_URL}/app/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: command
      })
      lastResponse.value = response
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update app'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete an app instance
   */
  async function deleteApp(command: AppCommand): Promise<AppResponse> {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<AppResponse>(`${APP_CONTROL_BASE_URL}/app/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: command
      })
      lastResponse.value = response
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete app'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Retrain an app instance
   */
  async function retrainApp(command: RetrainCommand): Promise<AppResponse> {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<AppResponse>(`${APP_CONTROL_BASE_URL}/app/retrain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: command
      })
      lastResponse.value = response
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to retrain app'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Health check
   */
  async function healthCheck(): Promise<boolean> {
    try {
      await $fetch(`${APP_CONTROL_BASE_URL}/health`)
      return true
    } catch {
      return false
    }
  }

  /**
   * List all state machine instances
   */
  async function listInstances(): Promise<unknown> {
    try {
      const response = await $fetch(`${APP_CONTROL_BASE_URL}/sm/instances`)
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to list instances'
      throw err
    }
  }

  return {
    // State
    isLoading: readonly(isLoading),
    error: readonly(error),
    lastResponse: readonly(lastResponse),

    // Methods
    createApp,
    enableApp,
    updateApp,
    deleteApp,
    retrainApp,
    healthCheck,
    listInstances
  }
}
