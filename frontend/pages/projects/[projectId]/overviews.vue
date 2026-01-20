<template>
  <v-container>
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

    <v-row v-if="isLoadingProject">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary" />
        <p class="mt-2">Checking if project exists...</p>
      </v-col>
    </v-row>

    <v-row v-else-if="projectExists && hasProjectAccess">
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h5">
            Project ID : {{ projectTitle || projectId }}
            <v-chip v-if="projectType === 'INDOOR'" size="small" color="info" class="ml-2">INDOOR</v-chip>
          </v-card-title>
          <v-card-text style="position:relative;">
            <!-- Map Container -->
            <div id="mapContainer"/>
            <!-- Control Panel -->
            <div id="optionsList" class="list-group no-select control-panel-pos">
              <li class="list-group-item pb-3">
                <div class="d-flex align-items-left">
                  <v-switch
                    v-model="heatmapEnabled"
                    label="Heatmap"
                    color="primary"
                    hide-details
                    :disabled="isLoadingProject"
                    density="compact"
                    class="me-2 mini-switch"
                    @change="onHeatmapToggle"
                  />
                </div>
                <div class="d-flex align-items-left">
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
                    class="mini-select"
                  />
                </div>
                <div class="d-flex align-items-left mt-2">
                  <v-switch
                    v-model="modelEditEnabled"
                    label="Edit Model"
                    color="deep-purple"
                    hide-details
                    density="compact"
                    class="me-2 mini-switch"
                  />
                </div>
              </li>
              <li class="list-group-item d-flex flex-column justify-content-center align-items-center">
                <button class="btn btn-primary mb-1 update-heatmap-btn" @click="updateHeatmap">Update Heatmap</button>
                <label id="heatmapUpdateTime" style="font-size: small;">Last updated: </label><span>{{ lastUpdatedTime }}</span>
              </li>
            </div>
            <!-- Color Bar -->
            <div v-show="heatmapEnabled" id="colorBarContainer" class="color-bar-container color-bar-pos">
              <div id="colorBar" class="rounded color-bar"/>
              <div class="color-bar-label" style="top: 0%;">{{ colorBarMax }}</div>
              <div class="color-bar-label" style="top: 100%;">{{ colorBarMin }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Fallback for access denied or project not found -->
    <v-row v-else>
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
  import * as THREE from 'three'

  const log = createModuleLogger('Overviews')

  const route = useRoute()
  const router = useRouter()
  const projectId = ref('')
  const { $apiClient } = useNuxtApp()
  const config = useRuntimeConfig()
  const isOnline = config.public?.isOnline

  watchEffect(() => {
    if (route.params.projectId) {
      projectId.value = String(route.params.projectId)
    }
  })

  let map: mapboxgl.Map | null = null
  const mapAccessToken = 'pk.eyJ1IjoiZGFyaXVzbHVuZyIsImEiOiJjbHk3MWhvZW4wMTl6MmlxMnVhNzI3cW0yIn0.WGvtamOAfwfk3Ha4KsL3BQ'
  // Two styles: prefer online style when online; fallback to local style when offline
  const onlineStyle = 'mapbox://styles/mapbox/streets-v12'
  const offlineStyle = config.public?.offlineMapboxGLJSURL
  const errorDialog = ref(false)
  const errorMessage = ref('')
  const projectExists = ref(false)

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

  const { isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      try {
        if (!validProjectId.value) {
          throw new Error('Invalid project ID')
        }
        const response = await $apiClient.project.projectsDetail(validProjectId.value)
        projectExists.value = true
        projectLat.value = response.data.lat ? Number(response.data.lat) : null
        projectLon.value = response.data.lon ? Number(response.data.lon) : null
        projectMargin.value = response.data.margin ? Number(response.data.margin) : null

        modelLatOffset.value = response.data.lat_offset ? Number(response.data.lat_offset) : null;
        modelLonOffset.value = response.data.lon_offset ? Number(response.data.lon_offset) : null;
        modelRotateOffset.value = response.data.rotation_offset ? Number(response.data.rotation_offset) : null;
        modelScalingOffset.value = response.data.scale ? Number(response.data.scale) : null;

        // 儲存專案標題並偵測類型
        projectTitle.value = response.data.title || ''
        // 偵測邏輯：短 ID 如 "ED8F" 為 INDOOR，長名稱如 "Nanzih" 為 OUTDOOR
        // 或包含 "indoor"/"室內" 關鍵字則為 INDOOR
        const title = projectTitle.value.toLowerCase()
        if (title.includes('indoor') || title.includes('室內') || /^[A-Z0-9]{2,6}$/i.test(projectTitle.value)) {
          projectType.value = 'INDOOR'
        } else {
          projectType.value = 'OUTDOOR'
        }

        return response.data
      } catch (err: unknown) {
        const axiosError = err as { response?: { status?: number } }
        if (axiosError.response?.status === 404) {
          errorMessage.value = `Project with ID ${projectId.value} not found.`
          errorDialog.value = true
          projectExists.value = false
        }
        throw err
      }
    },
    enabled: computed(() => !!validProjectId.value)
  })

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

  // Load 3D model
  const load3DModel = async () => {
    if (!validProjectId.value || !map) return;
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
              rotation: { x: 0, y: 0, z: 180 },
              anchor: 'center'
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tb.loadObj(options, (model: any) => {
              model.setCoords?.(mapCenter.value);

              let boundingBox: THREE.Box3 | null = null;
              const traverseTarget = model.object3d || model;
              let computedSideLength = 1;
              if (traverseTarget && typeof traverseTarget.traverse === 'function') {
                traverseTarget.traverse((child: THREE.Object3D) => {
                  const mesh = child as THREE.Mesh
                  if (mesh.isMesh && mesh.geometry) {
                    mesh.geometry.computeBoundingBox();
                    if (!boundingBox) {
                      boundingBox = mesh.geometry.boundingBox?.clone() ?? null;
                    } else if (mesh.geometry.boundingBox) {
                      boundingBox.union(mesh.geometry.boundingBox);
                    }
                  }
                });
                if (boundingBox) {
                  const size = (boundingBox as THREE.Box3).getSize(new THREE.Vector3());
                  computedSideLength = Math.max(size.x, size.y);
                }
              }
              if (projectMargin.value && computedSideLength > 0) {
                modelScale.value = projectMargin.value / computedSideLength / 10;
                if (model.object3d && model.object3d.scale && typeof model.object3d.scale.set === 'function') {
                  model.object3d.scale.set(modelScale.value, modelScale.value, modelScale.value);
                }
                if (model.scale && typeof model.scale.set === 'function') {
                  model.scale.set(modelScale.value, modelScale.value, modelScale.value);
                }
              }
              threeboxModel = model;
              if(mapOffset.value){
                model.setCoords([mapCenter.value[0]+mapOffset.value[0], mapCenter.value[1]+mapOffset.value[1]]);
                model.rotation.z = (mapOffset.value[2]);
                if (threeboxModel.object3d && threeboxModel.object3d.scale && typeof threeboxModel.object3d.scale.set === 'function') {
                  threeboxModel.object3d.scale.set(modelScale.value, modelScale.value, modelScale.value);
                }
                if (threeboxModel.scale && typeof threeboxModel.scale.set === 'function') {
                  threeboxModel.scale.set(modelScale.value*mapOffset.value[3], modelScale.value*mapOffset.value[3], modelScale.value*mapOffset.value[3]);
                }
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
      console.error('Error loading 3D model:', error);
    }
  };

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
  function onHeatmapToggle() {
    if (map && map.getLayer('localHeatmapLayer')) {
      map.setLayoutProperty('localHeatmapLayer', 'visibility', heatmapEnabled.value ? 'visible' : 'none')
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
    updateHeatmap()
  })

  // Update heatmap
  function updateHeatmap() {
    lastUpdatedTime.value = new Date().toISOString().slice(0, 10)
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
#mapContainer {
  width: 100%;
  height: 650px;
  position: relative;
}
#optionlist {
  font-size: 12px;
}

/* Control panel position: bottom right corner */
.control-panel-pos {
  position: absolute;
  right: 40px;
  bottom: 40px;
  width: 120px;
  background: rgba(255,255,255,0.96);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  z-index: 20;
  padding: 5px 6px;
  font-size: 8px;
  line-height: 1.5;
  border: 1px solid #e0e0e0;
  transition: box-shadow 0.2s;
  list-style-type: none;
}

/* Color bar position: beside panel */
.color-bar-pos {
  position: absolute;
  right: 260px;
  bottom: 40px;
  width: 28px;
  height: 180px;
  background: rgba(255,255,255,0.7);
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: 20;
  padding: 8px 0;
}

.color-bar {
  width: 16px;
  height: 140px;
  background: linear-gradient(to top, blue, green, yellow, red);
  border-radius: 8px;
  border: 1px solid #bbb;
  margin: 0 auto;
}

.color-bar-label {
  position: absolute;
  left: 36px;
  font-size: 12px;
  color: #222;
  background: rgba(255,255,255,0.8);
  padding: 0 2px;
  border-radius: 4px;
  pointer-events: none;
}
#colorBarMax {
  top: 8px;
}
#colorBarMin {
  top:100%;
}
.update-heatmap-btn {
  width: 100%;
  font-size: 14px;
  font-weight: bold;
  padding: 6px 0;
  border-radius: 8px;
  background: linear-gradient(90deg, #007bff 60%, #00c6ff 100%);
  border: none;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0,123,255,0.08);
  transition: background 0.2s;
}
.update-heatmap-btn:hover {
  background: linear-gradient(90deg, #0056b3 60%, #0099e6 100%);
}
</style>