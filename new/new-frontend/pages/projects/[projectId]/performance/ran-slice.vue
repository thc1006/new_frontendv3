<template>
  <div class="performance-container">
    <div class="performance-header">
      <h2>Performance - Ran Slice</h2>
      <v-btn color="primary" size="small" @click="refreshIframe">
        <v-icon left>mdi-refresh</v-icon>
        重新整理
      </v-btn>
    </div>
    <div class="iframe-wrapper">
      <!-- 有設定 URL 時顯示 iframe，否則顯示 placeholder -->
      <iframe
        v-if="grafanaUrl"
        ref="iframeRef"
        :src="grafanaUrl"
        frameborder="0"
        class="grafana-iframe"
        @load="onIframeLoad"
        @error="onIframeError"
      />
      <div v-else class="placeholder-content">
        <v-icon size="64" color="grey-lighten-1">mdi-chart-timeline-variant</v-icon>
        <div class="placeholder-text">Ran Slice Performance Dashboard</div>
        <div class="placeholder-subtext">
          TODO: 待設定 NUXT_PUBLIC_GRAFANA_RAN_SLICE_URL 環境變數
        </div>
      </div>
      <div v-if="grafanaUrl && isLoading" class="loading-overlay">
        <v-progress-circular indeterminate color="primary" />
        <p>載入中...</p>
      </div>
    </div>
    <v-snackbar v-model="showError" color="error" timeout="5000" location="top">
      {{ errorMessage }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useRoute } from 'vue-router'

  const route = useRoute()
  const config = useRuntimeConfig()
  const projectId = route.params.projectId

  // 從環境變數取得 Grafana URL
  const grafanaUrl = config.public.grafanaRanSliceUrl as string

  const iframeRef = ref<HTMLIFrameElement | null>(null)
  const isLoading = ref(true)
  const showError = ref(false)
  const errorMessage = ref('')

  function onIframeLoad() {
    isLoading.value = false
  }

  function onIframeError() {
    isLoading.value = false
    errorMessage.value = '無法載入 Grafana 儀表板，請檢查網路連線'
    showError.value = true
  }

  function refreshIframe() {
    if (iframeRef.value && grafanaUrl) {
      isLoading.value = true
      iframeRef.value.src = grafanaUrl
    }
  }

  // 預留 projectId 使用
  console.log('Performance Ran Slice - Project ID:', projectId)
</script>

<style scoped>
.performance-container {
  padding: 24px;
  height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.performance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.performance-header h2 {
  margin: 0;
  font-weight: 600;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 12px;
}

.performance-header h2::before {
  content: '';
  width: 4px;
  height: 24px;
  background: linear-gradient(180deg, #1976d2, #42a5f5);
  border-radius: 2px;
}

.performance-header :deep(.v-btn) {
  font-weight: 500;
  transition: all 0.2s ease;
}

.performance-header :deep(.v-btn:hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
}

.iframe-wrapper {
  flex: 1;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e0e0e0;
}

.grafana-iframe {
  width: 100%;
  height: 100%;
  min-height: 800px;
  border: none;
  background: #fff;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  color: #999;
}

.placeholder-text {
  font-size: 18px;
  margin-top: 12px;
  color: #666;
}

.placeholder-subtext {
  font-size: 12px;
  margin-top: 8px;
  color: #aaa;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  gap: 16px;
  backdrop-filter: blur(4px);
}

.loading-overlay p {
  color: #666;
  font-size: 14px;
  margin: 0;
}
</style>
