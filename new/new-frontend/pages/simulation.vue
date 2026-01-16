<template>
  <v-container class="fill-height simulation-container" fluid>
    <!-- 頂部控制列 (Figma 3:570) -->
    <v-row class="control-bar mb-4">
      <!-- Scene 區域 -->
      <v-col cols="12" md="3">
        <div class="control-section">
          <label class="section-label">Scene</label>
          <div class="d-flex align-center gap-2">
            <v-select
              v-model="selectedScene"
              :items="sceneOptions"
              placeholder="Select"
              density="compact"
              variant="outlined"
              hide-details
              class="scene-select"
            />
            <v-btn
              icon
              size="small"
              variant="text"
              :color="isPlaying ? 'primary' : 'grey'"
              @click="togglePlay"
            >
              <v-icon>{{ isPlaying ? 'mdi-pause-circle' : 'mdi-play-circle' }}</v-icon>
            </v-btn>
          </div>
        </div>
      </v-col>

      <!-- UE 區域 -->
      <v-col cols="6" md="2">
        <div class="control-section">
          <div class="d-flex align-center">
            <label class="section-label me-1">UE</label>
            <v-icon size="x-small" :color="ueVisible ? 'primary' : 'grey'">mdi-eye</v-icon>
          </div>
          <div class="d-flex align-center gap-2">
            <v-icon color="primary" size="large">mdi-walk</v-icon>
            <span class="count-text">{{ ueCount }}</span>
          </div>
        </div>
      </v-col>

      <!-- RU 區域 -->
      <v-col cols="6" md="2">
        <div class="control-section">
          <div class="d-flex align-center">
            <label class="section-label me-1">RU</label>
            <v-icon size="x-small" :color="ruVisible ? 'primary' : 'grey'">mdi-eye</v-icon>
          </div>
          <div class="d-flex align-center gap-2">
            <v-icon color="grey-darken-2" size="large">mdi-wifi</v-icon>
            <span class="count-text">{{ ruCount }}</span>
          </div>
        </div>
      </v-col>

      <!-- Heatmap 區域 -->
      <v-col cols="12" md="3">
        <div class="control-section">
          <div class="d-flex align-center">
            <label class="section-label me-1">Heatmap</label>
            <v-icon size="x-small" :color="heatmapEnabled ? 'error' : 'grey'">
              {{ heatmapEnabled ? 'mdi-eye' : 'mdi-eye-off' }}
            </v-icon>
          </div>
          <v-select
            v-model="selectedHeatmap"
            :items="heatmapOptions"
            density="compact"
            variant="outlined"
            hide-details
            class="heatmap-select"
          />
        </div>
      </v-col>
    </v-row>

    <!-- 地圖區域 -->
    <v-row class="flex-grow-1">
      <v-col cols="12" class="map-col">
        <div class="map-wrapper">
          <div id="simulationMap" ref="mapContainer" class="simulation-map" />
          <!-- 地圖覆蓋說明 -->
          <div class="map-legend">
            <div class="legend-item">
              <v-icon color="primary" size="small">mdi-walk</v-icon>
              <span>UE 使用者</span>
            </div>
            <div class="legend-item">
              <v-icon color="grey-darken-2" size="small">mdi-wifi</v-icon>
              <span>RU 基站</span>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- 儲存按鈕 -->
    <v-btn
      color="primary"
      class="save-btn"
      style="text-transform: capitalize"
      :loading="isSaving"
      @click="saveSimulation"
    >
      儲存
    </v-btn>

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

  // Scene 選項 (Figma 3:570)
  const sceneOptions = [
    { title: 'None', value: 'none' },
    { title: '上班', value: 'work_start' },
    { title: '下班', value: 'work_end' },
    { title: '上課1/隨機', value: 'class1_random' },
    { title: '上課2/同步', value: 'class2_sync' },
    { title: '上課3/不同步', value: 'class3_async' },
    { title: 'LiveDemo', value: 'live_demo' }
  ]

  // Heatmap 選項
  const heatmapOptions = [
    { title: 'Signal', value: 'signal' },
    { title: 'RSRP', value: 'rsrp' },
    { title: 'Throughput', value: 'throughput' }
  ]

  // 狀態
  const selectedScene = ref<string | null>(null)
  const selectedHeatmap = ref('signal')
  const isPlaying = ref(false)
  const ueVisible = ref(true)
  const ruVisible = ref(true)
  const heatmapEnabled = ref(false)
  const isSaving = ref(false)

  // 計數
  const ueCount = ref(30)
  const ruCount = ref(2)

  const snackbar = ref({
    show: false,
    text: '',
    color: 'info'
  })

  // 初始化地圖
  onMounted(() => {
    if (mapContainer.value) {
      initMap({
        container: mapContainer.value,
        center: [120.9960, 24.7875], // 交大工程四館附近
        zoom: 17,
        pitch: 45,
        projection: 'globe'
      })
    }
  })

  // 播放/暫停
  function togglePlay() {
    isPlaying.value = !isPlaying.value
    // TODO: 後端 API 尚未實作
    // 預期端點：POST /simulation/play 或 POST /simulation/pause
    console.warn('[TODO] Simulation play/pause API not implemented')
    snackbar.value = {
      show: true,
      text: isPlaying.value ? '模擬開始播放 (Placeholder)' : '模擬已暫停 (Placeholder)',
      color: 'warning'
    }
  }

  // 儲存模擬
  async function saveSimulation() {
    isSaving.value = true
    try {
      // TODO: 後端 API 尚未實作
      // 預期端點：POST /simulation/save
      // 預期請求體：{ scene, heatmap_type, ... }
      // 預期回應：{ success: boolean, simulation_id: number }

      await new Promise(resolve => setTimeout(resolve, 1500))

      console.warn('[TODO] Simulation save API not implemented', {
        scene: selectedScene.value,
        heatmap: selectedHeatmap.value
      })

      snackbar.value = {
        show: true,
        text: '模擬設定已儲存 (Placeholder)',
        color: 'warning'
      }
    } catch (err) {
      snackbar.value = {
        show: true,
        text: '儲存失敗，請稍後重試',
        color: 'error'
      }
      console.error('Save simulation failed:', err)
    } finally {
      isSaving.value = false
    }
  }

</script>

<style scoped>

.simulation-container {
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.control-bar {
  background: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.control-section {
  padding: 8px;
}

.section-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  display: block;
  margin-bottom: 4px;
}

.scene-select, .heatmap-select {
  max-width: 180px;
}

.count-text {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.map-col {
  padding: 0 12px;
}

.map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 450px;
  border-radius: 8px;
  overflow: hidden;
}

.simulation-map {
  width: 100%;
  height: 100%;
  min-height: 450px;
}

.map-legend {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(255,255,255,0.9);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.save-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 10;
}

/* 響應式 */
@media (max-width: 960px) {
  .control-bar {
    flex-wrap: wrap;
  }
  .scene-select, .heatmap-select {
    max-width: 100%;
  }
}

</style>
