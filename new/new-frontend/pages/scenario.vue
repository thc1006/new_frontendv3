<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="start">
      <v-col cols="12" sm="12" md="10" lg="8">
        <!-- page title (Figma 3:517) -->
        <h2 class="text-h4 font-weight-bold mb-6">Scenario</h2>

        <!-- 地圖與控制面板 -->
        <div class="scenario-wrapper">
          <!-- 左側控制面板 -->
          <div class="control-panel">
            <v-select
              v-model="selectedScenario"
              :items="scenarioOptions"
              label="選擇情境"
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

          <!-- 右側地圖區域 -->
          <div class="map-area">
            <div id="scenarioMap" ref="mapContainer" class="map-container" />
            <div class="map-overlay">
              <span class="overlay-text">小人走動</span>
              <span class="overlay-subtext">(固定map)</span>
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

  // 情境選項 (Figma 3:517)
  const scenarioOptions = [
    { title: 'None', value: 'none' },
    { title: '上班', value: 'work_start' },
    { title: '下班', value: 'work_end' },
    { title: '上課1/隨機', value: 'class1_random' },
    { title: '上課2/同步', value: 'class2_sync' },
    { title: '上課3/不同步', value: 'class3_async' },
    { title: 'LiveDemo', value: 'live_demo' }
  ]

  const selectedScenario = ref<string | null>(null)
  const isLoading = ref(false)
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
        center: [120.9738, 24.7892], // 新竹市中心
        zoom: 15,
        pitch: 0
      })
    }
  })

  // 套用情境
  async function applyScenario() {
    if (!selectedScenario.value || selectedScenario.value === 'none') {
      snackbar.value = {
        show: true,
        text: '請選擇一個情境',
        color: 'warning'
      }
      return
    }

    isLoading.value = true
    try {
      // TODO: 後端 API 尚未實作
      // 預期端點：POST /scenario/apply
      // 預期請求體：{ scenario: string }
      // 預期回應：{ success: boolean, message: string }

      // Placeholder: 模擬 API 延遲
      await new Promise(resolve => setTimeout(resolve, 1500))

      console.warn('[TODO] Scenario API not implemented', {
        scenario: selectedScenario.value
      })

      snackbar.value = {
        show: true,
        text: `情境「${getScenarioLabel(selectedScenario.value)}」已套用 (Placeholder)`,
        color: 'warning'
      }
    } catch (err) {
      snackbar.value = {
        show: true,
        text: '套用情境失敗，請稍後重試',
        color: 'error'
      }
      console.error('Apply scenario failed:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 取得情境中文名稱
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

/* 響應式調整 */
@media (max-width: 768px) {
  .scenario-wrapper {
    flex-direction: column;
  }
  .control-panel {
    width: 100%;
  }
}

</style>
