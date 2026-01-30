<template>
  <v-container fluid class="overview-page pa-0">
    <!-- Error Dialog -->
    <v-dialog v-model="errorDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5">Access Error</v-card-title>
        <v-card-text>{{ errorMessage }}</v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn color="primary" @click="handleDialogClose">
            Return to Projects
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Page Title - Figma: 17:532 -->
    <h1 class="overview-title">Overview</h1>

    <!-- Loading 狀態：專案資料載入中，專案ID尚未設定，或權限資料載入中（非管理員） -->
    <v-row v-if="isLoadingProject || isProjectPending || (!isAdmin && isLoadingPermissions && projectExists)" class="px-4">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary" />
        <p class="mt-2">{{ isLoadingProject ? 'Loading project...' : 'Checking permissions...' }}</p>
      </v-col>
    </v-row>

    <!-- Main Content Card - Figma: 141:26092 -->
    <div v-else-if="projectExists && hasProjectAccess" class="overview-card mx-4">
      <!-- Project ID Header - Figma: 141:26112 -->
      <div class="project-header">
        <span class="project-title">Project ID : {{ projectTitle || projectId }}</span>
        <v-chip v-if="projectType === 'INDOOR'" size="small" color="info" class="ml-2">INDOOR</v-chip>
      </div>

      <!-- Map Container - Figma: 141:26115 -->
      <div class="map-wrapper">
        <div id="mapContainer"/>

        <!-- Control Panel - Figma design matching -->
        <div class="control-panel">
          <!-- Heatmap Toggle -->
          <div class="control-item">
            <span class="control-label">Heatmap</span>
            <v-switch
              v-model="heatmapEnabled"
              color="primary"
              hide-details
              :disabled="isLoadingProject"
              density="compact"
              class="control-switch"
              @change="onHeatmapToggle"
            />
          </div>

          <!-- Heatmap Type Selector -->
          <div class="control-item">
            <v-select
              v-model="heatmapType"
              :items="[
                { title: 'RSRP', value: HeatmapTypeEnum.RSRP },
                { title: 'RSRP_DT', value: HeatmapTypeEnum.RSRP_DT },
                { title: 'Throughput', value: HeatmapTypeEnum.THROUGHPUT },
                { title: 'Throughput_DT', value: HeatmapTypeEnum.THROUGHPUT_DT }
              ]"
              :disabled="!heatmapEnabled"
              density="compact"
              hide-details
              variant="outlined"
              class="heatmap-select"
            />
          </div>

          <!-- Edit Model Toggle -->
          <div class="control-item">
            <span class="control-label">Edit Model</span>
            <v-switch
              v-model="modelEditEnabled"
              color="deep-purple"
              hide-details
              density="compact"
              class="control-switch"
            />
          </div>

          <!-- Upload 3D Model Button -->
          <div class="control-item upload-section">
            <input
              ref="gltfFileInput"
              type="file"
              accept=".gltf"
              style="display: none;"
              @change="handleGltfUpload"
            />
            <v-btn
              size="small"
              color="teal"
              variant="outlined"
              class="upload-btn"
              @click="triggerGltfUpload"
            >
              <v-icon start size="small">mdi-upload</v-icon>
              Upload 3D
            </v-btn>
            <span class="upload-hint">僅限.gltf格式檔名的模型</span>
          </div>

          <!-- Update Heatmap Button - Figma blue button -->
          <button class="update-heatmap-btn" @click="updateHeatmap">
            Update Heatmap
          </button>

          <!-- Last Updated -->
          <div class="last-updated">
            <span>Last updated:</span>
            <span>{{ lastUpdatedTime }}</span>
          </div>
        </div>

        <!-- Color Bar -->
        <div v-show="heatmapEnabled" class="color-bar-container">
          <div class="color-bar-labels">
            <span class="color-bar-max">{{ colorBarMax }}</span>
            <span class="color-bar-min">{{ colorBarMin }}</span>
          </div>
          <div class="color-bar"/>
        </div>
      </div>
    </div>

    <!-- Fallback for access denied or project not found -->
    <v-row v-else class="px-4">
      <v-col cols="12" class="text-center">
        <v-alert type="warning" class="mb-4">
          <template v-if="!projectExists">
            Project not found. The project may have been deleted or does not exist.
          </template>
          <template v-else-if="!hasProjectAccess">
            You do not have access to this project.
          </template>
          <template v-else>
            Unable to load project. Please try again.
          </template>
        </v-alert>
        <v-btn color="primary" @click="handleDialogClose">
          Return to Projects
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import { useRoute, useRouter } from 'vue-router'
  import { useQuery } from '@tanstack/vue-query'
  import { ref, computed, watchEffect, nextTick, onUnmounted, watch, onMounted } from 'vue'
  import mapboxgl from 'mapbox-gl'
  import 'mapbox-gl/dist/mapbox-gl.css'
  import 'threebox-plugin/dist/threebox.css'
  import * as Threebox from 'threebox-plugin'
  import { createModuleLogger } from '~/utils/logger'
  import { useUserStore } from '~/stores/user'
  import { getHeatmapConfig } from '~/utils/mapCoordinatetools'
  import * as THREE from 'three'

  const log = createModuleLogger('Overviews')

  const route = useRoute()
  const router = useRouter()
  // Initialize projectId directly from route params to avoid first-render race condition
  const projectId = ref(route.params.projectId ? String(route.params.projectId) : '')
  const { $apiClient } = useNuxtApp()
  const config = useRuntimeConfig()
  const isOnline = config.public?.isOnline

  // Keep projectId in sync with route changes (for navigation between projects)
  watchEffect(() => {
    if (route.params.projectId) {
      projectId.value = String(route.params.projectId)
    }
  })

  let map: mapboxgl.Map | null = null
  const mapAccessToken = 'pk.eyJ1IjoiZGFyaXVzbHVuZyIsImEiOiJjbHk3MWhvZW4wMTl6MmlxMnVhNzI3cW0yIn0.WGvtamOAfwfk3Ha4KsL3BQ'
  // Two styles: prefer online style when online; fallback to local style when offline
  // 使用國土測繪中心 WMTS 圖資
  const onlineStyle: mapboxgl.StyleSpecification = {
    version: 8,
    sources: {
      'nlsc-emap': {
        type: 'raster',
        tiles: [
          'https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution: '&copy; <a href="https://maps.nlsc.gov.tw/" target="_blank">國土測繪中心</a>'
      }
    },
    layers: [
      {
        id: 'nlsc-emap-layer',
        type: 'raster',
        source: 'nlsc-emap',
        minzoom: 0,
        maxzoom: 20
      }
    ]
  }
  const offlineStyle = config.public?.offlineMapboxGLJSURL
  const errorDialog = ref(false)
  const errorMessage = ref('')
  // Note: projectExists is now computed from query data (see below)

  const validProjectId = computed(() => {
    const id = projectId.value
    return id && id !== '' ? Number(id) : null
  })

  const projectLat = ref<number | null>(null)
  const projectLon = ref<number | null>(null)
  const projectMargin = ref<number | null>(null)
  const modelScale = ref(1.0)

  // 專案類型偵測 (INDOOR/OUTDOOR)
  // TODO: 待後端 API 提供 type 欄位後可直接使用 response.data.type
  const projectType = ref<'INDOOR' | 'OUTDOOR'>('OUTDOOR')
  const projectTitle = ref<string>('')

  const modelLonOffset = ref<number| null>(null)
  const modelLatOffset = ref<number | null>(null)
  const modelRotateOffset = ref<number | null>(null)
  const modelScalingOffset = ref<number | null>(null)
  // Full 4x4 rotation matrix from map_position for 3D model orientation
  const modelRotationMatrix = ref<number[] | null>(null)

  const { isLoading: isLoadingProject, data: projectQueryData, isError: isProjectError, isPending: isProjectPending } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!validProjectId.value) {
        throw new Error('Invalid project ID')
      }
      try {
        const response = await $apiClient.project.projectsDetail(validProjectId.value)
        // All data processing is handled by the watcher below
        // This ensures consistent behavior for both fresh fetches and cached data
        return response.data
      } catch (err: unknown) {
        const axiosError = err as { response?: { status?: number } }
        if (axiosError.response?.status === 404) {
          errorMessage.value = `Project with ID ${projectId.value} not found.`
          errorDialog.value = true
        }
        throw err
      }
    },
    enabled: computed(() => !!validProjectId.value)
  })

  // Compute projectExists from query data - this ensures it reflects cached data on remount
  // When Vue Query serves cached data, projectQueryData will be populated immediately
  // Also treat as "exists" while query is pending (loading/disabled) to avoid premature "not found" error
  const projectExists = computed(() => {
    // If query hasn't completed yet (loading or disabled), assume project exists to avoid flash of error
    if (isProjectPending.value) return true
    // Once query completes, check if we have data and no error
    return !!projectQueryData.value && !isProjectError.value
  })

  // Sync project data when query data changes (handles both fresh fetch and cache)
  // This ensures projectLat, projectLon, etc. are set even when data is served from cache
  watch(projectQueryData, (data) => {
    if (!data) return

    log.info('[3D Debug] projectQueryData watch triggered', {
      hasData: !!data,
      hasMapPosition: !!data.map_position,
      mapPositionType: typeof data.map_position
    })

    projectLat.value = data.lat ? Number(data.lat) : null
    projectLon.value = data.lon ? Number(data.lon) : null

    // Extract model positioning from map_position if available
    let mapPosition = null
    if (data.map_position) {
      try {
        mapPosition = typeof data.map_position === 'string'
          ? JSON.parse(data.map_position)
          : data.map_position
        log.info('[3D Debug] map_position parsed successfully', {
          hasRotation: !!mapPosition?.rotation,
          rotationLength: mapPosition?.rotation?.length,
          rotationValues: mapPosition?.rotation?.slice?.(0, 4)
        })
      } catch (e) {
        log.warn('Failed to parse map_position from cached data', e)
      }
    }

    // Calculate margin from bbox
    if (mapPosition?.bbox) {
      const bbox = mapPosition.bbox
      const width = Math.abs((bbox.max?.x || 0) - (bbox.min?.x || 0))
      const height = Math.abs((bbox.max?.y || 0) - (bbox.min?.y || 0))
      projectMargin.value = Math.max(width, height)
    } else {
      projectMargin.value = data.margin ? Number(data.margin) : 77
    }

    // Extract rotation from 4x4 rotation matrix
    if (mapPosition?.rotation && Array.isArray(mapPosition.rotation) && mapPosition.rotation.length >= 16) {
      modelRotationMatrix.value = mapPosition.rotation
      const cosTheta = mapPosition.rotation[0]
      const sinTheta = mapPosition.rotation[1]
      const rotationAngle = Math.atan2(sinTheta, cosTheta) * (180 / Math.PI)
      modelRotateOffset.value = rotationAngle
      log.info('[3D Debug] Set modelRotationMatrix from 4x4 matrix', {
        matrixFirst4: mapPosition.rotation.slice(0, 4),
        rotationAngle
      })
    } else if (mapPosition?.rotation && Array.isArray(mapPosition.rotation) && mapPosition.rotation.length >= 2) {
      const cosTheta = mapPosition.rotation[0]
      const sinTheta = mapPosition.rotation[1]
      const rotationAngle = Math.atan2(sinTheta, cosTheta) * (180 / Math.PI)
      modelRotateOffset.value = rotationAngle
      modelRotationMatrix.value = [
        cosTheta, sinTheta, 0, 0,
        -sinTheta, cosTheta, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
      ]
      log.info('[3D Debug] Constructed modelRotationMatrix from 2-element array', { rotationAngle })
    } else {
      modelRotateOffset.value = data.rotation_offset ? Number(data.rotation_offset) : 0
      modelRotationMatrix.value = null
      log.info('[3D Debug] No rotation matrix found, using fallback', {
        rotationOffset: modelRotateOffset.value,
        mapPositionRotation: mapPosition?.rotation
      })
    }

    modelLatOffset.value = data.lat_offset ? Number(data.lat_offset) : 0
    modelLonOffset.value = data.lon_offset ? Number(data.lon_offset) : 0
    modelScalingOffset.value = data.scale ? Number(data.scale) : 1.0

    // Store project title and detect type
    projectTitle.value = data.title || ''
    const title = projectTitle.value.toLowerCase()
    if (title.includes('indoor') || title.includes('室內') || /^[A-Z0-9]{2,6}$/i.test(projectTitle.value)) {
      projectType.value = 'INDOOR'
    } else {
      projectType.value = 'OUTDOOR'
    }
  }, { immediate: true })

  const mapCenter = computed<[number, number]>(() => {
    if (projectLon.value !== null && projectLat.value !== null) {
      return [projectLon.value, projectLat.value]
    }
    return [141.3501, 43.064]
  })

  const mapOffset = computed<[number, number, number, number]>(() => {
    if (
      modelLonOffset.value !== null &&
      modelLatOffset.value !== null &&
      modelRotateOffset.value !== null &&
      modelScalingOffset.value !== null
    ) {
      return [
        modelLonOffset.value, // [0] lon_offset
        modelLatOffset.value, // [1] lat_offset
        modelRotateOffset.value, // [2] rotation_offset
        modelScalingOffset.value // [3] scale
      ];
    }
    return [0, 0, 0, 1];
  });

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

  const handleDialogClose = () => {
    errorDialog.value = false
    router.push('/')
  }

  // Wait for element to appear in DOM with timeout
  const waitForElement = (selector: string, timeout = 10000): Promise<HTMLElement | null> => {
    log.debug(`waitForElement: waiting for #${selector}`)
    return new Promise((resolve) => {
      const element = document.getElementById(selector)
      if (element) {
        log.debug(`waitForElement: #${selector} found immediately`)
        return resolve(element)
      }

      const observer = new MutationObserver(() => {
        const el = document.getElementById(selector)
        if (el) {
          observer.disconnect()
          clearTimeout(timeoutId)
          log.debug(`waitForElement: #${selector} found via observer`)
          resolve(el)
        }
      })

      observer.observe(document.body, {
        childList: true,
        subtree: true
      })

      // Timeout to prevent infinite waiting
      const timeoutId = setTimeout(() => {
        observer.disconnect()
        log.warn(`waitForElement: #${selector} not found within ${timeout}ms`)
        resolve(null)
      }, timeout)
    })
  }

  const modelEditEnabled = ref(false)

  // 3D Model Upload functionality
  const gltfFileInput = ref<HTMLInputElement | null>(null)

  function triggerGltfUpload() {
    gltfFileInput.value?.click()
  }

  async function handleGltfUpload(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    // Validate file extension
    if (!file.name.toLowerCase().endsWith('.gltf')) {
      log.warn('Invalid file type, only .gltf files are allowed')
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const content = e.target?.result as string
        try {
          // Parse and validate GLTF JSON
          const gltfData = JSON.parse(content)
          log.info('GLTF file loaded successfully', { fileName: file.name })

          // TODO: Upload to backend API when endpoint is available
          // For now, reload the model locally
          if (map && window.tb) {
            // Remove existing model layer
            if (map.getLayer('custom-threebox-model')) {
              map.removeLayer('custom-threebox-model')
            }

            // Add new model
            const blob = new Blob([JSON.stringify(gltfData)], { type: 'application/json' })
            const blobUrl = URL.createObjectURL(blob)

            map.addLayer({
              id: 'custom-threebox-model',
              type: 'custom',
              renderingMode: '3d',
              onAdd: function (mapInstance, gl) {
                const tb = (window.tb = new Threebox.Threebox(mapInstance, gl, { defaultLights: true }))
                const options = {
                  obj: blobUrl,
                  type: 'gltf',
                  scale: { x: 1, y: 1, z: 1 },
                  units: 'meters',
                  rotation: { x: 90, y: 0, z: 0 }, // Y-up to Z-up conversion (building rotation applied via setRotationFromMatrix)
                  anchor: 'center'
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                tb.loadObj(options, (model: any) => {
                  model.setCoords?.(mapCenter.value)
                  threeboxModel = model

                  // Apply position offset if available
                  if (mapOffset.value) {
                    model.setCoords([mapCenter.value[0]+mapOffset.value[0], mapCenter.value[1]+mapOffset.value[1]]);
                  }

                  // Apply rotation from map_position if available
                  if (modelRotationMatrix.value && modelRotationMatrix.value.length >= 16) {
                    const rotationMatrix = new THREE.Matrix4().fromArray(modelRotationMatrix.value);
                    if (model.setRotationFromMatrix && typeof model.setRotationFromMatrix === 'function') {
                      model.setRotationFromMatrix(rotationMatrix);
                    } else if (model.object3d) {
                      model.object3d.rotation.setFromRotationMatrix(rotationMatrix);
                    }
                  }

                  // Model is loaded at native scale = 1 (correct real-world meters)
                  // No additional scaling needed - matches old frontend behavior
                  tb.add(model)
                  log.info('Custom 3D model loaded from upload at native scale')
                })
              },
              render: function () {
                if (window.tb) window.tb.update()
              }
            })
          }
        } catch (parseError) {
          log.error('Failed to parse GLTF file', { error: parseError })
        }
      }
      reader.readAsText(file)
    } catch (error) {
      log.error('Failed to read GLTF file', { error })
    }

    // Reset input so the same file can be selected again
    target.value = ''
  }

  watch(modelEditEnabled, (enabled) => {
    if (map) {
      if (enabled) {
        map.boxZoom.disable();
        map.dragPan.disable();
        map.dragRotate.disable();
        map.keyboard.disable();
        map.doubleClickZoom.disable();
        map.touchZoomRotate.disable();
      } else {
        map.boxZoom.enable();
        map.dragPan.enable();
        map.dragRotate.enable();
        map.keyboard.enable();
        map.doubleClickZoom.enable();
        map.touchZoomRotate.enable();
      }
    }
  })
  const modelLon = ref<number | null>(null)
  const modelLat = ref<number | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let threeboxModel: any = null

  function handleKeyMove(e: KeyboardEvent) {
    if (!modelEditEnabled.value || !threeboxModel) return;

    if (
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight'
    ) {
      e.preventDefault();
    }

    // get current coordinate
    const coords = threeboxModel.coordinates || mapCenter.value;
    let [lon, lat] = coords;
    const step = 0.00005;
    switch (e.key) {
    case 'ArrowUp':
      lat += step; // north
      break;
    case 'ArrowDown':
      lat -= step; // south
      break;
    case 'ArrowLeft':
      lon -= step; // west
      break;
    case 'ArrowRight':
      lon += step; // east
      break;
    default:
      return;
    }
    threeboxModel.setCoords([lon, lat]);

    modelLon.value = lon;
    modelLat.value = lat;
  }

  watch(modelEditEnabled, (enabled) => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyMove);
    } else {
      window.removeEventListener('keydown', handleKeyMove);
    }
  })

  // Flag to track if model loading is pending (waiting for rotation matrix)
  const modelLoadPending = ref(false)

  // Load 3D model
  const load3DModel = async () => {
    log.info('[3D Debug] load3DModel called', {
      validProjectId: validProjectId.value,
      hasMap: !!map,
      modelRotationMatrix: modelRotationMatrix.value?.slice?.(0, 4) || null,
      modelRotateOffset: modelRotateOffset.value,
      mapOffset: mapOffset.value,
      mapCenter: mapCenter.value,
      projectQueryDataExists: !!projectQueryData.value
    })
    if (!validProjectId.value || !map) return;

    // If projectQueryData exists but rotation matrix not yet extracted, wait for it
    // This handles the race condition where map loads before data processing completes
    if (projectQueryData.value && !modelRotationMatrix.value && projectQueryData.value.map_position) {
      log.info('[3D Debug] Rotation matrix not yet available, marking load as pending')
      modelLoadPending.value = true
      return
    }
    try {
      const response = await $apiClient.project.mapsFrontendList(validProjectId.value);
      const gltfJson = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      const blob = new Blob([JSON.stringify(gltfJson)], { type: 'application/json' });
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const base64Content = base64data.split(',')[1];
        map?.addLayer({
          id: 'custom-threebox-model',
          type: 'custom',
          renderingMode: '3d',
          onAdd: function (map, gl) {
            const tb = (window.tb = new Threebox.Threebox(
              map,
              gl,
              { defaultLights: true }
            ));
            const options = {
              obj: 'data:text/plain;base64,' + base64Content,
              type: 'gltf',
              scale: { x: 1, y: 1, z: 1 },
              units: 'meters',
              rotation: { x: 90, y: 0, z: 0 }, // Y-up to Z-up conversion (building rotation applied via setRotationFromMatrix)
              anchor: 'center'
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tb.loadObj(options, (model: any) => {
              log.info('[3D Debug] Model loaded in tb.loadObj callback', {
                hasModel: !!model,
                hasSetRotationFromMatrix: typeof model.setRotationFromMatrix === 'function',
                hasObject3d: !!model.object3d,
                currentModelRotationMatrix: modelRotationMatrix.value?.slice?.(0, 4) || null,
                currentMapOffset: mapOffset.value
              })

              // Set initial coordinates at map center
              model.setCoords?.(mapCenter.value);

              // The model file is already at correct real-world scale (meters), so use scale = 1
              // This matches the old frontend behavior where const scale = 1 is used
              const scale = 1;
              modelScale.value = scale;

              threeboxModel = model;
              if(mapOffset.value){
                // Apply position offset
                model.setCoords([mapCenter.value[0]+mapOffset.value[0], mapCenter.value[1]+mapOffset.value[1]]);
                log.info('[3D Debug] Model coords set', {
                  center: mapCenter.value,
                  offset: [mapOffset.value[0], mapOffset.value[1]],
                  finalCoords: [mapCenter.value[0]+mapOffset.value[0], mapCenter.value[1]+mapOffset.value[1]]
                })

                // Apply rotation using the full 4x4 rotation matrix (same approach as old frontend)
                // This properly orients the 3D model to match the building orientation on the map
                if (modelRotationMatrix.value && modelRotationMatrix.value.length >= 16) {
                  const rotationMatrix = new THREE.Matrix4().fromArray(modelRotationMatrix.value);
                  log.info('[3D Debug] Rotation matrix created from array', {
                    inputMatrix: modelRotationMatrix.value,
                    matrixElements: rotationMatrix.elements.slice(0, 8)
                  })
                  if (model.setRotationFromMatrix && typeof model.setRotationFromMatrix === 'function') {
                    model.setRotationFromMatrix(rotationMatrix);
                    log.info('[3D Debug] Applied rotation via setRotationFromMatrix', { matrix: modelRotationMatrix.value.slice(0, 4) });
                  } else if (model.object3d) {
                    // Fallback: apply to underlying Three.js object
                    model.object3d.rotation.setFromRotationMatrix(rotationMatrix);
                    log.info('[3D Debug] Applied rotation via object3d.rotation.setFromRotationMatrix', { matrix: modelRotationMatrix.value.slice(0, 4) });
                  }
                } else {
                  // Fallback to Z rotation in degrees
                  const rotationDegrees = mapOffset.value[2];
                  log.warn('[3D Debug] No rotation matrix available, using fallback Z rotation', {
                    rotationDegrees,
                    modelRotationMatrix: modelRotationMatrix.value
                  });
                  if (model.rotation) {
                    model.rotation.z = rotationDegrees;
                  }
                  if (model.object3d && model.object3d.rotation) {
                    model.object3d.rotation.z = rotationDegrees * (Math.PI / 180);
                  }
                }

                // Scale is already 1 (model is at correct scale), no additional scaling needed
                log.info('[3D Debug] Using model at native scale', { scale });
              } else {
                log.warn('[3D Debug] mapOffset.value is falsy, skipping position/rotation', { mapOffset: mapOffset.value })
              }
              modelLon.value = mapCenter.value[0];
              modelLat.value = mapCenter.value[1];
              tb.add(model);
            });
          },
          render: function () {
            if (window.tb) {
              window.tb.update();
            }
          }
        });
      };
    } catch (error) {
      // API 返回 404 時，嘗試載入靜態 3D 模型作為 fallback
      console.warn('No 3D model from API, trying static fallback:', error);
      try {
        // 嘗試載入工程四館的 3D 模型（預設 fallback）
        map?.addLayer({
          id: 'custom-threebox-model',
          type: 'custom',
          renderingMode: '3d',
          onAdd: function (mapInstance, gl) {
            const tb = (window.tb = new Threebox.Threebox(
              mapInstance,
              gl,
              { defaultLights: true }
            ));
            const options = {
              obj: '/3d/8Fmesh_rotated.gltf',
              type: 'gltf',
              scale: { x: 1, y: 1, z: 1 },
              units: 'meters',
              rotation: { x: 90, y: 0, z: 0 }, // Y-up to Z-up conversion (building rotation applied via setRotationFromMatrix)
              anchor: 'center'
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tb.loadObj(options, (model: any) => {
              log.info('[3D Debug] Fallback model loaded in tb.loadObj callback', {
                hasModel: !!model,
                hasSetRotationFromMatrix: typeof model.setRotationFromMatrix === 'function',
                hasObject3d: !!model.object3d,
                currentModelRotationMatrix: modelRotationMatrix.value?.slice?.(0, 4) || null,
                currentMapOffset: mapOffset.value
              })

              model.setCoords?.(mapCenter.value);
              threeboxModel = model;

              // Apply rotation from map_position if available
              // The model is already at correct scale (meters), matching the old frontend approach
              if (mapOffset.value) {
                // Apply position offset
                model.setCoords([mapCenter.value[0]+mapOffset.value[0], mapCenter.value[1]+mapOffset.value[1]]);
                log.info('[3D Debug] Fallback model coords set', {
                  center: mapCenter.value,
                  offset: [mapOffset.value[0], mapOffset.value[1]],
                  finalCoords: [mapCenter.value[0]+mapOffset.value[0], mapCenter.value[1]+mapOffset.value[1]]
                })

                // Apply rotation using the full 4x4 rotation matrix
                if (modelRotationMatrix.value && modelRotationMatrix.value.length >= 16) {
                  const rotationMatrix = new THREE.Matrix4().fromArray(modelRotationMatrix.value);
                  log.info('[3D Debug] Fallback rotation matrix created from array', {
                    inputMatrix: modelRotationMatrix.value,
                    matrixElements: rotationMatrix.elements.slice(0, 8)
                  })
                  if (model.setRotationFromMatrix && typeof model.setRotationFromMatrix === 'function') {
                    model.setRotationFromMatrix(rotationMatrix);
                    log.info('[3D Debug] Fallback model: applied rotation via setRotationFromMatrix');
                  } else if (model.object3d) {
                    model.object3d.rotation.setFromRotationMatrix(rotationMatrix);
                    log.info('[3D Debug] Fallback model: applied rotation via object3d');
                  }
                } else {
                  // Fallback to Z rotation
                  const rotationDegrees = mapOffset.value[2];
                  log.warn('[3D Debug] Fallback model: No rotation matrix, using Z rotation', {
                    rotationDegrees,
                    modelRotationMatrix: modelRotationMatrix.value
                  });
                  if (model.rotation) {
                    model.rotation.z = rotationDegrees;
                  }
                  if (model.object3d && model.object3d.rotation) {
                    model.object3d.rotation.z = rotationDegrees * (Math.PI / 180);
                  }
                }

                // Model is already at native scale = 1 (correct real-world meters), no scaling needed
                log.info('[3D Debug] Fallback model: using native scale = 1');
              } else {
                log.warn('[3D Debug] Fallback model: mapOffset.value is falsy', { mapOffset: mapOffset.value })
              }

              tb.add(model);
              log.warn('[3D Debug] Loaded static 3D model as fallback');
            });
          },
          render: function () {
            if (window.tb) {
              window.tb.update();
            }
          }
        });
      } catch (fallbackError) {
        console.warn('Static 3D model also not available:', fallbackError);
      }
    }
  };

  // Watch for modelRotationMatrix changes - if model load was pending, trigger it now
  // This handles the race condition where map initializes before rotation data is ready
  watch(modelRotationMatrix, (newMatrix) => {
    if (newMatrix && modelLoadPending.value && map) {
      log.info('[3D Debug] Rotation matrix now available, loading pending model')
      modelLoadPending.value = false
      load3DModel()
    }
  })

  watchEffect(() => {
    log.debug('watchEffect triggered', {
      isLoadingProject: isLoadingProject.value,
      projectExists: projectExists.value,
      hasProjectAccess: hasProjectAccess.value
    })
    if (!isLoadingProject.value && projectExists.value && hasProjectAccess.value) {
      log.info('Conditions met, initializing map')
      nextTick(async () => {
        const container = await waitForElement('mapContainer')
        if (container) {
          initializeMap()
        } else {
          log.error('Map container not found after waiting')
        }
      })
    }
  })

  // Initialize map
  const initializeMap = async() => {
    log.mapInit('initializeMap called')
    if (map) {
      log.debug('Map already initialized, skipping')
      return
    }
    const mapContainer = document.getElementById('mapContainer')
    if (!mapContainer) {
      log.error('Map container not found')
      return
    }
    try {
      log.mapInit('Creating Mapbox instance')
      mapboxgl.accessToken = mapAccessToken
      // Cast runtime config value to the expected Mapbox style type to satisfy TypeScript
      const initialStyle = (isOnline ? onlineStyle : offlineStyle) as string | mapboxgl.StyleSpecification | undefined

      // 根據專案類型調整地圖設定 (Figma 17:318 INDOOR, 17:143 OUTDOOR)
      const isIndoor = projectType.value === 'INDOOR'
      const mapZoom = isIndoor ? 18 : 15
      const mapPitch = isIndoor ? 45 : 0

      map = new mapboxgl.Map({
        container: 'mapContainer',
        style: initialStyle,
        projection: 'globe',
        center: mapCenter.value,
        zoom: mapZoom,
        pitch: mapPitch,
      })
      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }))
      map.addControl(new mapboxgl.ScaleControl())
      map?.on('style.load', () => {
        log.mapInit('Map style loaded, loading 3D model')
        load3DModel()
      })
      log.mapInit('Map initialized successfully')
    } catch (error) {
      log.error('Error initializing map', { error })
    }
  }

  const heatmapEnabled = ref(false)
  const HeatmapTypeEnum = {
    RSRP: 'rsrp',
    RSRP_DT: 'rsrp_dt',
    THROUGHPUT: 'thrp',
    THROUGHPUT_DT: 'thrp_dt'
  }
  const heatmapType = ref(HeatmapTypeEnum.RSRP)
  const colorBarMax = ref('-55 dBm')
  const colorBarMin = ref('-140 dBm')
  const lastUpdatedTime = ref('2025/07/27')

  // Toggle heatmap visibility
  async function onHeatmapToggle() {
    if (!map) return

    if (heatmapEnabled.value) {
      // 啟用時，載入熱力圖數據
      await loadHeatmapData()
    } else {
      // 停用時，隱藏圖層
      if (map.getLayer('localHeatmapLayer')) {
        map.setLayoutProperty('localHeatmapLayer', 'visibility', 'none')
      }
    }
  }

  // 載入熱力圖數據
  async function loadHeatmapData() {
    if (!map || !validProjectId.value) return

    try {
      let heatmapData: { lat: number; lon: number; calc: number }[] = []
      const projectIdNum = validProjectId.value

      // 根據選擇的類型獲取數據
      if (heatmapType.value === HeatmapTypeEnum.RSRP) {
        const response = await $apiClient.project.rsrpList(projectIdNum)
        if (Array.isArray(response.data)) {
          heatmapData = response.data as unknown as { lat: number; lon: number; calc: number }[]
        }
      } else if (heatmapType.value === HeatmapTypeEnum.RSRP_DT) {
        const response = await $apiClient.project.rsrpDtList(projectIdNum)
        if (Array.isArray(response.data)) {
          heatmapData = response.data as unknown as { lat: number; lon: number; calc: number }[]
        }
      } else if (heatmapType.value === HeatmapTypeEnum.THROUGHPUT) {
        const response = await $apiClient.project.throughputList(projectIdNum)
        if (Array.isArray(response.data)) {
          heatmapData = response.data as unknown as { lat: number; lon: number; calc: number }[]
        }
      } else if (heatmapType.value === HeatmapTypeEnum.THROUGHPUT_DT) {
        const response = await $apiClient.project.throughputDtList(projectIdNum)
        if (Array.isArray(response.data)) {
          heatmapData = response.data as unknown as { lat: number; lon: number; calc: number }[]
        }
      }

      if (heatmapData.length === 0) {
        console.warn('No heatmap data available for this project')
        return
      }

      // 除錯: 顯示載入的數據統計
      const calcValues = heatmapData.map(d => d.calc)
      const minCalc = Math.min(...calcValues)
      const maxCalc = Math.max(...calcValues)
      const avgCalc = calcValues.reduce((a, b) => a + b, 0) / calcValues.length
      console.log(`[Heatmap] Type: ${heatmapType.value}`)
      console.log(`[Heatmap] Points: ${heatmapData.length}`)
      console.log(`[Heatmap] Calc range: ${minCalc.toFixed(2)} ~ ${maxCalc.toFixed(2)} (avg: ${avgCalc.toFixed(2)})`)

      // 轉換為 GeoJSON
      const geojsonData: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: heatmapData.map(point => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [point.lon, point.lat]
          },
          properties: {
            calc: point.calc
          }
        }))
      }

      // 移除舊圖層和數據源（如果存在）
      if (map.getLayer('localHeatmapLayer')) {
        map.removeLayer('localHeatmapLayer')
      }
      if (map.getSource('heatmapSource')) {
        map.removeSource('heatmapSource')
      }

      // 添加數據源
      map.addSource('heatmapSource', {
        type: 'geojson',
        data: geojsonData
      })

      // 計算數據範圍
      const isRsrp = heatmapType.value === HeatmapTypeEnum.RSRP || heatmapType.value === HeatmapTypeEnum.RSRP_DT
      const min = isRsrp ? -140 : 0
      const max = isRsrp ? -55 : Math.max(...heatmapData.map(d => d.calc))

      // 使用工具函數獲取配置並添加圖層
      const config = getHeatmapConfig('localHeatmapLayer', 'heatmapSource', 'visible', 'calc', min, max)
      map.addLayer(config as mapboxgl.AnyLayer)

      lastUpdatedTime.value = new Date().toLocaleString('zh-TW')
      log.debug(`Heatmap loaded with ${heatmapData.length} points`)
    } catch (error) {
      console.warn('Failed to load heatmap data:', error)
    }
  }

  // Watch heatmap type changes
  watch(heatmapType, (val) => {
    if (val === HeatmapTypeEnum.RSRP || val === HeatmapTypeEnum.RSRP_DT) {
      colorBarMax.value = '-55 dBm'
      colorBarMin.value = '-140 dBm'
    } else {
      colorBarMax.value = 'max Mbps'
      colorBarMin.value = '0 Mbps'
    }
    if (heatmapEnabled.value) {
      loadHeatmapData()
    }
  })

  // Update heatmap
  function updateHeatmap() {
    if (heatmapEnabled.value) {
      loadHeatmapData()
    }
  }
  onMounted(() => {
    log.lifecycle('mounted', { projectId: projectId.value })
  })

  onUnmounted(() => {
    log.lifecycle('unmounting', { projectId: projectId.value })
    if (map) {
      map.remove()
      map = null
    }
    if (window.tb) {
      window.tb = null
    }
    log.lifecycle('unmounted')
  })
