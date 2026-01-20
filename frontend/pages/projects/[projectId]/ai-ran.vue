<template>
  <div class="ai-ran-page">
    <div class="page-header">
      <h1 class="page-title">AI-RAN Applications</h1>
      <!-- AI-RAN 無警告橫幅 (與 AI Simulator 不同) -->
    </div>

    <div class="page-content">
      <!-- 左側面板：Model List 或 NES 控制面板 -->
      <div class="left-panel">
        <!-- Model List 視圖 (Figma 277:1256) -->
        <template v-if="!selectedModel">
          <div class="panel-header">Model list</div>
          <div class="model-buttons">
            <v-btn
              v-for="model in modelList"
              :key="model.id"
              color="success"
              variant="elevated"
              class="model-btn"
              @click="selectModel(model.id)"
            >
              {{ model.name }}
            </v-btn>
          </div>
        </template>

        <!-- NES Model 控制面板 (Figma 277:1486, 277:1597) -->
        <template v-else-if="selectedModel === 'nes'">
          <div class="panel-header">NES</div>
          <div class="nes-controls">
            <!-- Model 選擇器 (AI-RAN 用 Model，非 Scene) -->
            <v-select
              v-model="nesModelSelect"
              :items="nesModelOptions"
              label=""
              density="compact"
              variant="outlined"
              class="model-select"
              hide-details
            />
            <!-- Finetune 按鈕 -->
            <v-btn
              :color="nesFinetuneStatus !== 'idle' ? 'success' : 'default'"
              :disabled="nesFinetuneStatus === 'running' || !nesModelSelect"
              variant="elevated"
              class="control-btn"
              @click="startNesFinetune"
            >
              Finetune
            </v-btn>
            <!-- Enable 按鈕 -->
            <v-btn
              :color="nesEnableMode ? 'warning' : 'default'"
              :disabled="nesFinetuneStatus !== 'finish'"
              variant="elevated"
              class="control-btn"
              @click="enableNesModel"
            >
              Enable
            </v-btn>
            <!-- Re-train 按鈕 -->
            <v-btn
              color="default"
              :disabled="!nesEnableMode"
              variant="elevated"
              class="control-btn retrain-btn"
              @click="startNesRetrain"
            >
              Re-train
            </v-btn>
          </div>
          <div class="panel-actions">
            <v-btn color="primary" variant="outlined" class="action-btn" @click="goBack">
              BACK
            </v-btn>
            <v-btn
              v-if="nesFinetuneStatus === 'running'"
              color="error"
              variant="elevated"
              class="action-btn start-btn"
              @click="stopNesFinetune"
            >
              STOP
            </v-btn>
            <v-btn
              v-else-if="nesFinetuneStatus === 'finish'"
              color="primary"
              variant="elevated"
              class="action-btn start-btn"
              @click="updateNesFinetuneModel"
            >
              Update
            </v-btn>
            <v-btn
              v-else
              color="primary"
              variant="elevated"
              class="action-btn start-btn"
              :disabled="!nesModelSelect"
              @click="startNesFinetune"
            >
              <v-icon left>mdi-play</v-icon>
              START
            </v-btn>
          </div>
        </template>

        <!-- Positioning Model 控制面板 (Figma 277:993, 277:1032) -->
        <template v-else-if="selectedModel === 'positioning'">
          <div class="panel-header">Positioning</div>
          <div class="positioning-controls">
            <v-select
              v-model="posModelSelect"
              :items="posModelOptions"
              label=""
              density="compact"
              variant="outlined"
              class="model-select"
              hide-details
            />
            <!-- Finetune 按鈕 -->
            <v-btn
              :color="posFinetuneStatus !== 'idle' ? 'success' : 'success'"
              :disabled="posFinetuneStatus === 'running' || !posModelSelect"
              variant="elevated"
              class="control-btn"
              @click="startPosFinetune"
            >
              Finetune
            </v-btn>
            <!-- Enable 按鈕 -->
            <v-btn
              :color="posEnableMode ? 'warning' : 'default'"
              :disabled="posFinetuneStatus !== 'finish'"
              variant="elevated"
              class="control-btn"
              @click="enablePosModel"
            >
              Enable
            </v-btn>
            <!-- Re-train 按鈕 -->
            <v-btn
              color="default"
              :disabled="!posEnableMode"
              variant="elevated"
              class="control-btn retrain-btn"
              @click="startPosRetrain"
            >
              Re-train
            </v-btn>
          </div>
          <div class="panel-actions">
            <v-btn color="primary" variant="outlined" class="action-btn" @click="goBack">
              BACK
            </v-btn>
            <v-btn
              v-if="posFinetuneStatus === 'running'"
              color="error"
              variant="elevated"
              class="action-btn stop-btn"
              @click="stopPosFinetune"
            >
              STOP
            </v-btn>
            <v-btn
              v-else-if="posFinetuneStatus === 'finish'"
              color="warning"
              variant="elevated"
              class="action-btn"
              @click="updatePosFinetuneModel"
            >
              Update
            </v-btn>
            <v-btn
              v-else
              color="primary"
              variant="elevated"
              class="action-btn start-btn"
              :disabled="!posModelSelect"
              @click="startPosFinetune"
            >
              <v-icon left>mdi-play</v-icon>
              START
            </v-btn>
          </div>
        </template>

        <!-- 其他模型 Placeholder -->
        <template v-else>
          <div class="panel-header">{{ selectedModelName }}</div>
          <div class="placeholder-content">
            <p>{{ selectedModelName }} 功能開發中...</p>
          </div>
          <div class="panel-actions">
            <v-btn color="primary" variant="outlined" class="action-btn" @click="goBack">
              BACK
            </v-btn>
          </div>
        </template>
      </div>

      <!-- 右側面板：Project (AI-RAN 用 Project，非 Scene) -->
      <div class="right-panel">
        <!-- NES 訓練中顯示 Training Process -->
        <template v-if="selectedModel === 'nes' && (nesFinetuneStatus === 'running' || nesFinetuneStatus === 'finish')">
          <div class="panel-header">Training Process</div>
          <div class="training-status" :class="nesFinetuneStatus">
            Training Status : {{ nesFinetuneStatus === 'running' ? 'Running' : 'Finish' }}
          </div>
          <div class="training-content">
            <div class="charts-container">
              <div class="chart-wrapper">
                <canvas ref="rewardChartRef" />
              </div>
              <div class="training-info">
                <div class="info-row highlight">
                  <span class="label">Loss Function :</span>
                  <span class="value">Self-defined</span>
                </div>
                <div class="info-row">
                  <span class="label">Epoch:</span>
                  <span class="value">{{ currentEpoch }}/{{ totalEpochs }}</span>
                </div>
                <div class="results-section">
                  <div class="results-title">Training Results:</div>
                  <div class="result-row">
                    <span class="label">Reward:</span>
                    <span class="value">{{ trainingResults.reward.toFixed(2) }}</span>
                  </div>
                  <div class="result-row">
                    <span class="label">Actor Loss:</span>
                    <span class="value">{{ trainingResults.actorLoss.toFixed(1) }}</span>
                  </div>
                  <div class="result-row">
                    <span class="label">Critic Loss:</span>
                    <span class="value">{{ trainingResults.criticLoss.toFixed(3) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="loss-charts">
              <div class="chart-wrapper small">
                <canvas ref="criticLossChartRef" />
              </div>
              <div class="chart-wrapper small">
                <canvas ref="actorLossChartRef" />
              </div>
            </div>
          </div>
        </template>

        <!-- Positioning 訓練中顯示 Training Process (Figma 277:993, 277:1032) -->
        <template v-else-if="selectedModel === 'positioning' && (posFinetuneStatus === 'running' || posFinetuneStatus === 'finish')">
          <div class="panel-header">Training Process</div>
          <div class="training-status" :class="posFinetuneStatus">
            Training Status : {{ posFinetuneStatus === 'running' ? 'running' : 'Finish' }}
          </div>
          <div class="training-content pos-training">
            <div class="info-row highlight mse-label">
              <span class="label">Loss Function :</span>
              <span class="value mse">MSE</span>
            </div>
            <div class="pos-chart-container">
              <div class="chart-wrapper large">
                <canvas ref="posLossChartRef" />
              </div>
              <div class="pos-training-info">
                <div class="info-row">
                  <span class="label">Epoch:</span>
                  <span class="value">{{ posCurrentEpoch }}/{{ posTotalEpochs }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Training Loss :</span>
                  <span class="value">{{ posTrainingResults.trainingLoss.toFixed(2) }}</span>
                </div>
                <div class="info-row">
                  <span class="label">Validation Loss :</span>
                  <span class="value">{{ posTrainingResults.validationLoss.toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 預設顯示 Project 地圖 -->
        <template v-else>
          <div class="panel-header">Project</div>
          <div class="map-container">
            <div id="aiRanMapContainer" class="map-view" />
            <!-- 地圖控制元件 -->
            <div class="map-controls">
              <div class="legend-item">
                <span class="legend-icon gnb">
                  <v-icon size="16">mdi-wifi</v-icon>
                </span>
                <span>gNB</span>
              </div>
              <div class="legend-item">
                <span class="legend-icon ue">
                  <v-icon size="16">mdi-account</v-icon>
                </span>
                <span>UE</span>
              </div>
              <div class="heatmap-toggle">
                <span>Heatmap</span>
                <v-switch
                  v-model="showHeatmap"
                  color="error"
                  hide-details
                  density="compact"
                />
              </div>
            </div>
            <!-- 色標 -->
            <div v-show="showHeatmap" class="color-bar-vertical">
              <div class="color-bar-gradient" />
              <div class="color-bar-labels">
                <span>-55 dBm</span>
                <span>-120 dBm</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
  import { Chart, registerables } from 'chart.js'
  import mapboxgl from 'mapbox-gl'
  import 'mapbox-gl/dist/mapbox-gl.css'
  import { createModuleLogger } from '~/utils/logger'

  const log = createModuleLogger('AIRAN')

  // 註冊 Chart.js 組件
  Chart.register(...registerables)
  log.lifecycle('setup:start')

  // Mapbox token
  const MAPBOX_TOKEN = 'pk.eyJ1IjoibmV3c2xhYiIsImEiOiJjbDdkNGpyYmQwaDF5M29tcWYzNzNwcGd2In0.2D21D19iczQMljmu7mDnog'

  // Model 清單 (與 AI Simulator 相同)
  const modelList = [
    { id: 'nes', name: 'NES' },
    { id: 'positioning', name: 'Positioning' },
    { id: 'im', name: 'IM' },
    { id: 'mro', name: 'MRO' },
    { id: 'rs', name: 'RS' },
    { id: 'bc', name: 'BC' }
  ]

  // 狀態
  const selectedModel = ref<string | null>(null)
  const showHeatmap = ref(true)

  // NES Model 狀態 (AI-RAN 用 Model，非 Scene)
  const nesModelSelect = ref<string | null>(null)
  const nesModelOptions = ['Model 1', 'Model 2', 'Model 3', 'Model 4']
  const nesFinetuneStatus = ref<'idle' | 'running' | 'finish'>('idle')
  const nesEnableMode = ref(false)

  // Positioning Model 狀態 (Figma 277:993, 277:1032)
  const posModelSelect = ref<string | null>(null)
  const posModelOptions = ['Model 1', 'Model 2', 'Model 3', 'Model 4']
  const posFinetuneStatus = ref<'idle' | 'running' | 'finish'>('idle')
  const posEnableMode = ref(false)

  // NES 訓練相關
  const currentEpoch = ref(0)
  const totalEpochs = ref(1000)
  const trainingResults = ref({
    reward: 0.98,
    actorLoss: -2.3,
    criticLoss: 0.002
  })

  // Positioning 訓練相關 (MSE Loss)
  const posCurrentEpoch = ref(0)
  const posTotalEpochs = ref(500)
  const posTrainingResults = ref({
    trainingLoss: 0.09,
    validationLoss: 0.09
  })

  // NES Chart refs
  const rewardChartRef = ref<HTMLCanvasElement | null>(null)
  const criticLossChartRef = ref<HTMLCanvasElement | null>(null)
  const actorLossChartRef = ref<HTMLCanvasElement | null>(null)
  let rewardChart: Chart | null = null
  let criticLossChart: Chart | null = null
  let actorLossChart: Chart | null = null

  // Positioning Chart refs (MSE Loss 雙線圖)
  const posLossChartRef = ref<HTMLCanvasElement | null>(null)
  let posLossChart: Chart | null = null

  // Map
  let map: mapboxgl.Map | null = null
  const mapMarkers: mapboxgl.Marker[] = []

  // 訓練定時器
  let finetuneInterval: ReturnType<typeof setInterval> | null = null
  let posFinetuneInterval: ReturnType<typeof setInterval> | null = null

  // Computed
  const selectedModelName = computed(() => {
    const model = modelList.find(m => m.id === selectedModel.value)
    return model ? model.name : ''
  })

  // 選擇模型
  function selectModel(modelId: string) {
    selectedModel.value = modelId
  }

  // 返回 Model List
  function goBack() {
    selectedModel.value = null
    // 重置 NES 狀態
    nesModelSelect.value = null
    nesFinetuneStatus.value = 'idle'
    nesEnableMode.value = false
    // 重置 Positioning 狀態
    posModelSelect.value = null
    posFinetuneStatus.value = 'idle'
    posEnableMode.value = false

    // 清除訓練定時器
    if (finetuneInterval) {
      clearInterval(finetuneInterval)
      finetuneInterval = null
    }
    if (posFinetuneInterval) {
      clearInterval(posFinetuneInterval)
      posFinetuneInterval = null
    }

    // 重新初始化地圖
    nextTick(() => {
      initMap()
    })
  }

  // NES Finetune 操作
  function startNesFinetune() {
    if (!nesModelSelect.value) return

    nesFinetuneStatus.value = 'running'
    currentEpoch.value = 0

    // 初始化訓練圖表
    nextTick(() => {
      initTrainingCharts()
    })

    // 模擬訓練進度
    finetuneInterval = setInterval(() => {
      currentEpoch.value += 10
      updateTrainingCharts()

      if (currentEpoch.value >= totalEpochs.value) {
        nesFinetuneStatus.value = 'finish'
        if (finetuneInterval) {
          clearInterval(finetuneInterval)
          finetuneInterval = null
        }
      }
    }, 100)
  }

  function stopNesFinetune() {
    if (finetuneInterval) {
      clearInterval(finetuneInterval)
      finetuneInterval = null
    }
    nesFinetuneStatus.value = 'idle'
  }

  function updateNesFinetuneModel() {
    nesEnableMode.value = true
  }

  function enableNesModel() {
    nesEnableMode.value = true
  }

  function startNesRetrain() {
    nesEnableMode.value = false
    nesFinetuneStatus.value = 'idle'
    currentEpoch.value = 0
  }

  // Positioning Finetune 操作 (Figma 277:993, 277:1032)
  function startPosFinetune() {
    if (!posModelSelect.value) return

    posFinetuneStatus.value = 'running'
    posCurrentEpoch.value = 0

    // 初始化 MSE Loss 圖表
    nextTick(() => {
      initPosLossChart()
    })

    // 模擬訓練進度
    posFinetuneInterval = setInterval(() => {
      posCurrentEpoch.value += 5
      updatePosLossChart()

      if (posCurrentEpoch.value >= posTotalEpochs.value) {
        posFinetuneStatus.value = 'finish'
        if (posFinetuneInterval) {
          clearInterval(posFinetuneInterval)
          posFinetuneInterval = null
        }
      }
    }, 100)
  }

  function stopPosFinetune() {
    if (posFinetuneInterval) {
      clearInterval(posFinetuneInterval)
      posFinetuneInterval = null
    }
    posFinetuneStatus.value = 'idle'
  }

  function updatePosFinetuneModel() {
    posEnableMode.value = true
  }

  function enablePosModel() {
    posEnableMode.value = true
  }

  function startPosRetrain() {
    posEnableMode.value = false
    posFinetuneStatus.value = 'idle'
    posCurrentEpoch.value = 0
  }

  // 初始化 Positioning MSE Loss 圖表 (雙線：training + validation)
  function initPosLossChart() {
    if (posLossChartRef.value) {
      if (posLossChart) posLossChart.destroy()
      posLossChart = new Chart(posLossChartRef.value, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: 'training',
              data: [],
              borderColor: '#2196F3',
              backgroundColor: 'transparent',
              tension: 0.1,
              borderWidth: 2
            },
            {
              label: 'validation',
              data: [],
              borderColor: '#FF9800',
              backgroundColor: 'transparent',
              tension: 0.1,
              borderWidth: 2,
              borderDash: [5, 5]
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: 'loss', position: 'top' },
            legend: { display: true, position: 'top' }
          },
          scales: {
            x: { title: { display: true, text: 'Epoch' } },
            y: { title: { display: true, text: 'loss' }, min: 0, max: 0.6 }
          }
        }
      })
    }
  }

  // 更新 Positioning MSE Loss 圖表
  function updatePosLossChart() {
    const epoch = posCurrentEpoch.value

    if (posLossChart) {
      posLossChart.data.labels?.push(epoch.toString())
      // 模擬 training loss 下降曲線
      const trainingLoss = 0.5 * Math.exp(-epoch / 100) + 0.05 + Math.random() * 0.02
      // 模擬 validation loss (略高於 training loss)
      const validationLoss = 0.5 * Math.exp(-epoch / 120) + 0.15 + Math.random() * 0.03
      posLossChart.data.datasets[0].data.push(trainingLoss)
      posLossChart.data.datasets[1].data.push(validationLoss)
      posLossChart.update('none')

      // 更新最終結果
      posTrainingResults.value.trainingLoss = trainingLoss
      posTrainingResults.value.validationLoss = validationLoss
    }
  }

  // 初始化 NES 訓練圖表
  function initTrainingCharts() {
    // Reward Chart
    if (rewardChartRef.value) {
      if (rewardChart) rewardChart.destroy()
      rewardChart = new Chart(rewardChartRef.value, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: 'reward',
              data: [],
              borderColor: '#FFD700',
              backgroundColor: 'transparent',
              tension: 0.1
            },
            {
              label: 'reward (MA10)',
              data: [],
              borderColor: '#00CED1',
              backgroundColor: 'transparent',
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: 'Reward over Epochs (with MA10)' }
          },
          scales: {
            x: { title: { display: true, text: 'epoch' } },
            y: { title: { display: true, text: 'value' }, min: 0.4, max: 1.1 }
          }
        }
      })
    }

    // Critic Loss Chart
    if (criticLossChartRef.value) {
      if (criticLossChart) criticLossChart.destroy()
      criticLossChart = new Chart(criticLossChartRef.value, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Critic Loss',
            data: [],
            borderColor: '#FFA500',
            backgroundColor: 'transparent',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: 'Critic Loss over Epochs' }
          },
          scales: {
            x: { title: { display: true, text: 'epoch' } },
            y: { title: { display: true, text: 'critic_loss' } }
          }
        }
      })
    }

    // Actor Loss Chart
    if (actorLossChartRef.value) {
      if (actorLossChart) actorLossChart.destroy()
      actorLossChart = new Chart(actorLossChartRef.value, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Actor Loss',
            data: [],
            borderColor: '#FFA500',
            backgroundColor: 'transparent',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: 'Actor Loss over Epochs' }
          },
          scales: {
            x: { title: { display: true, text: 'epoch' } },
            y: { title: { display: true, text: 'actor_loss' } }
          }
        }
      })
    }
  }

  // 更新訓練圖表
  function updateTrainingCharts() {
    const epoch = currentEpoch.value

    if (rewardChart) {
      rewardChart.data.labels?.push(epoch.toString())
      const reward = 0.5 + Math.random() * 0.5
      const rewardMA = 0.7 + Math.random() * 0.3
      rewardChart.data.datasets[0].data.push(reward)
      rewardChart.data.datasets[1].data.push(rewardMA)
      rewardChart.update('none')
    }

    if (criticLossChart) {
      criticLossChart.data.labels?.push(epoch.toString())
      const loss = 0.3 * Math.exp(-epoch / 300) + Math.random() * 0.02
      criticLossChart.data.datasets[0].data.push(loss)
      criticLossChart.update('none')
    }

    if (actorLossChart) {
      actorLossChart.data.labels?.push(epoch.toString())
      const loss = -1.2 - Math.random() * 0.8
      actorLossChart.data.datasets[0].data.push(loss)
      actorLossChart.update('none')
    }
  }

  // 初始化地圖
  function initMap() {
    const container = document.getElementById('aiRanMapContainer')
    if (!container) return

    // 清除舊地圖
    if (map) {
      mapMarkers.forEach(m => m.remove())
      mapMarkers.length = 0
      map.remove()
      map = null
    }

    mapboxgl.accessToken = MAPBOX_TOKEN
    map = new mapboxgl.Map({
      container: 'aiRanMapContainer',
      style: 'mapbox://styles/mapbox/light-v11',
      center: [120.9967, 24.7875], // 陽明交大
      zoom: 16,
      pitch: 45
    })

    map.on('load', () => {
      // 添加 gNB markers
      const gnbPositions = [
        [120.9945, 24.7885],
        [120.9975, 24.7865],
        [120.9990, 24.7880],
        [120.9955, 24.7860]
      ]

      gnbPositions.forEach(pos => {
        const el = document.createElement('div')
        el.className = 'gnb-marker'
        el.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="10" fill="#000"/><path d="M12 6c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2s2-.9 2-2V8c0-1.1-.9-2-2-2z" fill="#FFD700"/></svg>'

        const marker = new mapboxgl.Marker(el)
          .setLngLat(pos as [number, number])
          .addTo(map!)
        mapMarkers.push(marker)
      })

      // 添加 heatmap (簡化版)
      if (showHeatmap.value && map) {
        map.addSource('heatmap-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: gnbPositions.map(pos => ({
              type: 'Feature' as const,
              properties: { intensity: Math.random() },
              geometry: { type: 'Point' as const, coordinates: pos }
            }))
          }
        })

        map.addLayer({
          id: 'heatmap-layer',
          type: 'heatmap',
          source: 'heatmap-source',
          paint: {
            'heatmap-weight': ['get', 'intensity'],
            'heatmap-intensity': 1,
            'heatmap-radius': 50,
            'heatmap-opacity': 0.7
          }
        })
      }
    })
  }

  onMounted(() => {
    log.lifecycle('mounted')
    nextTick(() => {
      log.mapInit('Initializing map')
      initMap()
    })
  })

  onUnmounted(() => {
    log.lifecycle('unmounting')
    // 清除定時器
    if (finetuneInterval) {
      clearInterval(finetuneInterval)
    }
    if (posFinetuneInterval) {
      clearInterval(posFinetuneInterval)
    }

    // 清除地圖
    if (map) {
      mapMarkers.forEach(m => m.remove())
      map.remove()
    }

    // 清除 NES 圖表
    if (rewardChart) rewardChart.destroy()
    if (criticLossChart) criticLossChart.destroy()
    if (actorLossChart) actorLossChart.destroy()
    // 清除 Positioning 圖表
    if (posLossChart) posLossChart.destroy()
    log.lifecycle('unmounted')
  })
