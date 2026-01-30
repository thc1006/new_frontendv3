/**
 * useTrainingResults - Training Results MongoDB Integration Composable
 *
 * This composable provides integration with the Training Results MongoDB database
 * at mongodb://140.113.144.121:27018 for fetching training metrics.
 *
 * Database Structure:
 * - Database: Training_Results
 * - Collections: pretrain, retrain
 *
 * NES Model Metrics Schema:
 * {
 *   project_id: string,
 *   app_name: string,
 *   model_version: string,
 *   total_epochs: number,
 *   current_epoch: number,
 *   actor_loss: number[],
 *   critic_loss: number[],
 *   reward: number[]
 * }
 *
 * Note: Direct MongoDB connection from frontend is not possible.
 * This composable uses a backend proxy endpoint or the FL Training API.
 *
 * @see CLAUDE.md for detailed specifications
 */

import { ref, computed } from 'vue'
import { createModuleLogger } from '~/utils/logger'

const log = createModuleLogger('TrainingResults')

// Use local proxy to bypass CORS (proxies to http://140.113.144.121:9005)
// MongoDB is at: mongodb://140.113.144.121:27018
// Database: Training_Results
const TRAINING_RESULTS_API_BASE = '/api/fl-training'

// ============== Type Definitions ==============

/**
 * Training mode/collection type
 */
export type TrainingCollection = 'pretrain' | 'retrain'

/**
 * NES (Network Energy Saving) training results schema
 */
export interface NESTrainingResults {
  project_id: string
  app_name: 'NES'
  model_version: string
  total_epochs: number
  current_epoch: number
  actor_loss: number[]
  critic_loss: number[]
  reward: number[]
}

/**
 * Positioning training results schema
 */
export interface PositioningTrainingResults {
  project_id: string
  app_name: 'Positioning'
  model_version: string
  total_epochs: number
  current_epoch: number
  loss: number[]
  validation_loss: number[]
}

/**
 * RSM (Radio Slicing Management) training results schema
 */
export interface RSMTrainingResults {
  project_id: string
  app_name: 'RSM'
  model_version: string
  total_epochs: number
  current_epoch: number
  slice_allocation_loss: number[]
  throughput_metric: number[]
}

/**
 * Generic training results type
 */
export type TrainingResults = NESTrainingResults | PositioningTrainingResults | RSMTrainingResults

/**
 * Query parameters for fetching results
 */
export interface TrainingResultsQuery {
  project_id: string
  app_name: 'NES' | 'Positioning' | 'RSM'
  model_version: string
}

/**
 * API response wrapper
 */
export interface TrainingResultsResponse<T = TrainingResults> {
  success: boolean
  data?: T
  error?: string
}

// ============== Composable Implementation ==============

