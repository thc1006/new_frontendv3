/**
 * useFlTraining - Federated Learning Training API Composable
 *
 * This composable provides integration with the WiSDON AI Training Platform API
 * at http://140.113.144.121:9005 for managing FL training tasks.
 *
 * API Endpoints:
 * - POST /fl_training_task/push - Start a new training task
 * - POST /fl_training_task/delete - Stop/delete a training task
 * - GET /fl_training_task/show_task_status/{project_id}/{app_name}/{model_version}/{mode} - Get task status
 * - GET /fl_controller/show_status - Get ASM controller status (developer mode)
 *
 * @see CLAUDE.md for detailed API specifications
 */

import { ref, computed } from 'vue'
import { createModuleLogger } from '~/utils/logger'

const log = createModuleLogger('FlTraining')

// Use local proxy to bypass CORS (proxies to http://140.113.144.121:9005)
// Note: API is at port 3032 during development, will change to 9005 in production
const FL_TRAINING_BASE_URL = '/api/fl-training'

// ============== Type Definitions ==============

/**
 * Available AI application names for training
 */
export type AppName = 'NES' | 'Positioning' | 'RSM'

/**
 * Training mode options
 */
export type TrainingMode = 'pre train' | 'retrain'

/**
 * Task status values returned by the API
 */
export type TaskStatus = 'running' | 'waiting' | 'not in queue'

/**
 * ASM Controller states
 */
export type ControllerState = 'IDLE' | 'StartFlowerApp' | 'Termination' | 'InternalError' | 'NullState'

/**
 * Training task push request structure
 */
export interface FlTrainingPushRequest {
  request: {
    project_id: string
    app_name: AppName
    model_version: string
    mode: TrainingMode
    timestamp: string
  }
  config: {
    project_id: string
    app_name: AppName
    model_version: string
    mode: TrainingMode
    epochs: number
    learning_rate: number
    timestamp: string
  }
}

/**
 * Training task delete request structure
 */
export interface FlTrainingDeleteRequest {
  project_id: string
  app_name: AppName
  model_version: string
  mode: TrainingMode
  timestamp: string
}

/**
 * Task status response structure
 */
export interface FlTaskStatusResponse {
  project_id: string
  app_name: string
  model_version: string
  mode: string
  status: TaskStatus
}

/**
 * Controller status response structure (for developer mode)
 */
export interface FlControllerStatusResponse {
  current_state: ControllerState
  is_activate: boolean
  is_final: boolean
}

/**
 * Generic API response wrapper
 */
export interface FlApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ============== Composable Implementation ==============