</script>

<style scoped>
.ai-ran-page {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.page-title {
  font-size: 28px;
  font-weight: 400;
  color: #333;
  margin: 0;
}

.page-content {
  display: flex;
  gap: 20px;
  height: calc(100vh - 140px);
}

/* 左側面板 */
.left-panel {
  width: 180px;
  background: #fff;
  border: 2px solid #000;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 16px;
  color: #333;
}

.model-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.model-btn {
  width: 100%;
  height: 44px;
  font-size: 14px;
  font-weight: 500;
  text-transform: none;
  border-radius: 20px;
}

/* NES 控制面板 */
.nes-controls,
.positioning-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px;
}

.model-select {
  margin-bottom: 4px;
  max-width: 180px;
  flex-shrink: 0;
}

.control-btn {
  max-width: 180px;
  height: 40px;
  font-size: 13px;
  font-weight: 500;
  text-transform: none;
  border-radius: 20px;
}

.retrain-btn {
  border: 2px solid #1976d2;
  background: transparent !important;
  color: #1976d2 !important;
}

.panel-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 16px;
}

.action-btn {
  flex: 1;
  height: 36px;
  min-width: 70px;
  max-width: 90px;
  font-size: 12px;
  text-transform: none;
  border-radius: 18px;
}

.start-btn {
  background: #333 !important;
}