</script>

<style scoped>
/* Overview Page - Matching Figma Design 17:143 */
.overview-page {
  background: #fff;
  min-height: 100vh;
}

/* Page Title - Figma: 17:532 */
.overview-title {
  font-family: 'Inter', sans-serif;
  font-size: 48px;
  font-weight: 400;
  color: #000;
  margin: 20px 27px 16px;
  line-height: 1.2;
}

/* Main Card - Figma: 141:26092 */
.overview-card {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.25);
  border-radius: 5px;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  margin-bottom: 24px;
}

/* Project Header - Figma: 141:26112 */
.project-header {
  padding: 16px 30px;
  display: flex;
  align-items: center;
}

.project-title {
  font-family: 'Inter', sans-serif;
  font-size: 32px;
  font-weight: 400;
  color: #000;
}

/* Map Wrapper */
.map-wrapper {
  position: relative;
  width: 100%;
}

#mapContainer {
  width: 100%;
  height: 700px;
}

/* Control Panel - Figma design matching */
.control-panel {
  position: absolute;
  right: 16px;
  bottom: 40px;
  width: 140px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 20;
  padding: 12px;
  font-family: 'Inter', sans-serif;
}

.control-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.control-label {
  font-size: 13px;
  color: #333;
  font-weight: 400;
}

