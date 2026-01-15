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

function showPlaceholder(action: string) {
  snackbar.value = {
    show: true,
    text: `${action} 功能尚未實作`,
    color: 'warning'
  }
  console.warn(`[TODO] ${action} not implemented`)
}

function handleAddRu() {
  showPlaceholder('ADD RU')
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
</style>