/* 右側面板 */
.right-panel {
  flex: 1;
  background: #fff;
  border: 2px solid #000;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 地圖容器 */
.map-container {
  flex: 1;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.map-view {
  width: 100%;
  height: 100%;
}

.map-controls {
  position: absolute;
  right: 16px;
  bottom: 16px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.legend-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.legend-icon.gnb {
  background: #000;
  color: #FFD700;
}

.legend-icon.ue {
  background: #1976d2;
  color: #fff;
}

.heatmap-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

/* 色標 */
.color-bar-vertical {
  position: absolute;
  right: 150px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.color-bar-gradient {
  width: 20px;
  height: 200px;
  background: linear-gradient(to bottom, red, orange, yellow, green, cyan, blue);
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.color-bar-labels {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 200px;
  font-size: 11px;
  font-weight: 500;
  color: #333;
  text-shadow: 0 0 3px rgba(255, 255, 255, 0.9);
}

/* 訓練面板 */
.training-status {
  text-align: right;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.training-status.running {
  color: #FF6B6B;
}

.training-status.finish {
  color: #4CAF50;
}

.training-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #e0e0e0;
  border-radius: 8px;
  padding: 16px;
}

.charts-container {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
}

.chart-wrapper {
  flex: 1;
  height: 200px;
  background: #fff;
  border-radius: 4px;
  padding: 8px;
}

.chart-wrapper.small {
  height: 150px;
}

.training-info {
  flex: 1;
  padding: 8px;
}

.info-row {
  margin-bottom: 8px;
}

.info-row.highlight .label {
  color: #FF6B6B;
}

.info-row.highlight .value {
  color: #2196F3;
}

.results-section {
  margin-top: 16px;
}

.results-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.result-row {
  margin-bottom: 4px;
}

.loss-charts {
  display: flex;
  gap: 16px;
}

.placeholder-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

/* Positioning Training 面板 (Figma 277:993, 277:1032) */
.pos-training {
  padding: 16px;
}

.mse-label {
  margin-bottom: 16px;
}

.mse-label .value.mse {
  color: #2196F3;
  font-weight: 600;
}

.pos-chart-container {
  display: flex;
  gap: 24px;
  flex: 1;
}

.chart-wrapper.large {
  flex: 2;
  height: 350px;
  background: #fff;
  border-radius: 4px;
  padding: 12px;
}

.pos-training-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
  padding: 20px;
}

.pos-training-info .info-row {
  font-size: 16px;
}

.pos-training-info .label {
  font-weight: 500;
}

.pos-training-info .value {
  font-weight: 600;
  margin-left: 8px;
}

.stop-btn {
  background: #DC3545 !important;
}

/* gNB Marker 樣式 */
:deep(.gnb-marker) {
  cursor: pointer;
}
</style>
