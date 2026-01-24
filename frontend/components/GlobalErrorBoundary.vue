<template>
  <div>
    <slot v-if="!hasError" />
    <div v-else class="error-boundary">
      <v-card class="error-card" max-width="500">
        <v-card-title class="d-flex align-center">
          <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
          Something went wrong
        </v-card-title>
        <v-card-text>
          <p class="mb-3">An unexpected error occurred. Please try again.</p>
          <v-expansion-panels v-if="errorDetails" variant="accordion">
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon size="small" class="mr-2">mdi-bug</v-icon>
                Error Details
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <pre class="error-details">{{ errorDetails }}</pre>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="outlined" @click="reload">
            <v-icon start>mdi-refresh</v-icon>
            Reload Page
          </v-btn>
          <v-btn color="primary" @click="clearError">
            <v-icon start>mdi-arrow-left</v-icon>
            Try Again
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onErrorCaptured } from 'vue'

  const hasError = ref(false)
  const errorDetails = ref<string | null>(null)

  onErrorCaptured((error: Error) => {
    hasError.value = true
    errorDetails.value = `${error.name}: ${error.message}\n\n${error.stack || ''}`
    console.error('Error captured by GlobalErrorBoundary:', error)
    return false // prevent error from propagating
  })

  function clearError() {
    hasError.value = false
    errorDetails.value = null
  }

  function reload() {
    window.location.reload()
  }
</script>

<style scoped>
.error-boundary {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 20px;
}

.error-card {
  width: 100%;
}

.error-details {
  font-size: 12px;
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}
</style>
