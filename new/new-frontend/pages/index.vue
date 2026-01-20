<template>
  <div class="projects-page">
    <!-- 左側: 地圖區域 -->
    <div class="map-section">
      <div id="projectsMap" class="map-container" />
    </div>

    <!-- 右側: 專案面板 -->
    <div class="projects-panel">
      <!-- 標題 -->
      <div class="panel-header">
        <v-icon color="#006ab5" size="28">mdi-view-grid</v-icon>
        <span class="panel-title">Projects</span>
      </div>

      <!-- 載入中狀態 -->
      <div v-if="isPending" class="loading-state">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <!-- 錯誤狀態 -->
      <v-alert v-else-if="isError" type="error" class="mx-4">
        Failed to load projects: {{ error }}
      </v-alert>

      <!-- 無專案狀態 -->
      <div v-else-if="!projects || projects.length === 0" class="empty-state">
        <p>You don't have any projects yet.</p>
      </div>

      <!-- 專案列表 -->
      <div v-else class="projects-content">
        <!-- OUTDOOR 區塊 -->
        <div v-if="outdoorProjects.length > 0" class="category-section">
          <div class="category-label">OUTDOOR</div>
          <div class="category-projects">
            <div
              v-for="project in outdoorProjects"
              :key="getProjectId(project)"
              :class="['project-card', { 'project-card-active': hoveredProjectId === getProjectId(project) }]"
              @mouseenter="onCardHover(project)"
              @mouseleave="onCardLeave"
            >
              <div class="project-name">{{ project.title }}</div>
              <div class="date-badge">
                <v-icon size="14">mdi-calendar</v-icon>
                <span>{{ formatDate(project.date ?? '') }}</span>
              </div>
              <div class="user-badge">
                <v-icon size="14">mdi-account</v-icon>
                <span>{{ project.owner?.account ?? '-' }}</span>
              </div>
              <button class="view-project-link" @click="viewProject(project)">View Project</button>
              <button class="delete-project-link" @click="deleteProject(project)">Delete Project</button>
            </div>
          </div>
        </div>

        <!-- INDOOR 區塊 -->
        <div v-if="indoorProjects.length > 0" class="category-section">
          <div class="category-label">INDOOR</div>
          <div class="category-projects">
            <div
              v-for="project in indoorProjects"
              :key="getProjectId(project)"
              :class="['project-card', { 'project-card-active': hoveredProjectId === getProjectId(project) }]"
              @mouseenter="onCardHover(project)"
              @mouseleave="onCardLeave"
            >
              <div class="project-name">{{ project.title }}</div>
              <div class="date-badge">
                <v-icon size="14">mdi-calendar</v-icon>
                <span>{{ formatDate(project.date ?? '') }}</span>
              </div>
              <div class="user-badge">
                <v-icon size="14">mdi-account</v-icon>
                <span>{{ project.owner?.account ?? '-' }}</span>
              </div>
              <button class="view-project-link" @click="viewProject(project)">View Project</button>
              <button class="delete-project-link" @click="deleteProject(project)">Delete Project</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 建立專案按鈕 (底部固定) -->
      <div class="create-button-wrapper">
        <v-btn
          class="create-project-btn"
          color="#006ab5"
          block
          @click="navigateToCreate"
        >
          + CREATE NEW PROJECT
        </v-btn>
      </div>
    </div>

    <!-- Dialog for notifications -->
    <v-dialog v-model="dialogVisible" max-width="400">
      <v-card>
        <v-card-title>Notice</v-card-title>
        <v-card-text class="pt-4">{{ dialogMessage }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="handleDialogClose">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
  import { useUserStore } from '~/stores/user'
  import { computed, ref, shallowRef, watch, onMounted, onUnmounted, nextTick } from 'vue'
  import { useQuery, useQueryClient } from '@tanstack/vue-query'
  import { useRouter } from 'vue-router'
  import mapboxgl from 'mapbox-gl'
  import 'mapbox-gl/dist/mapbox-gl.css'
  import type { Project } from '~/apis/Api'

  const userStore = useUserStore()
  const { $apiClient } = useNuxtApp()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Mapbox 設定
  const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiZGFyaXVzbHVuZyIsImEiOiJjbHk3MWhvZW4wMTl6MmlxMnVhNzI3cW0yIn0.WGvtamOAfwfk3Ha4KsL3BQ'
  const DEFAULT_CENTER: [number, number] = [120.9738, 24.8138] // 新竹預設中心

  // 地圖相關
  let map: mapboxgl.Map | null = null
  const markers = shallowRef<Map<number, mapboxgl.Marker>>(new Map())
  const hoveredProjectId = ref<number | null>(null)

  // Dialog state
  const dialogVisible = ref(false)
  const dialogMessage = ref('')
  const dialogRedirectPath = ref('')

  // Computed property to check if user is admin
  const isAdmin = computed(() => userStore.user?.role === 'ADMIN')

  // Query to fetch projects based on user role
  const { data: projects, isPending, isError, error } = useQuery({
    queryKey: ['projects', userStore.user?.role, isAdmin.value],
    queryFn: async () => {
      if (isAdmin.value) {
        const response = await $apiClient.project.projectsList()
        return response.data
      } else {
        const response = await $apiClient.project.getProject()
        return response.data
      }
    },
    enabled: !!userStore.user
  })

  // 安全取得專案 ID
  const getProjectId = (project: Project): number => {
    const rawId = project?.project_id
    if (rawId == null) return 0
    const numId = Number(rawId)
    return Number.isFinite(numId) ? numId : 0
  }

  // 取得專案經緯度，若無則回傳 null
  const getProjectCoords = (project: Project): [number, number] | null => {
    const lat = project?.lat
    const lon = project?.lon
    if (lat == null || lon == null) return null
    const latNum = Number(lat)
    const lonNum = Number(lon)
    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) return null
    return [lonNum, latNum]
  }

  // TODO: 後端目前無 category 欄位，暫時使用 project_id 奇偶數模擬分類
  const outdoorProjects = computed(() => {
    if (!projects.value) return []
    return projects.value.filter((p: Project) => {
      const id = getProjectId(p)
      return id > 0 && id % 2 === 1
    })
  })

  const indoorProjects = computed(() => {
    if (!projects.value) return []
    return projects.value.filter((p: Project) => {
      const id = getProjectId(p)
      return id > 0 && id % 2 === 0
    })
  })

  // 初始化地圖
  const initMap = () => {
    const container = document.getElementById('projectsMap')
    if (!container || map) return

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN

    map = new mapboxgl.Map({
      container: 'projectsMap',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: DEFAULT_CENTER,
      zoom: 13
    })

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }))
    map.addControl(new mapboxgl.ScaleControl())

    map.on('load', () => {
      updateMarkers()
    })

    // 統一使用 movestart/moveend 來處理所有地圖移動（拖動、縮放、旋轉等）
    // 這比分散的 dragstart/zoomstart 更可靠
    map.on('movestart', () => {
      document.querySelectorAll('.custom-marker').forEach(el => {
        el.classList.add('map-moving')
      })
    })
    map.on('moveend', () => {
      // 延遲移除，確保 Mapbox 完成所有定位更新
      requestAnimationFrame(() => {
        document.querySelectorAll('.custom-marker').forEach(el => {
          el.classList.remove('map-moving')
        })
      })
    })
  }

  // 更新地圖上的 markers
  const updateMarkers = () => {
    if (!map) return

    // 移除舊的 markers
    markers.value.forEach(marker => marker.remove())
    markers.value.clear()

    // 建立新的 markers
    const coords: [number, number][] = []

    projects.value?.forEach((project: Project) => {
      const projectCoords = getProjectCoords(project)
      if (!projectCoords) return

      const projectId = getProjectId(project)
      coords.push(projectCoords)

      // 建立自訂 marker 元素
      const el = document.createElement('div')
      el.className = 'custom-marker'
      el.innerHTML = `
      <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.16 0 0 7.16 0 16C0 28 16 42 16 42C16 42 32 28 32 16C32 7.16 24.84 0 16 0Z" fill="#E53935"/>
        <circle cx="16" cy="16" r="8" fill="white"/>
      </svg>
    `
      el.dataset.projectId = String(projectId)

      // 滑鼠互動（使用 CSS class 避免覆蓋 mapbox 的定位 transform）
      el.addEventListener('mouseenter', () => {
        hoveredProjectId.value = projectId
        el.classList.add('marker-hovered')
      })
      el.addEventListener('mouseleave', () => {
        hoveredProjectId.value = null
        el.classList.remove('marker-hovered')
      })
      el.addEventListener('click', () => {
        viewProject(project)
      })

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(projectCoords)
        .addTo(map!)

      markers.value.set(projectId, marker)
    })

    // 調整地圖視野以包含所有 markers
    if (coords.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      coords.forEach(coord => bounds.extend(coord))
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 500 })
    }
  }

  // 卡片 hover 事件
  const onCardHover = (project: Project) => {
    const projectId = getProjectId(project)
    hoveredProjectId.value = projectId

    // 放大對應的 marker（使用 CSS class 避免覆蓋 mapbox transform）
    const marker = markers.value.get(projectId)
    if (marker) {
      const el = marker.getElement()
      el.classList.add('marker-hovered')
    }

    // 地圖移動到該專案
    const coords = getProjectCoords(project)
    if (coords && map) {
      map.easeTo({ center: coords, duration: 300 })
    }
  }

  const onCardLeave = () => {
    // 還原所有 marker 大小
    if (hoveredProjectId.value !== null) {
      const marker = markers.value.get(hoveredProjectId.value)
      if (marker) {
        const el = marker.getElement()
        el.classList.remove('marker-hovered')
      }
    }
    hoveredProjectId.value = null
  }

  // 導航到建立專案頁面
  const navigateToCreate = () => {
    router.push('/projects/create')
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString || dateString.trim() === '') {
      return '-'
    }
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return '-'
      }
      return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (e) {
      console.error('Date formatting error:', e)
      return '-'
    }
  }

  // 檢視專案
  const viewProject = async (project: Project) => {
    const projectId = getProjectId(project)
    try {
      const response = await $apiClient.project.getProjectRUs(projectId)
      if (response.data && response.data.length > 0) {
        router.push(`/projects/${projectId}/overviews`)
      } else {
        router.push(`/projects/${projectId}/config/evaluations`)
      }
    } catch (err) {
      console.error('Error checking project RUs:', err)
      dialogMessage.value = 'Error checking project resources'
      dialogRedirectPath.value = `/projects/${projectId}/config/evaluations`
      dialogVisible.value = true
    }
  }

  // 刪除專案
  const deleteProject = async (project: Project) => {
    const projectId = getProjectId(project)
    if (confirm(`Are you sure you want to delete project "${project.title}"?`)) {
      try {
        await $apiClient.project.projectsDelete(projectId)
        queryClient.invalidateQueries({ queryKey: ['projects'] })
      } catch (err) {
        dialogMessage.value = 'Failed to delete project.'
        dialogVisible.value = true
        console.error('Error deleting project:', err)
      }
    }
  }

  // 處理 dialog 關閉
  const handleDialogClose = () => {
    dialogVisible.value = false
    if (dialogRedirectPath.value) {
      router.push(dialogRedirectPath.value)
      dialogRedirectPath.value = ''
    }
  }

  // 監聽專案資料變化，更新 markers
  watch(projects, () => {
    nextTick(() => {
      if (map) {
        updateMarkers()
      }
    })
  })

  // 元件掛載時初始化地圖
  onMounted(() => {
    nextTick(() => {
      initMap()
    })
  })

  // 元件卸載時清理地圖
  onUnmounted(() => {
    if (map) {
      map.remove()
      map = null
    }
    markers.value.clear()
  })
