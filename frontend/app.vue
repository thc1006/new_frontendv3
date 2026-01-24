<script setup lang="ts">
  import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
</script>

<template>
  <v-app>
    <NuxtErrorBoundary>
      <NuxtLayout>
        <GlobalErrorBoundary>
          <NuxtPage />
        </GlobalErrorBoundary>
      </NuxtLayout>
      <template #error="{ error, clearError }">
        <div class="fatal-error-container">
          <v-card class="fatal-error-card" max-width="600">
            <v-card-title class="d-flex align-center text-error">
              <v-icon color="error" size="large" class="mr-3">mdi-alert-octagon</v-icon>
              Application Error
            </v-card-title>
            <v-card-text>
              <p class="text-body-1 mb-4">
                A critical error occurred that prevented the page from loading properly.
              </p>
              <v-alert type="error" variant="tonal" class="mb-4">
                {{ error?.message || 'Unknown error' }}
              </v-alert>
              <p class="text-body-2 text-grey">
                If this problem persists, please contact support or try clearing your browser cache.
              </p>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="primary" variant="outlined" @click="() => navigateTo('/')">
                <v-icon start>mdi-home</v-icon>
                Go Home
              </v-btn>
              <v-btn color="primary" @click="clearError()">
                <v-icon start>mdi-refresh</v-icon>
                Try Again
              </v-btn>
            </v-card-actions>
          </v-card>
        </div>
      </template>
    </NuxtErrorBoundary>
    <ClientOnly>
      <VueQueryDevtools :initial-is-open="false" />
    </ClientOnly>
  </v-app>
</template>

<style>
.fatal-error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
}

.fatal-error-card {
  width: 100%;
}
</style>