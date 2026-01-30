<template>
  <v-container>
    <!-- Error Dialog -->
    <v-dialog v-model="errorDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5">Access Error</v-card-title>
        <v-card-text>{{ errorMessage }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="handleDialogClose">
            Return to Projects
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Loading -->
    <v-row v-if="isLoadingProject">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary" />
        <p class="mt-2">Checking if project exists...</p>
      </v-col>
    </v-row>

    <!-- Main Content -->
    <v-row v-else-if="projectExists && hasProjectAccess" justify="center" align="center">
      <v-col cols="12" sm="12" md="10" lg="8">
        <!-- page title -->
        <h2 class="text-h4 font-weight-bold mb-4">Project Setting</h2>

        <!-- form start -->
        <v-form>
          <!-- Project Name -->
          <v-row class="align-center mb-4">
            <v-col cols="3" class="d-flex align-center">
              <label class="text-h6 font-weight-medium">Project Name</label>
            </v-col>

            <v-col cols="5">
              <span
                v-if="!isEditingName"
                class="text-h6"
              >
                {{ projectName }}
              </span>
              <v-text-field
                v-else
                v-model="editedProjectName"
                density="comfortable"
                :rules="[rules.required]"
                required
                hide-details
                class="mt-n2"
              />
            </v-col>

            <v-col cols="4" class="d-flex align-center justify-start">
              <v-btn
                class="btn-fixed-width"
                color="primary"
                style="text-transform: capitalize"
                @click="toggleEditName"
              >
                {{ isEditingName ? 'Save' : 'Edit' }}
              </v-btn>
            </v-col>
          </v-row>

          <!-- Map preview -->
          <div>
            <v-row>
              <v-col cols="8" class="d-flex align-start justify-start">
                <div class="mt-4" style="position: relative; aspect-ratio: 1 / 1; border-radius: 12px; overflow: hidden; width: 100%; max-width: 600px;">
                  <div id="createMap" ref="mapContainer" style="height: 100%; width: 100%;" />
                  <div class="map-center-marker" />
                </div>
              </v-col>
              <v-col cols="4" class="d-flex align-start justify-start">
                <div>
                  <div class="text-body-1">lng: {{ coordinates.x.toFixed(6) }} </div>
                  <div class="text-body-1">lat: {{ coordinates.y.toFixed(6) }}</div>
                  <div class="text-body-1">Scope: {{ visibleScope }} × {{ visibleScope }} m</div>
                </div>
              </v-col>
            </v-row>
          </div>

          <!-- Members List -->
          <div class="mt-6">
            <label class="text-h6 font-weight-medium">Members List</label>
            <v-row dense>
              <v-col cols="8">
                <v-text-field 
                  v-model="inviteEmail" 
                  label="email" 
                  density="comfortable" 
                  outlined 
                  :rules="[rules.email]"
                />
              </v-col>
              <v-col cols="4" class="d-flex">
                <v-btn
                  class="btn-fixed-width me-2"
                  color="primary"
                  style="text-transform: capitalize"
                  :disabled="inviteDisabled"
                  @click="invite"
                >
                  Invite
                </v-btn>
                <v-btn
                  class="btn-fixed-width"
                  variant="outlined"
                  color="red"
                  style="text-transform: capitalize"
                  :disabled="removeDisabled"
                  @click="removeMember"
                >
                  Remove
                </v-btn>
              </v-col>
            </v-row>

            <!-- Displayed Members -->
            <v-row>
              <div class="mt-2">
                <p
                  v-for="(email, idx) in memberEmails"
                  :key="email"
                  :class="{ 'selected-member': selectedMemberIdx === idx }"
                  style="cursor: pointer"
                  @click="selectMember(idx)"
                >
                  {{ email }}
                  <span v-if="idx === 0" class="text-grey">Owner</span>
                  <span v-else class="text-grey">Participant</span>
                </p>
              </div>
            </v-row>
          </div>

          <!-- Action Buttons -->
          <div class="d-flex justify-start mt-4">
            <v-btn
              class="btn-fixed-width me-3"
              color="grey"
              style="text-transform: capitalize"
              @click="back"
            >
              Back
            </v-btn>
            <v-btn
              class="btn-fixed-width"
              color="red"
              style="text-transform: capitalize"
              @click="deleteProject"
            >
              Delete
            </v-btn>
          </div>
        </v-form>
      </v-col>
    </v-row>

    <!-- Delete Confirmation Dialog (Figma 3:876) -->
    <v-dialog v-model="deleteConfirmDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h5 d-flex align-center">
          <v-icon color="warning" class="me-2">mdi-alert</v-icon>
          Warning
        </v-card-title>
        <v-card-text>
          This action will delete the whole project and cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            style="text-transform: capitalize"
            @click="deleteConfirmDialog = false"
          >
            Back
          </v-btn>
          <v-btn
            color="red"
            style="text-transform: capitalize"
            @click="confirmDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
    >
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">

  import 'mapbox-gl/dist/mapbox-gl.css'

  import { computed, ref, watchEffect } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { navigateTo } from '#app'
  import { useQuery } from '@tanstack/vue-query'
  import mapboxgl from 'mapbox-gl'
  import { useUserStore } from '~/stores/user'

  const route = useRoute()
  const router = useRouter()
  const projectId = ref('')
  const { $apiClient } = useNuxtApp()

  const rules = {
    required: (v: string) => !!v || 'This field is required',
    email:    (v: string) => /.+@.+\..+/.test(v) || 'Invalid email format',
  }
  const projectName = ref<string | null>(null)

  const coordinates = ref({ x: 0, y: 0 })
  const mapContainer = ref<HTMLDivElement | null>(null)
  const visibleScope = ref(0)
  const isLoading = ref(false)
  
  let map: mapboxgl.Map
  
  const inviteEmail = ref('')
  const memberEmails = ref<string[]>([])
  const selectedMemberIdx = ref<number | null>(null)
  const deleteConfirmDialog = ref(false)
  const snackbar = ref({
    show: false,
    text: '',
    color: 'info'
  })

  watchEffect(() => {
    if (route.params.projectId) {
      projectId.value = String(route.params.projectId)
    }
  })

  const errorDialog = ref(false)
  const errorMessage = ref('')
  const projectExists = ref(false)

  const validProjectId = computed(() => {
    const id = projectId.value
    return id && id !== '' ? Number(id) : null
  })

  const isEditingName = ref(false)
  const editedProjectName = ref('')

  const toggleEditName = async () => {
    if (isEditingName.value) {
      if (
        validProjectId.value !== null &&
        editedProjectName.value &&
        editedProjectName.value !== projectName.value
      ) {
        const data = {
          title: editedProjectName.value, // new projectName
        }
        try {
          await $apiClient.project.projectsUpdate(validProjectId.value, data)
          projectName.value = editedProjectName.value
          snackbar.value = {
            show: true,
            text: 'Project name updated successfully',
            color: 'success'
          }
        } catch (err) {
          snackbar.value = {
            show: true,
            text: 'Failed to update project name',
            color: 'error'
          }
          console.error(err)
        }
      }
    } else {
      editedProjectName.value = projectName.value ?? ''
    }
    isEditingName.value = !isEditingName.value
  }

  const { isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      try {
        if (!validProjectId.value) {
          throw new Error('Invalid project ID')
        }
        const response = await $apiClient.project.projectsDetail(validProjectId.value)
        projectExists.value = true
        projectName.value = response.data.title ? String(response.data.title) : null
        coordinates.value = (response.data.lon && response.data.lat) ? { x: Number(response.data.lon), y: Number(response.data.lat) } : { x: 0, y: 0 }
        visibleScope.value = response.data.margin ? Number(response.data.margin*2) : 0
        // Initialize member list (first one is Owner)
        const ownerData = response.data.owner as { account?: string; email?: string } | undefined
        const ownerEmail = ownerData?.email || ownerData?.account || 'owner@example.com'
        if (memberEmails.value.length === 0) {
          memberEmails.value = [ownerEmail]
        } else {
          // refetch 時確保 owner email 是最新的
          memberEmails.value[0] = ownerEmail
        }
        return response.data
      } catch (err: unknown) {
        const error = err as { response?: { status?: number } }
        if (error.response?.status === 404) {
          errorMessage.value = `Project with ID ${projectId.value} not found.`
          errorDialog.value = true
          projectExists.value = false
        }
        throw err
      }
    },
    enabled: computed(() => !!validProjectId.value)
  })

  const shouldFetchUserProjects = computed(() => projectExists.value)
  const userStore = useUserStore()
  const isAdmin = computed(() => userStore.user?.role === 'ADMIN')

  const { data: userProjects, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['userProjects'],
    queryFn: async () => {
      const response = await $apiClient.project.getProject()
      return response.data
    },
    enabled: computed(() => shouldFetchUserProjects.value && !isAdmin.value)
  })

  const hasProjectAccess = computed(() => {
    if (isAdmin.value) return true
    const projects = userProjects.value
    if (!projects) return false
    if (!Array.isArray(projects)) return false
    return projects.some(project => String(project.project_id) === projectId.value)
  })

  watchEffect(() => {
    if (!isLoadingProject.value &&
      projectExists.value &&
      !isLoadingPermissions.value &&
      !isAdmin.value &&
      userProjects.value &&
      !hasProjectAccess.value) {
      errorMessage.value = `Permission denied. You don't have access to project with ID ${projectId.value}.`
      errorDialog.value = true
    }
  })

  watchEffect(() => {
    if (
      projectExists.value &&
      hasProjectAccess.value &&
      mapContainer.value &&
      !map 
    ) {
      ;(async () => {
        try {
          mapboxgl.accessToken = 'pk.eyJ1IjoiZGFyaXVzbHVuZyIsImEiOiJjbHk3MWhvZW4wMTl6MmlxMnVhNzI3cW0yIn0.WGvtamOAfwfk3Ha4KsL3BQ'

          const config = useRuntimeConfig()
          const isOnline = config.public?.isOnline
          const onlineStyle = 'mapbox://styles/mapbox/streets-v12'
          const offlineStyle = config.public?.offlineMapboxGLJSURL
          // Cast runtime config value to the expected Mapbox style type to satisfy TypeScript
          const initialStyle = (isOnline ? onlineStyle : offlineStyle) as string | mapboxgl.StyleSpecification | undefined

          map = new mapboxgl.Map({
            container: mapContainer.value as HTMLElement,
            style: initialStyle,
            center: [coordinates.value.x, coordinates.value.y],
            zoom: 18,
            pitch: 0,
            projection: 'globe',
          })

          const nav = new mapboxgl.NavigationControl({ visualizePitch: true })
          map.addControl(nav, 'top-right')
          map.addControl(new mapboxgl.ScaleControl())

          const marker = new mapboxgl.Marker()
          marker.setLngLat([coordinates.value.x, coordinates.value.y])
          marker.addTo(map)
        } catch (error) {
          console.error('Error initializing map in setting.vue:', error)
        }
      })()
    }
  })

  const handleDialogClose = () => {
    errorDialog.value = false
    navigateTo('/')
  }

  // Disable invite button
  const inviteDisabled = computed(() => {
    return !inviteEmail.value || rules.email(inviteEmail.value) !== true
  })

  // Disable remove button - Owner (idx=0) cannot be removed
  const removeDisabled = computed(() => {
    return selectedMemberIdx.value === null || selectedMemberIdx.value === 0
  })

  function selectMember(idx: number) {
    selectedMemberIdx.value = idx
  }

  function removeMember() {
    if (selectedMemberIdx.value !== null && selectedMemberIdx.value > 0) {
      // TODO: Backend API not yet implemented - DELETE /projects/{id}/members/{memberId}
      const removed = memberEmails.value.splice(selectedMemberIdx.value, 1)
      selectedMemberIdx.value = null
      snackbar.value = {
        show: true,
        text: `Member ${removed[0]} removed (placeholder - not persisted)`,
        color: 'warning'
      }
    }
  }

  function invite() {
    if (
      inviteEmail.value &&
      rules.email(inviteEmail.value) === true &&
      !memberEmails.value.includes(inviteEmail.value)
    ) {
      memberEmails.value.push(inviteEmail.value)
      inviteEmail.value = ''
      snackbar.value = {
        show: true,
        text: 'Member invited (placeholder - not persisted)',
        color: 'warning'
      }
    }
  }

  function back() {
    router.back()
  }

  // Show confirmation dialog when Delete button is clicked
  function deleteProject() {
    deleteConfirmDialog.value = true
  }

  // Confirm delete project
  async function confirmDelete() {
    deleteConfirmDialog.value = false
    isLoading.value = true
    if (validProjectId.value !== null) {
      try {
        await $apiClient.project.projectsDelete(validProjectId.value)
        snackbar.value = {
          show: true,
          text: `Project "${projectName.value}" deleted successfully`,
          color: 'success'
        }
        navigateTo(`/`)
      } catch (e) {
        snackbar.value = {
          show: true,
          text: 'Failed to delete project',
          color: 'error'
        }
        console.error(e)
      } finally {
        isLoading.value = false
      }
    }
  }
  
</script>

<style scoped>

.btn-fixed-width {
  min-width: 90px;
}

.custom-marker {
  background-color: red;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid white;
}

.selected-member {
  background-color: #e3f2fd;
  padding: 4px 8px;
  border-radius: 4px;
}

</style>