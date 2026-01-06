<script setup lang="ts">
  import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
</script>

<template>
  <v-app>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly>
      <VueQueryDevtools :initial-is-open="false" />
    </ClientOnly>
  </v-app>
</template>