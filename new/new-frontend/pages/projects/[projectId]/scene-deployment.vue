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

    <!-- 載入狀態 -->
    <div v-if="isLoadingProject" class="loading-state">
      <v-progress-circular indeterminate color="primary" />
      <p class="mt-2">Loading project...</p>
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

            <!-- 色標 (Heatmap 啟用時顯示) -->
            <div v-show="showHeatmap" class="color-bar-container">
              <div class="color-bar" />
              <div class="color-bar-labels">
                <span class="color-bar-label top">{{ colorBarMax }}</span>
                <span class="color-bar-label bottom">{{ colorBarMin }}</span>
              </div>
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
import { ref, computed, watchEffect, watch, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { navigateTo } from '#app'
import { useUserStore } from '~/stores/user'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'threebox-plugin/dist/threebox.css'
import * as Threebox from 'threebox-plugin'

declare global {
  interface Window {
    tb: any
  }
}

const route = useRoute()
const router = useRouter()
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
const onlineStyle = 'mapbox://styles/mapbox/streets-v12'
const offlineStyle = config.public?.offlineMapboxGLJSURL

// 專案座標 (從 API 取得)
const projectLat = ref<number | null>(null)
const projectLon = ref<number | null>(null)
const projectMargin = ref<number | null>(null)

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
      return response.data
    } catch (err: any) {
      if (err.response?.status === 404) {
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
function handleMapDoubleClick() {
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

// 初始化地圖
const initializeMap = async () => {
  if (map) return
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
            obj: 'data:text/plain;base64,' + base64Content,
            type: 'gltf',
            scale: { x: 1, y: 1, z: 1 },
            units: 'meters',
            rotation: { x: 0, y: 0, z: 180 },
            anchor: 'center'
          }
          tb.loadObj(options, (model: any) => {
            model.setCoords(mapCenter.value)
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
  } catch (error) {
    // 沒有 3D 模型也沒關係，只顯示地圖
    console.warn('No 3D model available for this project:', error)
  }
}

// 當專案載入完成後初始化地圖
watchEffect(() => {
  if (!isLoadingProject.value && projectExists.value && hasProjectAccess.value) {
    nextTick(async () => {
      await waitForElement('sceneMapContainer')
      initializeMap()
    })
  }
})

// 清理資源
onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
  if (window.tb) {
    window.tb = null
  }
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
  font-size: 24px;
  font-weight: 500;
  color: #333;
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

/* 色標 */
.color-bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
}

.color-bar {
  width: 200px;
  height: 16px;
  background: linear-gradient(to right, blue, cyan, green, yellow, orange, red);
  border-radius: 2px;
}

.color-bar-labels {
  display: flex;
  justify-content: space-between;
  flex: 1;
  font-size: 12px;
  color: #666;
}

.color-bar-label.top {
  font-weight: 500;
}

.color-bar-label.bottom {
  font-weight: 500;
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