</script>

<style scoped>
.projects-page {
  display: flex;
  height: calc(100vh - 64px - 36px); /* 扣除 header 和 footer */
  overflow: hidden;
}

/* 左側地圖區域 */
.map-section {
  flex: 0 0 55%;
  position: relative;
  border: 4px solid #333;
  border-radius: 0;
}

.map-container {
  width: 100%;
  height: 100%;
}

/* 右側專案面板 */
.projects-panel {
  flex: 0 0 45%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #e8e8e8;
  border-bottom: 1px solid #ddd;
}

.panel-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  color: #666;
  font-size: 16px;
}

.projects-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 分類區塊 */
.category-section {
  background: transparent;
}

.category-label {
  display: inline-block;
  background: rgba(55, 54, 72, 0.48);
  color: white;
  font-size: 24px;
  font-weight: 500;
  padding: 6px 20px;
  border-radius: 20px;
  margin-bottom: 12px;
}

.category-projects {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 專案卡片 */
.project-card {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  padding: 14px 16px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.project-card:hover,
.project-card-active {
  border-color: #006ab5;
  box-shadow: 0 2px 8px rgba(0, 106, 181, 0.2);
}

.project-name {
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.date-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 106, 181, 0.31);
  color: #006ab5;
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 20px;
  margin-right: 8px;
  margin-bottom: 8px;
}

.user-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.15);
  color: rgba(0, 0, 0, 0.35);
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 20px;
  margin-bottom: 8px;
}

