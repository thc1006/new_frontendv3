<template>
  <div class="scene-deployment-page">
    <!-- 錯誤對話框 -->
    <v-dialog v-model="errorDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5">Access Error</v-card-title>
        <v-card-text>{{ errorMessage }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="handleDialogClose">
            Return to Projects
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 載入狀態：專案資料載入中，或權限資料載入中（非管理員） -->
    <div v-if="isLoadingProject || (!isAdmin && isLoadingPermissions && projectExists)" class="loading-state">
      <v-progress-circular indeterminate color="primary" />
      <p class="mt-2">{{ isLoadingProject ? 'Loading project...' : 'Checking permissions...' }}</p>
    </div>

    <!-- 主要內容 -->
    <template v-else-if="projectExists && hasProjectAccess">
      <div class="page-header">
        <h1 class="page-title">Scene Deployment</h1>
      </div>

      <div class="page-content">
        <v-card class="content-card">
          <v-card-title>
            Project ID : {{ projectName }}
          </v-card-title>

          <v-card-text>
            <!-- 頂部按鈕列 -->
            <div class="button-row">
              <v-btn color="primary" class="action-btn" @click="handleAddRu">
                ADD RU
              </v-btn>
              <v-btn
                v-if="!isIndoor"
                color="primary"
                class="action-btn"
                @click="handleUesSettings"
              >
                UES SETTINGS
              </v-btn>
              <v-btn
                v-if="!isIndoor"
                color="primary"
                class="action-btn"
                @click="handleSimulationConfig"
              >
                SIMULATION CONFIG
              </v-btn>
              <v-btn
                v-if="!isIndoor"
                color="primary"
                class="action-btn"
                @click="handleRuPosition"
              >
                RU POSITION
              </v-btn>
            </div>

            <!-- 地圖區域 -->
            <div class="map-container">
              <div id="sceneMapContainer" class="map-view" />
              <!-- 色標 (Figma: 垂直在地圖右側) -->
              <div v-show="showHeatmap" class="color-bar-vertical">
                <div class="color-bar-gradient" />
                <div class="color-bar-labels-vertical">
                  <span>{{ colorBarMax }}</span>
                  <span>{{ colorBarMin }}</span>
                </div>
              </div>
            </div>

            <!-- RU 互動提示 -->
            <div class="ru-tips">
              <p class="tips-title">RU Interaction Tips:</p>
              <ul>
                <li>Single click RU: Select RU</li>
                <li>Double click RU: Open RU configuration dialog</li>
                <li>Keyboard Q/W: Rotate RU</li>
              </ul>
            </div>

            <!-- 底部控制列 -->
            <div class="control-row">
              <v-btn variant="text" class="control-btn" @click="handleEvaluate">
                EVALUATE
              </v-btn>
              <v-btn variant="text" class="control-btn" @click="handleApplyConfig">
                APPLY CONFIG
              </v-btn>
              <v-select
                v-model="selectedHeatmapType"
                :items="heatmapTypes"
                label="RSRP"
                density="compact"
                class="heatmap-select"
                hide-details
              />
              <v-switch
                v-model="showHeatmap"
                label="Show heatmap"
                density="compact"
                hide-details
                class="heatmap-switch"
                @change="onHeatmapToggle"
              />
            </div>

          </v-card-text>
        </v-card>
      </div>
    </template>

    <!-- RU Configuration 對話框 -->
    <v-dialog v-model="ruConfigDialog" max-width="600" persistent>
      <v-card>
        <v-card-title class="ru-dialog-title">
          <v-icon class="me-2">mdi-access-point</v-icon>
          RU Configuration
          <v-spacer />
          <v-btn icon variant="text" @click="closeRuConfigDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pa-4">
          <!-- 基本資訊 (唯讀) -->
          <div class="config-section">
            <h4 class="section-title">基本資訊</h4>
            <div class="info-row">
              <span class="info-label">RU ID:</span>
              <span class="info-value">{{ selectedRu?.RU_id || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">名稱:</span>
              <span class="info-value">{{ selectedRu?.name || 'N/A' }}</span>
            </div>
          </div>

          <!-- 位置設定 -->
          <div class="config-section">
            <h4 class="section-title">位置設定</h4>
            <v-row dense>
              <v-col cols="4">
                <v-text-field
                  v-model.number="ruConfigForm.lat"
                  label="緯度"
                  type="number"
                  step="0.000001"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model.number="ruConfigForm.lon"
                  label="經度"
                  type="number"
                  step="0.000001"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model.number="ruConfigForm.z"
                  label="高度 (m)"
                  type="number"
                  step="0.1"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
            </v-row>
          </div>

          <!-- 技術規格 -->
          <div class="config-section">
            <h4 class="section-title">技術規格</h4>
            <v-row dense>
              <v-col cols="6">
                <v-text-field
                  v-model.number="ruConfigForm.bandwidth"
                  label="Bandwidth (MHz)"
                  type="number"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="ruConfigForm.tx_power"
                  label="Tx Power (dBm)"
                  type="number"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
            </v-row>
            <v-row dense class="mt-2">
              <v-col cols="6">
                <v-text-field
                  v-model.number="ruConfigForm.opening_angle"
                  label="Opening Angle (°)"
                  type="number"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="ruConfigForm.roll"
                  label="Roll (°)"
                  type="number"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
            </v-row>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="closeRuConfigDialog">
            取消
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="saveRuConfig">
            儲存設定
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 提示訊息 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="top">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watchEffect, watch, nextTick, onUnmounted, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useQuery } from '@tanstack/vue-query'
  import { navigateTo } from '#app'
  import { useUserStore } from '~/stores/user'
  import mapboxgl from 'mapbox-gl'
  import 'mapbox-gl/dist/mapbox-gl.css'
  import 'threebox-plugin/dist/threebox.css'
  import * as Threebox from 'threebox-plugin'
  import { createModuleLogger } from '~/utils/logger'

  const log = createModuleLogger('SceneDeployment')

  log.lifecycle('setup:start')
  const route = useRoute()
  const _router = useRouter()
  const { $apiClient } = useNuxtApp()
  const userStore = useUserStore()
  const config = useRuntimeConfig()
  const isOnline = config.public?.isOnline

  // 直接從 route 取得 projectId，確保響應式更新
  const projectId = computed(() => {
    const param = route.params.projectId
    return param ? String(param) : ''
  })

  const validProjectId = computed(() => {
    const id = projectId.value
    return id && id !== '' ? Number(id) : null
  })

  // 專案資訊
  const projectName = ref('Loading...')
  const projectExists = ref(false)
  const errorDialog = ref(false)
  const errorMessage = ref('')

  // 地圖相關
  let map: mapboxgl.Map | null = null
  const mapAccessToken = 'pk.eyJ1IjoiZGFyaXVzbHVuZyIsImEiOiJjbHk3MWhvZW4wMTl6MmlxMnVhNzI3cW0yIn0.WGvtamOAfwfk3Ha4KsL3BQ'
  // 使用國土測繪中心 WMTS 圖資（與 overviews 頁面一致）
  const onlineStyle: mapboxgl.StyleSpecification = {
    version: 8,
    sources: {
      'nlsc-emap': {
        type: 'raster',
        tiles: [
          'https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution: '&copy; <a href="https://maps.nlsc.gov.tw/" target="_blank">國土測繪中心</a>'
      }
    },
    layers: [
      {
        id: 'nlsc-emap-layer',
        type: 'raster',
        source: 'nlsc-emap',
        minzoom: 0,
        maxzoom: 20
      }
    ]
  }
  const offlineStyle = config.public?.offlineMapboxGLJSURL

  // 專案座標 (從 API 取得)
  const projectLat = ref<number | null>(null)
  const projectLon = ref<number | null>(null)
  const projectMargin = ref<number | null>(null)
  const projectRotation = ref<number[]>([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
  const projectBbox = ref<{ min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } } | null>(null)

  const mapCenter = computed<[number, number]>(() => {
    if (projectLon.value !== null && projectLat.value !== null) {
      return [projectLon.value, projectLat.value]
    }
    // 預設座標 (台灣)
    return [120.21676, 22.99414]
  })

  // TODO: 後端目前無 category 欄位，暫時使用 project_id 奇偶數模擬分類
  // 奇數 = OUTDOOR，偶數 = INDOOR
  const isIndoor = computed(() => {
    const id = validProjectId.value
    return id !== null && id % 2 === 0
  })

  // 取得專案資料
  const { isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      try {
        if (!validProjectId.value) {
          throw new Error('Invalid project ID')
        }
        const response = await $apiClient.project.projectsDetail(validProjectId.value)
        projectExists.value = true
        projectName.value = response.data.title || `Project ${projectId.value}`
        // 取得專案座標
        projectLat.value = response.data.lat ? Number(response.data.lat) : null
        projectLon.value = response.data.lon ? Number(response.data.lon) : null
        projectMargin.value = response.data.margin ? Number(response.data.margin) : null
        // Extract rotation and bbox from map_position if available
        if (response.data.map_position) {
          const mapPos = typeof response.data.map_position === 'string'
            ? JSON.parse(response.data.map_position)
            : response.data.map_position
          if (mapPos.rotation) {
            projectRotation.value = mapPos.rotation
          }
          if (mapPos.bbox) {
            projectBbox.value = mapPos.bbox
          }
        }
        return response.data
      } catch (err: unknown) {
        const axiosError = err as { response?: { status?: number } }
        if (axiosError.response?.status === 404) {
          errorMessage.value = `Project with ID ${projectId.value} not found.`
          errorDialog.value = true
          projectExists.value = false
        }
        throw err
      }
    },
    enabled: computed(() => !!validProjectId.value)
  })

  // 權限檢查
  const isAdmin = computed(() => userStore.user?.role === 'ADMIN')

  const { data: userProjects, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['userProjects'],
    queryFn: async () => {
      const response = await $apiClient.project.getProject()
      return response.data
    },
    enabled: computed(() => projectExists.value && !isAdmin.value)
  })

  const hasProjectAccess = computed(() => {
    if (isAdmin.value) return true
    const projects = userProjects.value
    if (!projects || !Array.isArray(projects)) return false
    return projects.some(project => String(project.project_id) === projectId.value)
  })

  // 權限不足時顯示錯誤
  watchEffect(() => {
    if (!isLoadingProject.value &&
      projectExists.value &&
      !isLoadingPermissions.value &&
      !isAdmin.value &&
      userProjects.value &&
      !hasProjectAccess.value) {
      errorMessage.value = `Permission denied. You don't have access to project with ID ${projectId.value}.`
      errorDialog.value = true
    }
  })

  function handleDialogClose() {
    errorDialog.value = false
    navigateTo('/')
  }

  // Heatmap 控制
  const showHeatmap = ref(false)
  const selectedHeatmapType = ref('RSRP (success)')
  const heatmapTypes = [
    'RSRP (success)',
    'RSRP DT (success)',
    'Throughput (waiting)',
    'Throughput DT (waiting)'
  ]

  // 色標值 (根據 heatmap 類型顯示不同單位)
  const colorBarMax = ref('-55 dBm')
  const colorBarMin = ref('-140 dBm')

  // 監聽 heatmap 類型變化，更新色標
  watch(selectedHeatmapType, (newType) => {
    if (newType.includes('RSRP')) {
      colorBarMax.value = '-55 dBm'
      colorBarMin.value = '-140 dBm'
    } else {
      colorBarMax.value = 'max Mbps'
      colorBarMin.value = '0 Mbps'
    }
  })

  // 切換 heatmap 圖層顯示
  function onHeatmapToggle() {
    if (map && map.getLayer('sceneHeatmapLayer')) {
      map.setLayoutProperty('sceneHeatmapLayer', 'visibility', showHeatmap.value ? 'visible' : 'none')
    }
  // TODO: 整合實際 heatmap 資料 API
  }

  const snackbar = ref({ show: false, text: '', color: 'info' })

  // RU Configuration 對話框
  const ruConfigDialog = ref(false)
  const selectedRu = ref<{
    RU_id: number
    name?: string
    lat?: number
    lon?: number
    z?: number
    bandwidth?: number
    tx_power?: number
    opening_angle?: number
    roll?: number
  } | null>(null)

  const ruConfigForm = ref({
    lat: 0,
    lon: 0,
    z: 0,
    bandwidth: 0,
    tx_power: 0,
    opening_angle: 0,
    roll: 0
  })

  // 開啟 RU 設定對話框 (由雙擊 RU marker 觸發)
  function openRuConfigDialog(ru: typeof selectedRu.value) {
    selectedRu.value = ru
    if (ru) {
      ruConfigForm.value = {
        lat: ru.lat ?? 0,
        lon: ru.lon ?? 0,
        z: ru.z ?? 0,
        bandwidth: ru.bandwidth ?? 0,
        tx_power: ru.tx_power ?? 0,
        opening_angle: ru.opening_angle ?? 0,
        roll: ru.roll ?? 0
      }
    }
    ruConfigDialog.value = true
  }

  function closeRuConfigDialog() {
    ruConfigDialog.value = false
    selectedRu.value = null
  }

  function saveRuConfig() {
    // TODO: 整合後端 API 儲存 RU 設定
    snackbar.value = {
      show: true,
      text: 'RU 設定儲存功能尚未實作',
      color: 'warning'
    }
    closeRuConfigDialog()
  }

  // 模擬雙擊 RU marker (供測試用)
  function _handleMapDoubleClick() {
    // 模擬一個 RU 資料供展示
    const mockRu = {
      RU_id: 1,
      name: 'RU-001',
      lat: mapCenter.value[1],
      lon: mapCenter.value[0],
      z: 10,
      bandwidth: 100,
      tx_power: 30,
      opening_angle: 120,
      roll: 0
    }
    openRuConfigDialog(mockRu)
  }

  function showPlaceholder(action: string) {
    snackbar.value = {
      show: true,
      text: `${action} 功能尚未實作`,
      color: 'warning'
    }
    console.warn(`[TODO] ${action} not implemented`)
  }

  function handleAddRu() {
    // 暫時開啟 RU 設定對話框來測試 (新增 RU 功能)
    const newRu = {
      RU_id: Date.now(), // 暫用時間戳作為 ID
      name: '',
      lat: mapCenter.value[1],
      lon: mapCenter.value[0],
      z: 10,
      bandwidth: 100,
      tx_power: 30,
      opening_angle: 120,
      roll: 0
    }
    openRuConfigDialog(newRu)
  }

  function handleUesSettings() {
    showPlaceholder('UES SETTINGS')
  }

  function handleSimulationConfig() {
    showPlaceholder('SIMULATION CONFIG')
  }

  function handleRuPosition() {
    showPlaceholder('RU POSITION')
  }

  function handleEvaluate() {
    showPlaceholder('EVALUATE')
  }

  function handleApplyConfig() {
    showPlaceholder('APPLY CONFIG')
  }

  // 等待 DOM 元素出現
  const waitForElement = (selector: string) => {
    return new Promise(resolve => {
      if (document.getElementById(selector)) {
        return resolve(document.getElementById(selector))
      }
      const observer = new MutationObserver(() => {
        if (document.getElementById(selector)) {
          observer.disconnect()
          resolve(document.getElementById(selector))
        }
      })
      observer.observe(document.body, {
        childList: true,
        subtree: true
      })
    })
  }

  // 清理地圖資源
  const cleanupMap = () => {
    if (map) {
      map.remove()
      map = null
    }
    if (window.tb) {
      window.tb = null
    }
    mapInitialized.value = false
  }

  // 初始化地圖
  const initializeMap = async () => {
    // 如果地圖已存在，先清理再重新初始化
    if (map) {
      cleanupMap()
    }
    const mapContainer = document.getElementById('sceneMapContainer')
    if (!mapContainer) {
      console.error('Map container not found')
      return
    }
    try {
      mapboxgl.accessToken = mapAccessToken
      const initialStyle = (isOnline ? onlineStyle : offlineStyle) as string | mapboxgl.StyleSpecification | undefined

      map = new mapboxgl.Map({
        container: 'sceneMapContainer',
        style: initialStyle,
        projection: 'globe',
        center: mapCenter.value,
        zoom: 15,
        pitch: 45  // 3D 傾斜角度
      })
      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }))
      map.addControl(new mapboxgl.ScaleControl())

      // 載入 3D 模型
      map.on('style.load', () => {
        load3DModel()
      })
    } catch (error) {
      console.error('Error initializing map:', error)
    }
  }

  // 載入 3D 模型的核心函數
  // 使用與舊前端 overview.js 相同的方式：scale = 1，使用 setRotationFromMatrix 應用旋轉
  const loadModelWithUrl = (modelUrl: string) => {
    // 模型已經是正確的真實世界尺度（米），使用 scale = 1
    const scale = { x: 1, y: 1, z: 1 }
    log.lifecycle('Loading 3D model', { modelUrl, scale })

    map?.addLayer({
      id: 'scene-threebox-model',
      type: 'custom',
      renderingMode: '3d',
      onAdd: function (mapInstance, gl) {
        const tb = (window.tb = new Threebox.Threebox(
          mapInstance,
          gl,
          { defaultLights: true }
        ))
        const options = {
          obj: modelUrl,
          type: 'gltf',
          scale: scale,
          units: 'meters',
          rotation: { x: 90, y: 0, z: 0 },  // x: 90 for Y-up to Z-up conversion (building rotation applied via setRotationFromMatrix)
          anchor: 'center'
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tb.loadObj(options, (model: any) => {
          model.setCoords?.(mapCenter.value)

          // 使用完整的 4x4 旋轉矩陣（與舊前端 overview.js 相同）
          if (projectRotation.value && projectRotation.value.length >= 16) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const THREE = (window as any).THREE
            if (THREE && THREE.Matrix4) {
              const rotationMatrix = new THREE.Matrix4().fromArray(projectRotation.value)
              if (model.setRotationFromMatrix && typeof model.setRotationFromMatrix === 'function') {
                model.setRotationFromMatrix(rotationMatrix)
                log.info('Applied rotation from matrix using setRotationFromMatrix')
              } else if (model.object3d) {
                model.object3d.rotation.setFromRotationMatrix(rotationMatrix)
                log.info('Applied rotation from matrix to object3d')
              }
            }
          }

          tb.add(model)
        })
      },
      render: function () {
        if (window.tb) {
          window.tb.update()
        }
      }
    })
  }

  // 載入 3D 模型
  const load3DModel = async () => {
    if (!validProjectId.value || !map) return
    try {
      const response = await $apiClient.project.mapsFrontendList(validProjectId.value)
      const gltfJson = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
      const blob = new Blob([JSON.stringify(gltfJson)], { type: 'application/json' })
      const reader = new FileReader()
      reader.readAsDataURL(blob)
      reader.onloadend = () => {
        const base64data = reader.result as string
        const base64Content = base64data.split(',')[1]
        loadModelWithUrl('data:text/plain;base64,' + base64Content)
      }
    } catch (error) {
      // API 返回 404 時，嘗試載入靜態 3D 模型作為 fallback
      console.warn('No 3D model from API, trying static fallback:', error)
      try {
        // 嘗試載入工程四館的 3D 模型（預設 fallback）
        loadModelWithUrl('/3d/8Fmesh_rotated.gltf')
        console.warn('Loaded static 3D model as fallback')
      } catch (fallbackError) {
        console.warn('Static 3D model also not available:', fallbackError)
      }
    }
  }

  // 當專案載入完成後初始化地圖
  // 使用 watch 而非 watchEffect，確保在條件滿足時正確初始化
  const mapInitialized = ref(false)

  watch(
    [() => isLoadingProject.value, () => projectExists.value, () => hasProjectAccess.value],
    ([loading, exists, access]) => {
      if (!loading && exists && access && !mapInitialized.value) {
        nextTick(async () => {
          await waitForElement('sceneMapContainer')
          initializeMap()
          mapInitialized.value = true
        })
      }
    },
    { immediate: true }
  )

  // 監聽 projectId 變化，處理路由切換時的地圖重新初始化
  watch(
    () => projectId.value,
    (newProjectId, oldProjectId) => {
      if (newProjectId !== oldProjectId && oldProjectId) {
        log.lifecycle('projectId changed', { from: oldProjectId, to: newProjectId })
        // 清理舊地圖並重置狀態
        cleanupMap()
        // 等待新專案數據載入後會自動觸發上面的 watch 重新初始化
      }
    }
  )

  // Lifecycle hooks with logging
  onMounted(() => {
    log.lifecycle('mounted', { projectId: projectId.value })
    // 如果條件已滿足但地圖未初始化，在 mounted 時重試
    if (!isLoadingProject.value && projectExists.value && hasProjectAccess.value && !mapInitialized.value) {
      nextTick(async () => {
        await waitForElement('sceneMapContainer')
        initializeMap()
        mapInitialized.value = true
      })
    }
  })

  // 清理資源
  onUnmounted(() => {
    log.lifecycle('unmounting', { projectId: projectId.value })
    cleanupMap()
    log.lifecycle('unmounted')
  })
