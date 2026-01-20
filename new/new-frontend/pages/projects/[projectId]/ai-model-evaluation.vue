<template>
  <div class="ai-model-evaluation-container">
    <div class="page-header">
      <h2>AI Model Evaluation</h2>
    </div>

    <div class="panels-wrapper">
      <!-- 左側: Model list 面板 -->
      <v-card class="model-list-panel">
        <v-card-title class="panel-header">
          Model list
        </v-card-title>
        <v-card-text>
          <div class="switch-list">
            <v-switch
              v-model="nesEnabled"
              label="NES"
              color="primary"
              hide-details
              @update:model-value="onNesToggle"
            />
            <v-switch
              v-model="positioningEnabled"
              label="Positioning"
              color="primary"
              hide-details
              @update:model-value="onPositioningToggle"
            />
          </div>
        </v-card-text>
      </v-card>

      <!-- 右側: Model Inference 面板 -->
      <v-card class="model-inference-panel">
        <v-card-title class="panel-header">
          Model Inference
        </v-card-title>
        <v-card-text>
          <div class="inference-visualization">
            <!-- 視覺化區域 placeholder -->
            <div class="placeholder-content">
              <v-icon size="64" color="grey-lighten-1">mdi-chart-scatter-plot</v-icon>
              <p class="placeholder-text">模型推斷視覺化區域</p>
              <p class="placeholder-hint">啟用左側模型後將顯示推斷結果</p>
            </div>
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

<script setup>
  import { ref } from 'vue'
  import { useRoute } from 'vue-router'

  const route = useRoute()
  const projectId = route.params.projectId

  // 切換開關狀態
  const nesEnabled = ref(false)
  const positioningEnabled = ref(false)

  // Snackbar 狀態
  const snackbar = ref({ show: false, text: '', color: 'warning' })

  // TODO: 待接入 GET /projects/{projectId}/ai-model-evaluation/inference
  // Query params: model_type ("NES" | "Positioning"), enabled (boolean)
  function onNesToggle(value) {
    console.log(`[TODO] NES toggled: ${value}, projectId: ${projectId}`)
    snackbar.value = {
      show: true,
      text: 'NES 模型推斷功能尚未接上後端',
      color: 'warning'
    }
  }

  function onPositioningToggle(value) {
    console.log(`[TODO] Positioning toggled: ${value}, projectId: ${projectId}`)
    snackbar.value = {
      show: true,
      text: 'Positioning 模型推斷功能尚未接上後端',
      color: 'warning'
    }
  }
</script>

<style scoped>
.ai-model-evaluation-container {
  padding: 24px 32px;
  max-width: 1400px;
  margin: 0 auto;
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.page-header h2 {
  margin: 0;
  font-weight: 600;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-header h2::before {
  content: '';
  width: 4px;
  height: 24px;
  background: linear-gradient(180deg, #1976d2, #42a5f5);
  border-radius: 2px;
}

.panels-wrapper {
  display: flex;
  gap: 20px;
  min-height: 600px;
}

.model-list-panel {
  flex: 0 0 350px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.model-inference-panel {
  flex: 1;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.panel-header {
  background: #c7c7c7;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  border-radius: 12px 12px 0 0;
}

.switch-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px 0;
}

.inference-visualization {
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 8px;
}

.placeholder-content {
  text-align: center;
  color: #888;
}

.placeholder-text {
  margin-top: 16px;
  font-size: 18px;
  color: #666;
}

.placeholder-hint {
  margin-top: 8px;
  font-size: 14px;
  color: #999;
}

@media (max-width: 900px) {
  .panels-wrapper {
    flex-direction: column;
  }

  .model-list-panel {
    flex: none;
    width: 100%;
  }
}
</style>
