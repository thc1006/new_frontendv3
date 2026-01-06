<template>
  <div class="performance-container">
    <div class="performance-header">
      <h2>Performance - MRO</h2>
      <v-btn color="primary" size="small" @click="refreshIframe">
        <v-icon left>mdi-refresh</v-icon>
        重新整理
      </v-btn>
    </div>
    <div class="iframe-wrapper">
      <iframe
        ref="iframeRef"
        :src="grafanaUrl"
        frameborder="0"
        class="grafana-iframe"
        @load="onIframeLoad"
        @error="onIframeError"
      />
      <div v-if="isLoading" class="loading-overlay">
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

  // TODO: 將 Grafana URL 移至環境變數或設定檔
  const grafanaUrl = 'http://140.113.144.121:2982/d/bdl9s0tm6mebkf/mro'

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
    if (iframeRef.value) {
      isLoading.value = true
      iframeRef.value.src = grafanaUrl
    }
  }
</script>

<style scoped>
.performance-container {
  padding: 24px;
  height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
}
.performance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.performance-header h2 {
  margin: 0;
}
.iframe-wrapper {
  flex: 1;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
}
.grafana-iframe {
  width: 100%;
  height: 100%;
  min-height: 800px;
  border: none;
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
  background: rgba(255, 255, 255, 0.9);
  gap: 16px;
}
</style>
