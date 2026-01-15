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

            <!-- 地圖區域 placeholder -->
            <div class="map-placeholder">
              <v-icon size="64" color="grey">mdi-map-marker</v-icon>
              <p>地圖載入中...</p>
              <p class="text-caption text-grey">TODO: 整合 Mapbox + Threebox 3D 地圖</p>
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
              />
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
import { ref, computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { navigateTo } from '#app'
import { useUserStore } from '~/stores/user'

const route = useRoute()
const router = useRouter()
const { $apiClient } = useNuxtApp()
const userStore = useUserStore()

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
const selectedHeatmapType = ref('RSRP')
const heatmapTypes = [
  'RSRP (success)',
  'RSRP DT (success)',
  'Throughput (waiting)',
  'Throughput DT (waiting)'
]

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

.map-placeholder {
  background: #f5f5f5;
  border: 2px dashed #ccc;
  border-radius: 8px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
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
</style>