.view-project-link,
.delete-project-link {
  display: block;
  font-size: 15px;
  cursor: pointer;
  background: none;
  border: none;
  padding: 2px 0;
  text-align: left;
}

.view-project-link {
  color: #006ab5;
}

.delete-project-link {
  color: #b50003;
}

.view-project-link:hover,
.delete-project-link:hover {
  text-decoration: underline;
}

/* 建立按鈕區域 */
.create-button-wrapper {
  padding: 16px;
  background: #ffffff;
  border-top: 1px solid #ddd;
}

.create-project-btn {
  border-radius: 6px;
  font-weight: 600;
  color: white !important;
  text-transform: none;
  font-size: 15px;
}

/* 自訂 marker 樣式 - 容器固定大小，所有效果只在 SVG 上 */
:global(.custom-marker) {
  cursor: pointer;
  /* 固定容器大小，絕不改變 - 避免干擾 Mapbox 定位 */
  width: 32px;
  height: 42px;
  z-index: 1;
  /* 禁用容器上的 pointer-events 以防止拖動干擾 */
  pointer-events: none;
  /* 隔離布局，防止內部變化影響 Mapbox 定位計算 */
  contain: layout style;
}

:global(.custom-marker svg) {
  /* 使用固定尺寸，不使用 transform 來縮放 */
  display: block;
  width: 32px;
  height: 42px;
  /* 啟用 pointer-events */
  pointer-events: auto;
}