export function useFlTraining() {
  // Reactive state
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastTaskStatus = ref<FlTaskStatusResponse | null>(null)
  const lastControllerStatus = ref<FlControllerStatusResponse | null>(null)

  // Status polling interval reference
  let statusPollInterval: ReturnType<typeof setInterval> | null = null

  /**
   * Generate ISO timestamp for API requests
   */
  function generateTimestamp(): string {
    return new Date().toISOString()
  }

  /**
   * Start a new FL training task
   *
   * @param projectId - Project identifier
   * @param appName - AI application name (NES, Positioning, RSM)
   * @param modelVersion - Model version string
   * @param mode - Training mode (pre train or retrain)
   * @param epochs - Number of training epochs
   * @param learningRate - Learning rate for training
   * @returns API response with success status
   */
  async function pushTrainingTask(
    projectId: string,
    appName: AppName,
    modelVersion: string,
    mode: TrainingMode,
    epochs: number,
    learningRate: number
  ): Promise<FlApiResponse> {
    isLoading.value = true
    error.value = null

    const timestamp = generateTimestamp()

    const requestBody: FlTrainingPushRequest = {
      request: {
        project_id: projectId,
        app_name: appName,
        model_version: modelVersion,
        mode: mode,
        timestamp: timestamp
      },
      config: {
        project_id: projectId,
        app_name: appName,
        model_version: modelVersion,
        mode: mode,
        epochs: epochs,
        learning_rate: learningRate,
        timestamp: timestamp
      }
    }

    log.info('Pushing training task', { projectId, appName, modelVersion, mode, epochs, learningRate })

    try {
      const response = await $fetch<FlApiResponse>(`${FL_TRAINING_BASE_URL}/fl_training_task/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: requestBody
      })

      log.info('Training task pushed successfully', response)
      return { success: true, data: response }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to push training task'
      error.value = errorMessage
      log.error('Failed to push training task', { error: err })
      return { success: false, error: errorMessage }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Stop/delete an existing FL training task
   *
   * @param projectId - Project identifier
   * @param appName - AI application name
   * @param modelVersion - Model version string
   * @param mode - Training mode
   * @returns API response with success status
   */
  async function deleteTrainingTask(
    projectId: string,
    appName: AppName,
    modelVersion: string,
    mode: TrainingMode
  ): Promise<FlApiResponse> {
    isLoading.value = true
    error.value = null

    const requestBody: FlTrainingDeleteRequest = {
      project_id: projectId,
      app_name: appName,
      model_version: modelVersion,
      mode: mode,
      timestamp: generateTimestamp()
    }

    log.info('Deleting training task', { projectId, appName, modelVersion, mode })

    try {
      const response = await $fetch<FlApiResponse>(`${FL_TRAINING_BASE_URL}/fl_training_task/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: requestBody
      })

      log.info('Training task deleted successfully', response)
      return { success: true, data: response }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete training task'
      error.value = errorMessage
      log.error('Failed to delete training task', { error: err })
      return { success: false, error: errorMessage }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get the status of a training task
   *
   * @param projectId - Project identifier
   * @param appName - AI application name
   * @param modelVersion - Model version string
   * @param mode - Training mode
   * @returns Task status response
   */
  async function getTaskStatus(
    projectId: string,
    appName: AppName,
    modelVersion: string,
    mode: TrainingMode
  ): Promise<FlApiResponse<FlTaskStatusResponse>> {
    error.value = null

    // Build URL path with encoded parameters
    const encodedMode = mode === 'pre train' ? 'pretrain' : mode
    const url = `${FL_TRAINING_BASE_URL}/fl_training_task/show_task_status/${encodeURIComponent(projectId)}/${encodeURIComponent(appName)}/${encodeURIComponent(modelVersion)}/${encodeURIComponent(encodedMode)}`

    log.debug('Fetching task status', { projectId, appName, modelVersion, mode, url })

    try {
      const response = await $fetch<FlTaskStatusResponse>(url, {
        method: 'GET'
      })

      lastTaskStatus.value = response
      log.debug('Task status received', response)
      return { success: true, data: response }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get task status'
      error.value = errorMessage
      log.error('Failed to get task status', { error: err })
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Get the FL controller (ASM) status
   * This is intended for developer mode / debugging purposes
   *
   * @returns Controller status response
   */
  async function getControllerStatus(): Promise<FlApiResponse<FlControllerStatusResponse>> {
    error.value = null

    log.debug('Fetching controller status')

    try {
      const response = await $fetch<FlControllerStatusResponse>(`${FL_TRAINING_BASE_URL}/fl_controller/show_status`, {
        method: 'GET'
      })

      lastControllerStatus.value = response
      log.debug('Controller status received', response)
      return { success: true, data: response }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get controller status'
      error.value = errorMessage
      log.warn('Failed to get controller status (ASM may be in error state)', { error: err })
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Start polling for task status at regular intervals
   *
   * @param projectId - Project identifier
   * @param appName - AI application name
   * @param modelVersion - Model version string
   * @param mode - Training mode
   * @param intervalMs - Polling interval in milliseconds (default: 5000)
   * @param onStatusUpdate - Callback function called on each status update
   */
  function startStatusPolling(
    projectId: string,
    appName: AppName,
    modelVersion: string,
    mode: TrainingMode,
    intervalMs: number = 5000,
    onStatusUpdate?: (status: FlTaskStatusResponse) => void
  ) {
    // Stop any existing polling
    stopStatusPolling()

    log.info('Starting status polling', { projectId, appName, modelVersion, mode, intervalMs })

    // Immediately fetch status once
    getTaskStatus(projectId, appName, modelVersion, mode).then((result) => {
      if (result.success && result.data && onStatusUpdate) {
        onStatusUpdate(result.data)
      }
    })

    // Set up interval for continuous polling
    statusPollInterval = setInterval(async () => {
      const result = await getTaskStatus(projectId, appName, modelVersion, mode)
      if (result.success && result.data && onStatusUpdate) {
        onStatusUpdate(result.data)
      }
    }, intervalMs)
  }

  /**
   * Stop the status polling interval
   */
  function stopStatusPolling() {
    if (statusPollInterval) {
      clearInterval(statusPollInterval)
      statusPollInterval = null
      log.info('Status polling stopped')
    }
  }

  /**
   * Check if the FL Training API server is reachable
   *
   * @returns Health check result
   */
  async function healthCheck(): Promise<FlApiResponse<{ message: string }>> {
    try {
      const response = await $fetch<{ message: string }>(`${FL_TRAINING_BASE_URL}/`, {
        method: 'GET'
      })
      log.info('FL Training API health check passed', response)
      return { success: true, data: response }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'FL Training API is not reachable'
      log.error('FL Training API health check failed', { error: err })
      return { success: false, error: errorMessage }
    }
  }

  // Computed properties
  const isPolling = computed(() => statusPollInterval !== null)
  const currentTaskStatus = computed(() => lastTaskStatus.value?.status || null)
  const isTaskRunning = computed(() => lastTaskStatus.value?.status === 'running')
  const isTaskWaiting = computed(() => lastTaskStatus.value?.status === 'waiting')
  const isTaskNotInQueue = computed(() => lastTaskStatus.value?.status === 'not in queue')

  // Return composable interface
  return {
    // State
    isLoading,
    error,
    lastTaskStatus,
    lastControllerStatus,

    // Computed
    isPolling,
    currentTaskStatus,
    isTaskRunning,
    isTaskWaiting,
    isTaskNotInQueue,

    // Methods
    pushTrainingTask,
    deleteTrainingTask,
    getTaskStatus,
    getControllerStatus,
    startStatusPolling,
    stopStatusPolling,
    healthCheck,
    generateTimestamp
  }
}

// Export types for external use
export type UseFlTrainingReturn = ReturnType<typeof useFlTraining>