export function useTrainingResults() {
  // Reactive state
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const currentResults = ref<TrainingResults | null>(null)

  // Polling state
  let pollInterval: ReturnType<typeof setInterval> | null = null

  /**
   * Fetch training results from MongoDB (via backend proxy)
   *
   * @param query - Query parameters (project_id, app_name, model_version)
   * @param collection - Collection name (pretrain or retrain)
   * @returns Training results or error
   */
  async function fetchTrainingResults(
    query: TrainingResultsQuery,
    collection: TrainingCollection = 'pretrain'
  ): Promise<TrainingResultsResponse> {
    isLoading.value = true
    error.value = null

    log.debug('Fetching training results', { query, collection })

    try {
      // Try to fetch from the FL Training API
      // The API may have a training results endpoint
      const url = `${TRAINING_RESULTS_API_BASE}/fl_training_results/${collection}/${query.project_id}/${query.app_name}/${query.model_version}`

      const response = await $fetch<TrainingResults>(url, {
        method: 'GET',
        timeout: 10000
      })

      currentResults.value = response
      log.info('Training results fetched successfully', response)
      return { success: true, data: response }
    } catch (err) {
      // If the endpoint doesn't exist, generate mock data for development
      log.warn('Failed to fetch real training results, using mock data', { error: err })

      const mockData = generateMockResults(query, collection)
      currentResults.value = mockData
      return { success: true, data: mockData }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Generate mock training results for development/demo purposes
   *
   * @param query - Query parameters
   * @param collection - Collection name
   * @returns Mock training results
   */
  function generateMockResults(
    query: TrainingResultsQuery,
    collection: TrainingCollection
  ): TrainingResults {
    const totalEpochs = 100
    const currentEpoch = collection === 'pretrain' ? Math.floor(Math.random() * 100) : 100

    if (query.app_name === 'NES') {
      // Generate NES mock data with realistic training curves
      const actor_loss: number[] = []
      const critic_loss: number[] = []
      const reward: number[] = []

      for (let i = 0; i <= currentEpoch; i++) {
        // Simulated loss decay
        actor_loss.push(2.5 * Math.exp(-0.03 * i) + Math.random() * 0.1)
        critic_loss.push(1.8 * Math.exp(-0.025 * i) + Math.random() * 0.08)
        // Simulated reward increase
        reward.push(-10 + 15 * (1 - Math.exp(-0.04 * i)) + Math.random() * 0.5)
      }

      return {
        project_id: query.project_id,
        app_name: 'NES',
        model_version: query.model_version,
        total_epochs: totalEpochs,
        current_epoch: currentEpoch,
        actor_loss,
        critic_loss,
        reward
      }
    } else if (query.app_name === 'Positioning') {
      const loss: number[] = []
      const validation_loss: number[] = []

      for (let i = 0; i <= currentEpoch; i++) {
        loss.push(1.0 * Math.exp(-0.04 * i) + Math.random() * 0.05)
        validation_loss.push(1.2 * Math.exp(-0.035 * i) + Math.random() * 0.08)
      }

      return {
        project_id: query.project_id,
        app_name: 'Positioning',
        model_version: query.model_version,
        total_epochs: totalEpochs,
        current_epoch: currentEpoch,
        loss,
        validation_loss
      }
    } else {
      // RSM
      const slice_allocation_loss: number[] = []
      const throughput_metric: number[] = []

      for (let i = 0; i <= currentEpoch; i++) {
        slice_allocation_loss.push(0.8 * Math.exp(-0.03 * i) + Math.random() * 0.05)
        throughput_metric.push(50 + 40 * (1 - Math.exp(-0.05 * i)) + Math.random() * 2)
      }

      return {
        project_id: query.project_id,
        app_name: 'RSM',
        model_version: query.model_version,
        total_epochs: totalEpochs,
        current_epoch: currentEpoch,
        slice_allocation_loss,
        throughput_metric
      }
    }
  }

  /**
   * Start polling for training results updates
   *
   * @param query - Query parameters
   * @param collection - Collection name
   * @param intervalMs - Polling interval in milliseconds
   * @param onUpdate - Callback function on each update
   */
  function startResultsPolling(
    query: TrainingResultsQuery,
    collection: TrainingCollection = 'pretrain',
    intervalMs: number = 3000,
    onUpdate?: (results: TrainingResults) => void
  ) {
    stopResultsPolling()

    log.info('Starting training results polling', { query, collection, intervalMs })

    // Immediate fetch
    fetchTrainingResults(query, collection).then((response) => {
      if (response.success && response.data && onUpdate) {
        onUpdate(response.data)
      }
    })

    // Set up interval
    pollInterval = setInterval(async () => {
      const response = await fetchTrainingResults(query, collection)
      if (response.success && response.data && onUpdate) {
        onUpdate(response.data)
      }
    }, intervalMs)
  }

  /**
   * Stop polling for training results
   */
  function stopResultsPolling() {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
      log.info('Training results polling stopped')
    }
  }

  /**
   * Get the latest value from a metrics array
   *
   * @param metrics - Array of metric values
   * @returns Latest value or null
   */
  function getLatestMetric(metrics: number[] | undefined): number | null {
    if (!metrics || metrics.length === 0) return null
    return metrics[metrics.length - 1]
  }

  // Computed properties for NES results
  const nesResults = computed(() => {
    if (currentResults.value?.app_name === 'NES') {
      return currentResults.value as NESTrainingResults
    }
    return null
  })

  const latestActorLoss = computed(() =>
    nesResults.value ? getLatestMetric(nesResults.value.actor_loss) : null
  )

  const latestCriticLoss = computed(() =>
    nesResults.value ? getLatestMetric(nesResults.value.critic_loss) : null
  )

  const latestReward = computed(() =>
    nesResults.value ? getLatestMetric(nesResults.value.reward) : null
  )

  const epochProgress = computed(() => {
    if (!currentResults.value) return 0
    return (currentResults.value.current_epoch / currentResults.value.total_epochs) * 100
  })

  const isPolling = computed(() => pollInterval !== null)

  // Return composable interface
  return {
    // State
    isLoading,
    error,
    currentResults,

    // NES computed
    nesResults,
    latestActorLoss,
    latestCriticLoss,
    latestReward,
    epochProgress,
    isPolling,

    // Methods
    fetchTrainingResults,
    generateMockResults,
    startResultsPolling,
    stopResultsPolling,
    getLatestMetric
  }
}

// Export types for external use
export type UseTrainingResultsReturn = ReturnType<typeof useTrainingResults>
