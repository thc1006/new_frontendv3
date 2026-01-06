<template>
  <v-container>
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card class="welcome-card">
          <v-card-title class="text-h4">
            Welcome, {{ userStore.user?.account }}
          </v-card-title>
          <v-card-subtitle class="text-subtitle-1 pb-4">
            Role: {{ userStore.user?.role }}
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" class="d-flex align-center">
        <h2 class="text-h5">Your Projects</h2>
        <v-spacer/>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="navigateToCreate">
          Create New Project
        </v-btn>
      </v-col>
    </v-row>

    <v-row v-if="isPending">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary"/>
      </v-col>
    </v-row>

    <v-row v-else-if="isError">
      <v-col cols="12">
        <v-alert type="error">
          Failed to load projects: {{ error }}
        </v-alert>
      </v-col>
    </v-row>

    <v-row v-else-if="!projects || projects.length === 0">
      <v-col cols="12">
        <v-alert type="info" border="start" elevation="2" icon="mdi-information">
          <div class="text-center pa-4">
            <p class="mb-4">You don't have any projects yet.</p>
            <v-btn color="primary" @click="navigateToCreate">
              Create Your First Project
            </v-btn>
          </div>
        </v-alert>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col
        v-for="project in projects" 
        :key="getProjectId(project)" 
        cols="12" sm="6" md="4" lg="3">
        <v-card height="100%" class="d-flex flex-column" elevation="2">
          <v-card-title class="text-truncate">{{ project.title }}</v-card-title>
          <v-card-text>
            <div class="d-flex flex-column">
              <v-chip size="small" color="primary" class="mb-2">
                <v-icon start>mdi-calendar</v-icon>
                {{ formatDate(project.date ?? '') }}
              </v-chip>
              <v-chip size="small" color="grey" class="mb-2">
                <v-icon start>mdi-account</v-icon>
                {{ project.owner?.account }}
              </v-chip>
            </div>
            <!-- Centered action buttons, two lines -->
            <div class="d-flex flex-column align-center justify-center mt-4">
              <v-btn color="primary" variant="text" class="mb-2" @click="viewProject(project)">
                <v-icon start>mdi-eye</v-icon>
                View Project
              </v-btn>
              <v-btn color="red" variant="text" @click="deleteProject(project)">
                <v-icon start>mdi-delete</v-icon>
                Delete Project
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog for notifications -->
    <v-dialog v-model="dialogVisible" max-width="400">
      <v-card>
        <v-card-title>Notice</v-card-title>
        <v-card-text class="pt-4">{{ dialogMessage }}</v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn color="primary" @click="handleDialogClose">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
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
  const { data: projects , isPending , isError, error} = useQuery({
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

  // Function to create a new project
  const navigateToCreate = () => {
    router.push('/projects/create')
  }
  
  // Utility function to format dates consistently
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Date formatting error:', e);
      return 'Invalid date';
    }
  }
  
  // Helper to get project ID consistently
  const getProjectId = (project: any) => project.project_id;

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
      dialogMessage.value = "Error checking project resources"
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
        dialogMessage.value = "Failed to delete project."
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
