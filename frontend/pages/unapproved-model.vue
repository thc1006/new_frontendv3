<script setup lang="ts">
  import { ref } from 'vue'

  const clickCount = ref<number>(0)
  const showCapyengineer = ref<boolean>(false)

  const handleClick = (): void => {
    clickCount.value++
    if (clickCount.value > 10) {
      showCapyengineer.value = true
    }
  }
</script>

<template>
  <div class="container" @click="handleClick">
    <img src="/Webpage-Maintening.webp" alt="網頁維護中">
    <transition name="fade">
      <img v-if="showCapyengineer" src="/Alvin.webp" alt="Capyengineer" class="capy-image">
    </transition>
  </div>
</template>

<style scoped>
.container {
  position: relative;
  text-align: center;
  cursor: pointer;
}

.capy-image {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.5);
  z-index: 20;
}

.fade-enter-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from {
  opacity: 0;
}
</style>