/* 只在地圖靜止時才允許過渡效果 */
:global(.custom-marker:not(.map-moving) svg) {
  transition: width 0.12s ease-out, height 0.12s ease-out, filter 0.12s ease-out;
}

/* 地圖移動時完全禁用所有動畫和過渡 */
:global(.custom-marker.map-moving),
:global(.custom-marker.map-moving svg) {
  transition: none !important;
  animation: none !important;
}

:global(.custom-marker:hover),
:global(.custom-marker.marker-hovered) {
  z-index: 100 !important;
}

/* hover 時改變 SVG 尺寸（而非 transform），避免與 Mapbox 內部定位衝突 */
:global(.custom-marker:not(.map-moving):hover svg),
:global(.custom-marker:not(.map-moving).marker-hovered svg) {
  width: 38px;
  height: 50px;
  /* 向上偏移以保持圖釘尖端位置不變 */
  margin-top: -8px;
  margin-left: -3px;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.35));
}

/* RWD 響應式 */
@media (max-width: 1024px) {
  .projects-page {
    flex-direction: column;
    height: auto;
  }

  .map-section {
    flex: none;
    height: 300px;
  }

  .projects-panel {
    flex: none;
    height: auto;
    min-height: 400px;
  }

  .projects-content {
    max-height: 500px;
  }
}
</style>