.control-switch {
  transform: scale(0.8);
  margin: 0;
}

.control-switch :deep(.v-switch__track) {
  height: 16px;
  width: 32px;
}

.control-switch :deep(.v-switch__thumb) {
  width: 12px;
  height: 12px;
}

.heatmap-select {
  width: 100%;
  font-size: 12px;
}

.heatmap-select :deep(.v-field) {
  min-height: 32px;
  font-size: 12px;
}

.heatmap-select :deep(.v-field__input) {
  padding: 4px 8px;
  min-height: 32px;
  font-size: 12px;
}

/* Upload Section */
.upload-section {
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
}

.upload-btn {
  width: 100%;
  font-size: 11px;
  text-transform: none;
  height: 28px;
}

.upload-hint {
  font-size: 9px;
  color: #888;
  text-align: center;
}

/* Update Heatmap Button - Figma blue button */
.update-heatmap-btn {
  width: 100%;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 6px;
  background: #2196F3;
  border: none;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 8px;
}

.update-heatmap-btn:hover {
  background: #1976D2;
}

/* Last Updated */
.last-updated {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 8px;
  font-size: 11px;
  color: #666;
}

/* Color Bar Container */
.color-bar-container {
  position: absolute;
  right: 170px;
  bottom: 40px;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  z-index: 20;
  height: 200px;
}

.color-bar-labels {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4px 0;
  margin-right: 6px;
}

.color-bar-max,
.color-bar-min {
  font-size: 11px;
  color: #333;
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 4px;
  border-radius: 3px;
  white-space: nowrap;
}

.color-bar {
  width: 20px;
  height: 100%;
  background: linear-gradient(to bottom, red, yellow, green, blue);
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .overview-title {
    font-size: 32px;
    margin: 16px 16px 12px;
  }

  .project-title {
    font-size: 24px;
  }

  #mapContainer {
    height: 500px;
  }

  .control-panel {
    width: 120px;
    right: 8px;
    bottom: 8px;
    padding: 8px;
  }

  .color-bar-container {
    right: 140px;
    height: 160px;
  }
}
</style>