<template>
  <div class="scene-deployment-page">
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

    <!-- 提示訊息 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="top">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const projectId = computed(() => route.params.projectId)

// TODO: 從 API 取得專案資訊
const projectName = ref('Loading...')
const isIndoor = ref(false)

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

// 初始化：取得專案資訊
// TODO: 呼叫 API 取得專案名稱和類型
projectName.value = `Project ${projectId.value}`
</script>

<style scoped>
.scene-deployment-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
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
