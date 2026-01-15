<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="start">
      <v-col cols="12" sm="12" md="10" lg="8">
        <!-- page title (Figma 3:517) -->
        <h2 class="text-h4 font-weight-bold mb-6">Scenario</h2>

        <!-- Map and control panel -->
        <div class="scenario-wrapper">
          <!-- Left: Control panel -->
          <div class="control-panel">
            <v-select
              v-model="selectedScenario"
              :items="scenarioOptions"
              label="Select scenario"
              density="comfortable"
              variant="outlined"
              class="mb-4"
            />

            <v-btn
              color="primary"
              class="set-btn"
              style="text-transform: capitalize"
              :loading="isLoading"
              :disabled="!selectedScenario"
              @click="applyScenario"
            >
              set
            </v-btn>
          </div>

          <!-- Right: Map area -->
          <div class="map-area">
            <div id="scenarioMap" ref="mapContainer" class="map-container" />
            <div class="map-overlay">
              <span class="overlay-text">People walking</span>
              <span class="overlay-subtext">(fixed map)</span>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
    >
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">

  import 'mapbox-gl/dist/mapbox-gl.css'

  import { ref, onMounted } from 'vue'
  import { useMapbox } from '~/composables/useMapbox'

  const { initMap } = useMapbox()
  const mapContainer = ref<HTMLDivElement | null>(null)

  // Scenario options (Figma 3:517)
  const scenarioOptions = [
    { title: 'None', value: 'none' },
    { title: 'Work start', value: 'work_start' },
    { title: 'Work end', value: 'work_end' },
    { title: 'Class 1 / Random', value: 'class1_random' },
    { title: 'Class 2 / Sync', value: 'class2_sync' },
    { title: 'Class 3 / Async', value: 'class3_async' },
    { title: 'LiveDemo', value: 'live_demo' }
  ]

  const selectedScenario = ref<string | null>(null)
  const isLoading = ref(false)
  const snackbar = ref({
    show: false,
    text: '',
    color: 'info'
  })

  // Initialize map
  onMounted(() => {
    if (mapContainer.value) {
      initMap({
        container: mapContainer.value,
        center: [120.9738, 24.7892], // Hsinchu city center
        zoom: 15,
        pitch: 0
      })
    }
  })

  // Apply scenario
  async function applyScenario() {
    if (!selectedScenario.value || selectedScenario.value === 'none') {
      snackbar.value = {
        show: true,
        text: 'Please select a scenario',
        color: 'warning'
      }
      return
    }

    isLoading.value = true
    try {
      // TODO: Backend API not yet implemented
      // Expected endpoint: POST /scenario/apply
      // Expected request body: { scenario: string }
      // Expected response: { success: boolean, message: string }

      // Placeholder: Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      console.warn('[TODO] Scenario API not implemented', {
        scenario: selectedScenario.value
      })

      snackbar.value = {
        show: true,
        text: `Scenario "${getScenarioLabel(selectedScenario.value)}" applied (Placeholder)`,
        color: 'warning'
      }
    } catch (err) {
      snackbar.value = {
        show: true,
        text: 'Failed to apply scenario, please try again later',
        color: 'error'
      }
      console.error('Apply scenario failed:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Get scenario display name
  function getScenarioLabel(value: string): string {
    const option = scenarioOptions.find(o => o.value === value)
    return option?.title || value
  }

</script>

<style scoped>

.scenario-wrapper {
  display: flex;
  gap: 16px;
  width: 100%;
  min-height: 500px;
}

.control-panel {
  width: 200px;
  min-width: 200px;
  display: flex;
  flex-direction: column;
}

.set-btn {
  width: 100%;
}

.map-area {
  flex: 1;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.map-container {
  width: 100%;
  height: 100%;
  min-height: 500px;
}

.map-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.overlay-text {
  display: block;
  font-size: 32px;
  font-weight: bold;
  color: #f5a623;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.overlay-subtext {
  display: block;
  font-size: 20px;
  color: #f5a623;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .scenario-wrapper {
    flex-direction: column;
  }
  .control-panel {
    width: 100%;
  }
}

</style>