</script>

<style scoped>
.scene-deployment-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 48px;
  font-weight: 400;
  color: #000;
}

.content-card {
  border-radius: 8px;
}

.button-row {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.action-btn {
  text-transform: none;
}

.map-container {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.map-view {
  width: 100%;
  height: 450px;
}

.ru-tips {
  background: rgba(0, 0, 0, 0.05);
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 24px;
  font-size: 14px;
}

.tips-title {
  font-weight: 500;
  margin-bottom: 8px;
}

.ru-tips ul {
  margin: 0;
  padding-left: 20px;
}

.ru-tips li {
  margin-bottom: 4px;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.control-btn {
  text-transform: uppercase;
  font-weight: 500;
}

.heatmap-select {
  max-width: 200px;
}

.heatmap-switch {
  margin-left: auto;
}

/* 色標 - 垂直顯示在地圖右側 (Figma 277:24) */
.color-bar-vertical {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: flex-start;
  gap: 8px;
  z-index: 10;
}

.color-bar-gradient {
  width: 24px;
  height: 280px;
  background: linear-gradient(to bottom, red, orange, yellow, green, cyan, blue);
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.color-bar-labels-vertical {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 280px;
  font-size: 12px;
  font-weight: 500;
  color: #333;
  text-shadow: 0 0 4px rgba(255, 255, 255, 0.9);
}

/* RU Configuration 對話框 */
.ru-dialog-title {
  background: linear-gradient(135deg, #1976d2, #42a5f5);
  color: white;
  display: flex;
  align-items: center;
}

.config-section {
  margin-bottom: 20px;
}

.config-section .section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1976d2;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e3f2fd;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 8px;
}

.info-row .info-label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
}

.info-row .info-value {
  color: #333;
}
</style>
