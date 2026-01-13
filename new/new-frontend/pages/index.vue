<template>
  <div class="projects-list-container">
    <!-- 歡迎區塊 -->
    <div class="welcome-section">
      <v-card class="welcome-card">
        <v-card-title class="text-h4">
          Welcome, {{ userStore.user?.account }}
        </v-card-title>
        <v-card-subtitle class="text-subtitle-1 pb-4">
          Role: {{ userStore.user?.role }}
        </v-card-subtitle>
      </v-card>
    </div>

    <!-- 標題與建立按鈕 -->
    <div class="header-section">
      <h2 class="section-title">Your Projects</h2>
      <v-btn
        class="create-project-btn"
        color="#006ab5"
        @click="navigateToCreate"
      >
        + CREATE NEW PROJECT
      </v-btn>
    </div>

    <!-- 載入中狀態 -->
    <div v-if="isPending" class="loading-state">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <!-- 錯誤狀態 -->
    <v-alert v-else-if="isError" type="error" class="mb-4">
      Failed to load projects: {{ error }}
    </v-alert>

    <!-- 無專案狀態 -->
    <v-alert
      v-else-if="!projects || projects.length === 0"
      type="info"
      border="start"
      elevation="2"
      icon="mdi-information"
      class="mb-4"
    >
      <div class="text-center pa-4">
        <p class="mb-4">You don't have any projects yet.</p>
        <v-btn color="primary" @click="navigateToCreate">
          Create Your First Project
        </v-btn>
      </div>
    </v-alert>

    <!-- 專案列表 -->
    <div v-else class="projects-content">
      <!-- OUTDOOR 區塊 -->
      <div class="category-section">
        <div class="category-label outdoor-label">OUTDOOR</div>
        <div class="category-projects">
          <div
            v-for="project in outdoorProjects"
            :key="getProjectId(project)"
            class="project-card"
          >
            <div class="project-name">{{ project.title }}</div>
            <div class="date-badge">
              <v-icon size="14">mdi-calendar</v-icon>
              <span>{{ formatDate(project.date ?? '') }}</span>
            </div>
            <div class="user-badge">
              <v-icon size="14">mdi-account</v-icon>
              <span>{{ project.owner?.account }}</span>
            </div>
            <a class="view-project-link" @click="viewProject(project)">View Project</a>
            <a class="delete-project-link" @click="deleteProject(project)">Delete Project</a>
          </div>
        </div>
      </div>

      <!-- INDOOR 區塊 -->
      <div class="category-section">
        <div class="category-label indoor-label">INDOOR</div>
        <div class="category-projects">
          <div
            v-for="project in indoorProjects"
            :key="getProjectId(project)"
            class="project-card"
          >
            <div class="project-name">{{ project.title }}</div>
            <div class="date-badge">
              <v-icon size="14">mdi-calendar</v-icon>
              <span>{{ formatDate(project.date ?? '') }}</span>
            </div>
            <div class="user-badge">
              <v-icon size="14">mdi-account</v-icon>
              <span>{{ project.owner?.account }}</span>
            </div>
            <a class="view-project-link" @click="viewProject(project)">View Project</a>
            <a class="delete-project-link" @click="deleteProject(project)">Delete Project</a>
          </div>
        </div>
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
import { computed, ref } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const { $apiClient } = useNuxtApp()
const router = useRouter()
const queryClient = useQueryClient()

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
      // Admin: Get all projects
      const response = await $apiClient.project.projectsList()
      return response.data
    } else {
      // Regular user: Get user's projects using the /projects/me endpoint
      const response = await $apiClient.project.getProject()
      return response.data
    }
  },
  enabled: !!userStore.user
})

// TODO: 後端目前無 category 欄位，暫時使用 project_id 奇偶數模擬分類
// 待後端擴充後改為：project.category === 'OUTDOOR'
const outdoorProjects = computed(() => {
  if (!projects.value) return []
  return projects.value.filter((p: any) => getProjectId(p) % 2 === 1)
})

const indoorProjects = computed(() => {
  if (!projects.value) return []
  return projects.value.filter((p: any) => getProjectId(p) % 2 === 0)
})

// Function to create a new project
const navigateToCreate = () => {
  router.push('/projects/create')
}

// Utility function to format dates consistently
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (e) {
    console.error('Date formatting error:', e)
    return 'Invalid date'
  }
}

// Helper to get project ID consistently
const getProjectId = (project: any) => project.project_id

// Function to view a project and check if it has RUs
const viewProject = async (project: any) => {
  const projectId = getProjectId(project)
  try {
    // Call API to check if the project has RUs
    const response = await $apiClient.project.getProjectRUs(projectId)

    if (response.data && response.data.length > 0) {
      // Project has RUs, navigate to overview
      router.push(`/projects/${projectId}/overviews`)
    } else {
      // No RUs found, directly navigate to evaluation (no dialog)
      router.push(`/projects/${projectId}/config/evaluations`)
    }
  } catch (error) {
    console.error('Error checking project RUs:', error)
    dialogMessage.value = 'Error checking project resources'
    dialogRedirectPath.value = `/projects/${projectId}/config/evaluations`
    dialogVisible.value = true
  }
}

// Function to delete a project
const deleteProject = async (project: any) => {
  const projectId = getProjectId(project)
  if (confirm(`Are you sure you want to delete project "${project.title}"?`)) {
    try {
      await $apiClient.project.projectsDelete(projectId)
      // Refresh projects list
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    } catch (error) {
      dialogMessage.value = 'Failed to delete project.'
      dialogVisible.value = true
      console.error('Error deleting project:', error)
    }
  }
}

// Handle dialog close with navigation if needed
const handleDialogClose = () => {
  dialogVisible.value = false
  if (dialogRedirectPath.value) {
    router.push(dialogRedirectPath.value)
    dialogRedirectPath.value = ''
  }
}
</script>

<style scoped>
.projects-list-container {
  padding: 24px 32px;
  max-width: 1400px;
  margin: 0 auto;
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.welcome-section {
  margin-bottom: 24px;
}

.welcome-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.section-title {
  margin: 0;
  font-weight: 600;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 24px;
  background: linear-gradient(180deg, #1976d2, #42a5f5);
  border-radius: 2px;
}

.create-project-btn {
  border-radius: 5px;
  font-weight: 600;
  color: white !important;
  padding: 12px 24px;
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 48px;
}

.projects-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.category-section {
  background: #b7b7b7;
  border-radius: 8px;
  padding: 16px;
  min-height: 200px;
}

.category-label {
  display: inline-block;
  background: rgba(55, 54, 72, 0.48);
  color: white;
  font-size: 18px;
  font-weight: 500;
  padding: 8px 24px;
  border-radius: 20px;
  margin-bottom: 16px;
}

.category-projects {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.project-card {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  padding: 16px;
  width: 240px;
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
}

.project-name {
  font-size: 20px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 12px;
}

.date-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 106, 181, 0.31);
  color: #006ab5;
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 20px;
  margin-bottom: 8px;
}

.user-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.15);
  color: rgba(0, 0, 0, 0.55);
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 20px;
  margin-bottom: 12px;
}

.view-project-link {
  display: block;
  color: #006ab5;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 4px;
}

.view-project-link:hover {
  text-decoration: underline;
}

.delete-project-link {
  display: block;
  color: #b50003;
  font-size: 14px;
  cursor: pointer;
}

.delete-project-link:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .project-card {
    width: 100%;
  }
}
</style>
