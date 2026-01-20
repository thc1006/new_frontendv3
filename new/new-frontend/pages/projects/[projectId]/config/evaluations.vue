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

    <!-- RU Configuration Dialog -->
    <v-dialog v-model="ruConfigDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">Configure RU</v-card-title>
        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="selectedRU.brand_id"
                  :items="brandOptions"
                  item-title="brand_name"
                  item-value="brand_id"
                  label="Brand"
                  outlined
                  :loading="isLoadingBrands"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="selectedRU.rotation"
                  label="Rotation (degrees)"
                  type="number"
                  outlined
                  min="0"
                  max="360"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="selectedRU.tilt"
                  label="Tilt (degrees)"
                  type="number"
                  outlined
                  min="-90"
                  max="90"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="selectedRU.z"
                  label="Z (meters)"
                  type="number"
                  outlined
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn color="error" @click="deleteRU">
            Delete RU
          </v-btn>
          <v-spacer/>
          <v-btn color="secondary" @click="ruConfigDialog = false">
            Cancel
          </v-btn>
          <v-btn color="primary" @click="saveRUConfig">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- RU Position Dialog (was GNB Status Dialog) -->
    <v-dialog v-model="ruPositionDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5">RU Position</v-card-title>
        <v-card-text>{{ ruPositionMessage }}</v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn color="primary" @click="ruPositionDialog = false">
            OK
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Simulation Config Dialog -->
    <v-dialog v-model="simConfigDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">Simulation Configuration</v-card-title>
        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="simConfig.duration"
                  label="Duration"
                  type="number"
                  outlined
                  hint="模擬持續時間（秒）"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="simConfig.interval"
                  label="Interval"
                  type="number"
                  outlined
                  hint="取樣間隔（秒）"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="simConfig.mode"
                  :items="[0, 1, 2]"
                  label="Mode"
                  outlined
                  hint="模擬模式"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-switch
                  v-model="simConfig.is_full"
                  label="Full Mode"
                  color="primary"
                  hint="是否啟用完整模式"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn color="secondary" @click="simConfigDialog = false">
            取消
          </v-btn>
          <v-btn color="primary" @click="applySimConfig">
            套用
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
            Evaluation for Project ID: {{ projectId }}
          </v-card-title>
          <v-card-text>
            <!-- 頂部按鈕群組 -->
            <v-row class="mb-2">
              <v-col>
                <v-btn color="primary" @click="handleAddRU">
                  Add RU
                </v-btn>
                <v-btn color="primary" class="ml-2" @click="addUE">
                  UES SETTINGS
                </v-btn>
                <v-btn color="primary" class="ml-2" @click="openSimConfig">
                  SIMULATION CONFIG
                </v-btn>
                <v-btn color="primary" class="ml-2" @click="fetchRuPosition">
                  RU Position
                </v-btn>
              </v-col>
            </v-row>
            
            <!-- Map Container -->
            <div id="mapContainer" style="width: 100%; height: 600px;"/>
            
            <!-- Color Bar for Heatmap (initially hidden) -->
            <div id="colorBarContainer" class="color-bar-container" style="display: none;">
              <div id="colorBar" class="rounded color-bar"/>
              <div class="color-bar-label" style="top: 0%;">-55 dBm</div>
              <div class="color-bar-label" style="top: 100%;">-140 dBm</div>
            </div>
          </v-card-text>
          
          <!-- 底部控制列：左（Evaluate, Apply Config）、中（Heatmap dropdown, Show heatmap toggle）、右（Edit Model toggle） -->
          <v-card-actions>
            <v-row align="center" no-gutters>
              <!-- 左側：Evaluate, Apply Config -->
              <v-col cols="12" md="3">
                <v-btn color="primary" @click="evaluateData">
                  Evaluate
                </v-btn>
                <v-btn color="primary" class="ml-2" @click="applyConfig">
                  Apply Config
                </v-btn>
              </v-col>

              <!-- 中間：Heatmap dropdown, Show heatmap toggle -->
              <v-col cols="12" md="6" class="d-flex align-center">
                <v-select
                  v-model="selectedHeatmapType"
                  :items="heatmapTypeOptions"
                  class="ml-4"
                  style="max-width: 200px; min-width: 160px;"
                  hide-details
                  dense
                  outlined
                />
                <v-switch
                  v-model="showHeatmap"
                  class="ml-4"
                  color="deep-purple"
                  label="Show Heatmap"
                  hide-details
                  style="margin-left: 24px; min-width: 180px;"
                />
              </v-col>

              <!-- 右側：Edit Model toggle -->
              <v-col cols="12" md="3" class="d-flex justify-end">
                <v-switch
                  v-model="modelEditEnabled"
                  color="orange"
                  label="Edit Model"
                  hide-details
                  style="min-width: 150px;"
                />
              </v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import { useRoute, useRouter } from 'vue-router'
  import { useQuery } from '@tanstack/vue-query'
  import { ref, computed, watchEffect, nextTick, onUnmounted, reactive, watch, onMounted } from 'vue'
  import mapboxgl from 'mapbox-gl'
  import 'mapbox-gl/dist/mapbox-gl.css'
  import 'threebox-plugin/dist/threebox.css'
  import * as Threebox from 'threebox-plugin'
  import { useUserStore } from '~/stores/user'
  import * as THREE from 'three'
  import type { RU } from '~/apis/Api'
  import { createModuleLogger } from '~/utils/logger'

  const log = createModuleLogger('Evaluations')

  // --- Grouped constants ---
  const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiZGFyaXVzbHVuZyIsImEiOiJjbHk3MWhvZW4wMTl6MmlxMnVhNzI3cW0yIn0.WGvtamOAfwfk3Ha4KsL3BQ'
  const HEATMAP_SOURCE_ID = 'heatmapSource'
  const HEATMAP_LAYER_ID = 'heatmapLayer'
  // Earth's mean radius in centimeters (cm). Value: 6.378 × 10^8 cm.
  const EARTH_RADIUS_CM = 637800000
  const DEFAULT_OPENING_ANGLE = 360

  // Project margin (side length in meters for scaling the 3D model)
  // const projectMargin = ref(100); // Set to 100 meters or fetch from API/projectDetail if needed

  // Get the current route to extract the projectId parameter
  const route = useRoute()
  const router = useRouter()
  const projectId = ref('')
  const { $apiClient } = useNuxtApp()

  // Set projectId from route params to avoid reactivity issues
  watchEffect(() => {
    if (route.params.projectId) {
      projectId.value = String(route.params.projectId)
    }
  })

  // Map variables
  let map: mapboxgl.Map | null = null
  const modelLoaded = ref(false)

  // Dialog for error handling
  const errorDialog = ref(false)
  const errorMessage = ref('')
  const projectExists = ref(false)

  // RU Configuration Dialog
  const ruConfigDialog = ref(false)
  const selectedRU = ref({
    id: null as number | null,
    brand_id: 1,
    bandwidth: 100,
    tx_power: 20,
    rotation: 0,
    tilt: 0,
    z: 0,
    marker: null as any,
    coordinates: { lng: 0, lat: 0 }
  })

  // Track the previous brand_id to detect actual changes
  const previousBrandId = ref<number | null>(null)

  // Fetch brands from API
  const { data: brandsData, isLoading: isLoadingBrands } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const response = await $apiClient.brand.brandsList()
      return response.data
    }
  })

  // Brand options computed from API data
  const brandOptions = computed(() => {
    if (!brandsData.value) return []
    return brandsData.value
  })

  // Default brand ID (first brand)
  const defaultBrandId = computed(() => {
    if (brandOptions.value.length > 0) {
      return brandOptions.value[0].brand_id
    }
    return 1
  })

  // Default brand details (first brand's details)
  const defaultBrandDetails = computed(() => {
    if (brandOptions.value.length > 0) {
      const firstBrand = brandOptions.value[0]
      return {
        bandwidth: firstBrand.bandwidth || 100,
        tx_power: firstBrand.tx_power || 20
      }
    }
    return {
      bandwidth: 100,
      tx_power: 20
    }
  })

  // Enhanced RU markers with configuration
  interface RUMarker {
    id: number
    marker: any
    coordinates: { lng: number; lat: number }
    brand_id: number
    bandwidth: number
    tx_power: number
    rotation: number  // Geographic rotation (0 = North, 90 = East, etc.)
    tilt: number      // Tilt angle in degrees
    z: number
  }

  interface UEMarker {
    id: number
    marker: any
    coordinates: { lng: number; lat: number }
    throughput: number | null
  }

  const ruMarkers = ref<Array<RUMarker>>([])
  const ueMarkers = ref<Array<UEMarker>>([])

  // Ensure projectId is available before querying
  const validProjectId = computed(() => {
    const id = projectId.value
    return id && id !== '' ? Number(id) : null
  })

  // Latitude and Longitude for the project
  const projectLat = ref<number | null>(null)
  const projectLon = ref<number | null>(null)

  const modelLonOffset = ref<number| null>(null)
  const modelLatOffset = ref<number | null>(null)
  const modelRotateOffset = ref<number | null>(null)
  const modelScalingOffset = ref<number | null>(null)
  
  let threeboxModel: any = null
  const projectMargin = ref<number | null>(null)

  // First query: Check if the project exists and get lat/lon
  const { isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      try {
        if (!validProjectId.value) {
          throw new Error('Invalid project ID')
        }
        const response = await $apiClient.project.projectsDetail(validProjectId.value)
        projectExists.value = true
        // Set lat/lon from API response
        projectLat.value = response.data.lat ? Number(response.data.lat) : null
        projectLon.value = response.data.lon ? Number(response.data.lon) : null

        projectMargin.value = response.data.margin ? Number(response.data.margin) : null

        modelLatOffset.value = response.data.lat_offset ? Number(response.data.lat_offset) : null;
        modelLonOffset.value = response.data.lon_offset ? Number(response.data.lon_offset) : null;
        modelRotateOffset.value = response.data.rotation_offset ? Number(response.data.rotation_offset) : null;
        modelScalingOffset.value = response.data.scale ? Number(response.data.scale) : null;
        
        return response.data
      } catch (err: any) {
        // If the project is not found (404), handle it
        if (err.response?.status === 404) {
          errorMessage.value = `Project with ID ${projectId.value} not found.`
          errorDialog.value = true
          projectExists.value = false
        }
        throw err
      }
    },
    enabled: computed(() => !!validProjectId.value)
  })

  // Use projectLat/projectLon for map center
  const mapCenter = computed<[number, number]>(() => {
    if (projectLon.value !== null && projectLat.value !== null) {
      return [projectLon.value, projectLat.value]
    }
    return [141.3501, 43.064] // fallback default
  })
  const mapOffset = computed<[number, number, number, number]>(() => {
    return [
      modelLonOffset.value ?? 0,
      modelLatOffset.value ?? 0,
      modelRotateOffset.value ?? 0,
      modelScalingOffset.value ?? 1
    ]
  });
  // Create a computed property to control when the second query should run
  const shouldFetchUserProjects = computed(() => projectExists.value)

  // Get current user from store
  const userStore = useUserStore()
  
  // Check if current user is admin
  const isAdmin = computed(() => {
    return userStore.user?.role === 'ADMIN'
  })

  // Second query: Check if the user has access to this project (only run if project exists and user is not admin)
  const { data: userProjects, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['userProjects'],
    queryFn: async () => {
      const response = await $apiClient.project.getProject()
      return response.data
    },
    enabled: computed(() => shouldFetchUserProjects.value && !isAdmin.value)
  })

  // Check if the current project is in the user's project list
  const hasProjectAccess = computed(() => {
    // If user is admin, always grant access
    if (isAdmin.value) {
      return true
    }

    // Properly access the value inside the ref object
    const projects = userProjects.value
  
    if (!projects) return false
  
    // Make sure userProjects is an array before calling .some()
    if (!Array.isArray(projects)) {
      return false
    }
  
    return projects.some(project => String(project.project_id) === projectId.value)
  })

  // Watch for permission issues and show dialog
  watchEffect(() => {
    if (!isLoadingProject.value && 
      projectExists.value && 
      !isLoadingPermissions.value && 
      !isAdmin.value && // Only check permissions if not admin
      userProjects.value && 
      !hasProjectAccess.value) {
      errorMessage.value = `Permission denied. You don't have access to project with ID ${projectId.value}.`
      errorDialog.value = true
    }
  })

  // Handle dialog close and redirect to home
  const handleDialogClose = () => {
    errorDialog.value = false
    router.push('/')
  }

  // Function to add a utility to safely wait for DOM element
  const waitForElement = (selector: string) => {
    return new Promise(resolve => {
      if (document.getElementById(selector)) {
        return resolve(document.getElementById(selector));
      }

      const observer = new MutationObserver(() => {
        if (document.getElementById(selector)) {
          observer.disconnect();
          resolve(document.getElementById(selector));
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  };

  // Store scaleFactor for use in heatmap scaling
  const scaleFactor = ref(1.0)

  // Function to load 3D model data from the project
  const THREEBOX_MODEL_LAYER_ID = 'custom-threebox-model'
  const load3DModel = async () => {
    if (!validProjectId.value || !map) return;

    // Remove previous 3D model layer if exists
    if (map.getLayer(THREEBOX_MODEL_LAYER_ID)) {
      map.removeLayer(THREEBOX_MODEL_LAYER_ID);
    }

    try {
      // Fetch the 3D model data for the project
      const response = await $apiClient.project.mapsFrontendList(validProjectId.value);
      let gltfJson = null;

      if (typeof response.data === 'string') {
        gltfJson = JSON.parse(response.data);
      } else {
        gltfJson = response.data;
      }

      // Convert the model data to base64
      const blob = new Blob([JSON.stringify(gltfJson)], { type: 'application/json' });
      const reader = new FileReader();

      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const base64Content = base64data.split(',')[1]; // Get only the base64 part

        // Add the 3D model layer
        map?.addLayer({
          id: THREEBOX_MODEL_LAYER_ID,
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
              scale: { x: 1, y: 1, z: 1 }, // temp, will update after bounding box
              units: 'meters',
              rotation: { x: 0, y: 0, z: 180 },
              anchor: 'center'
            };

            tb.loadObj(options, (model: any) => {
              model.setCoords(mapCenter.value);

              // --- Compute side length of the square model ---
              let boundingBox: any = null;
              const traverseTarget = model.object3d || model;
              let computedSideLength = 1;
              if (traverseTarget && typeof traverseTarget.traverse === 'function') {
                traverseTarget.traverse((child: any) => {
                  if (child.isMesh && child.geometry) {
                    child.geometry.computeBoundingBox();
                    if (!boundingBox) {
                      boundingBox = child.geometry.boundingBox.clone();
                    } else {
                      boundingBox.union(child.geometry.boundingBox);
                    }
                  }
                });
                if (boundingBox) {
                  const size = boundingBox.getSize(new THREE.Vector3());
                  computedSideLength = Math.max(size.x, size.y);
                }
              }
              // --- End compute side length ---

              // --- Compute scale factor and apply ---
              if (projectMargin.value && computedSideLength > 0) {
                scaleFactor.value = projectMargin.value / computedSideLength /12;
                if (model.object3d && model.object3d.scale && typeof model.object3d.scale.set === 'function') {
                  model.object3d.scale.set(scaleFactor.value, scaleFactor.value, scaleFactor.value);
                }
                if (model.scale && typeof model.scale.set === 'function') {
                  model.scale.set(scaleFactor.value, scaleFactor.value, scaleFactor.value);
                }
              }
              // --- End scale ---
              threeboxModel = model;
              if (mapOffset.value[0] && mapOffset.value[1]) {
                const newCoords = [
                  mapCenter.value[0] + mapOffset.value[0],
                  mapCenter.value[1] + mapOffset.value[1]
                ];
                model.setCoords(newCoords);
              }
              if(mapOffset.value[2])model.rotation.z = (mapOffset.value[2]);
              if(mapOffset.value[3]){
                if (threeboxModel.object3d && threeboxModel.object3d.scale && typeof threeboxModel.object3d.scale.set === 'function') {
                  threeboxModel.object3d.scale.set(scaleFactor.value, scaleFactor.value, scaleFactor.value);
                }
                if (threeboxModel.scale && typeof threeboxModel.scale.set === 'function') {
                  threeboxModel.scale.set(scaleFactor.value*mapOffset.value[3], scaleFactor.value*mapOffset.value[3], scaleFactor.value*mapOffset.value[3]);
                }
              }
              tb.add(model);
              modelLoaded.value = true;
              // Add heatmap layer after model is loaded and scaleFactor is set
              addHeatmapLayer();
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



  async function saveCurrentRU( evaluationId: number ) {
    // --- Delete all RU caches for this project before saving new ones ---
    try {
      const ruCacheListRes = await $apiClient.ruCache.rucachesList();
      const ruCacheList = Array.isArray(ruCacheListRes.data) ? ruCacheListRes.data : [];
      const projectRuCaches = ruCacheList.filter(
        ru => ru.project_id === Number(validProjectId.value)
      );
      for (const ru of projectRuCaches) {
        if (ru.RU_id) {
          await $apiClient.ruCache.rucachesDelete(ru.RU_id);
        }
      }
    } catch (err) {
      console.warn('Failed to delete old RU caches:', err);
    }

    // --- Save RU data to RU cache before evaluation ---
    for (const ru of ruMarkers.value) {
      const ruCachePayload = {
        name: `RU-${ru.id}`,
        bandwidth: ru.bandwidth,
        brand_id: ru.brand_id,
        lat: ru.coordinates.lat,
        lon: ru.coordinates.lng,
        project_id: Number(validProjectId.value),
        roll: ru.rotation,
        tilt: ru.tilt,
        tx_power: ru.tx_power,
        z: ru.z,
        evaluation_id: evaluationId,
        opening_angle: DEFAULT_OPENING_ANGLE
      };
      try {
        await $apiClient.ruCache.rucachesCreate(ruCachePayload);
        log.debug('Saved RU to cache:', ruCachePayload);
      } catch (err) {
        console.warn('Failed to save RU to cache:', ruCachePayload, err);
      }
    }
  }

  async function _handleSaveRU(){
    let evaluationId: number | null = null;
    try {
      if (validProjectId.value == null) throw new Error('Invalid project ID');
      const evalRes = await $apiClient.project.getProjectEvaluations(validProjectId.value);
      if (Array.isArray(evalRes.data) && evalRes.data.length > 0 && evalRes.data[0] !== undefined) {
        evaluationId = typeof evalRes.data[0].eval_id === 'number' ? evalRes.data[0].eval_id : null;
      }
    } catch (e) {
      console.warn('Failed to fetch existing evaluation:', e);
      // Ignore, will create new evaluation if not found
    }
    
    await saveCurrentRU(evaluationId!);
  }

  async function loadRUCaches() {
    try {
      const res = await $apiClient.ruCache.rucachesList();
      const ruList = Array.isArray(res.data) ? res.data : [];
      const projectRUs = ruList.filter(ru => ru.project_id === Number(projectId.value));

      ruMarkers.value.forEach(ru => ru.marker.remove());
      ruMarkers.value = [];

      projectRUs.forEach((ru, _, arr) => addRUFromCache(ru, arr));
      log.debug('Loaded RU caches:', ruMarkers.value);
    } catch (err) {
      console.warn('Failed to load RU caches:', err);
    }
  }

  let ruScale: number = 0.01
  const initializeMap = async () => {
    if (map) return;

    const mapContainer = document.getElementById('mapContainer');
    if (!mapContainer) {
      console.error('Map container not found');
      return;
    }

    const config = useRuntimeConfig()
    const isOnline = config.public?.isOnline
    const onlineStyle = 'mapbox://styles/mapbox/streets-v12'
    const offlineStyle = config.public?.offlineMapboxGLJSURL

    try {
      mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
      // Cast runtime config value to the expected Mapbox style type to satisfy TypeScript
      const initialStyle = (isOnline ? onlineStyle : offlineStyle) as string | mapboxgl.StyleSpecification | undefined

      map = new mapboxgl.Map({
        container: 'mapContainer',
        style: initialStyle,
        projection: 'globe',
        center: mapCenter.value,
        zoom: 15,
      });

      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }));
      map.addControl(new mapboxgl.ScaleControl());

      map.once('style.load', async () => {
        // 若要用 dblclick，建議停用預設雙擊縮放
        map!.doubleClickZoom?.disable();

        await load3DModel();

        await new Promise((resolve) => setTimeout(resolve, 128));
        await loadRUCaches();

      });

      map.on('zoom', () => {
        const zoom = map!.getZoom();
        ruScale = Math.pow(2.5, 15 - zoom);
        ruScale = ruScale * 0.025;
        
        if(ruScale > 0.01) ruScale = 0.01;
        else if(ruScale < 0.0015) ruScale = 0.0015;

        ruMarkers.value.forEach(ru => {
          if (ru.marker.scale && typeof ru.marker.scale.set === 'function') {
            ru.marker.scale.set(ruScale, ruScale, ruScale);
          }
        });
      });
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  // Evaluate function - call backend workflow/start with RUs data
  const evaluateData = async () => {
    try {
      // 1. Try to get existing evaluation for this project
      let evaluationId: number | null = null;
      try {
        if (validProjectId.value == null) throw new Error('Invalid project ID');
        const evalRes = await $apiClient.project.getProjectEvaluations(validProjectId.value);
        if (Array.isArray(evalRes.data) && evalRes.data.length > 0 && evalRes.data[0] !== undefined) {
          evaluationId = typeof evalRes.data[0].eval_id === 'number' ? evalRes.data[0].eval_id : null;
        }
      } catch (e) {
        console.warn('Failed to fetch existing evaluation:', e);
        // Ignore, will create new evaluation if not found
      }

      // 2. If no evaluation, create one
      if (!evaluationId) {
        try {
          if (validProjectId.value === null) {
            throw new Error('Invalid project ID');
          }
          const createRes = await $apiClient.evaluation.evaluationsCreate({ project_id: validProjectId.value });
          evaluationId = createRes.data && typeof createRes.data.eval_id === 'number' ? createRes.data.eval_id : null;
          currentEvaluationId.value = evaluationId;
          await startStatusPolling();
        } catch (e) {
          console.error('Failed to create evaluation:', e);
          return;
        }
      } else {
        if (currentEvaluationId.value !== evaluationId) {
          currentEvaluationId.value = evaluationId;
          await startStatusPolling();
        }
      }

      await saveCurrentRU(evaluationId!);

      // 3. Prepare workflow payload with evaluationId
      const rusPayload = ruMarkers.value.map(ru => ({
        lon: ru.coordinates.lng,
        lat: ru.coordinates.lat,
        z: ru.z,
        ru_roll: ru.rotation,
        ru_tilt: ru.tilt
      }));

      const fileName = 'NYCU_API_TEST_cli.usd';

      const simCfg: any = {
        is_full: false,
        mode: 0,
        duration: 10,
        interval: 1
      };

      // --- UEs payload by mode ---
      let uesPayload: any = {};
      if (ues.mode === 1) {
        uesPayload = {
          ue_cnt: Number(ues.ue_cnt),
          ue_radius: Number(ues.ue_radius),
          ue_x: Number(ues.ue_x),
          ue_y: Number(ues.ue_y)
        };
      } else if (ues.mode === 2) {
        uesPayload = {
          ue_dis: Number(ues.ue_dis)
        };
      } else if (ues.mode === 3) {
        uesPayload = {
          ue_cnt: Number(ues.ue_cnt)
        };
      }

      // --- Add ue_start_end_pt for throughput workflow ---
      let ue_start_end_pt: Array<[number, number]> = [];
      if (ueMarkers.value.length === 2) {
        ue_start_end_pt = [
          [ueMarkers.value[0].coordinates.lng, ueMarkers.value[0].coordinates.lat],
          [ueMarkers.value[1].coordinates.lng, ueMarkers.value[1].coordinates.lat]
        ];
      }

      const payload = {
        project_id: Number(validProjectId.value),
        evaluation_id: Number(evaluationId),
        db_name: "NYCU_API_TEST",
        rus: rusPayload,
        file_name: fileName,
        rsrp_config: simCfg,
        throughput_config: {
          is_full: true,
          mode: 1 as const,
          samples_per_slot: 1,
          slots_per_batch: 10
        },
        ues: uesPayload,
        ue_start_end_pt: ue_start_end_pt
      };

      const resetPayload = {
        evaluation_id: Number(evaluationId)
      };

      // --- Step 0: Reset heatmap Status
      await $apiClient.evaluation.resetStatusCreate(resetPayload);

      // --- Step 1: Start RSRP workflow ---
      await $apiClient.aodt.workflowStartCreate(payload);

      // --- Step 2: Poll for rsrp_status === "success" ---
      let rsrpStatus = '';
      let pollError = null;
      for (;;) {
        try {
          const evalRes = await $apiClient.evaluation.evaluationsDetail(evaluationId!);
          rsrpStatus = evalRes.data?.rsrp_status || '';
          if (rsrpStatus === 'success') break;
          if (rsrpStatus === 'failed') {
            pollError = 'RSRP heatmap failed';
            break;
          }
        } catch (e: any) {
          pollError = 'Failed to poll RSRP status: ' + (e?.message || e);
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      if (pollError) {
        console.error(pollError);
        return;
      }

      // --- Step 3: Start throughput workflow ---
      log.debug('Starting throughput workflow with payload:', payload);
      try {
        const throughputResult = await $apiClient.aodt.workflowThroughputCreate(payload);
        log.debug('Throughput workflow result:', throughputResult);
        if (throughputResult.data?.success === false) {
          console.error('Throughput workflow failed:', throughputResult.data);
          return;
        }
        log.debug('Throughput workflow started successfully');
      } catch (e: unknown) {
        console.error('Failed to start throughput workflow:', e);
        return;
      }

      // --- Step 3b: Start netDT workflow ---
      let netDTSuccess = false;
      try {
        log.debug('Starting netDT workflow for evaluation ID:', evaluationId);
        const netDTRes = await $apiClient.dtAiModel.netDtCreate(evaluationId!);
        log.debug('NetDT workflow result:', netDTRes);
        // Accept either .success === true or .message contains "netDT started successfully"
        netDTSuccess =
          netDTRes.data?.success === true ||
          (typeof netDTRes.data?.message === 'string' &&
            netDTRes.data.message.includes('netDT started successfully'));
        log.debug('NetDT workflow initial succeeded:', netDTSuccess);

        // --- Poll for rsrp_dt_status === "success" ---
        let rsrpDtStatus = '';
        let pollError = null;
        for (;;) {
          try {
            const evalRes = await $apiClient.evaluation.evaluationsDetail(evaluationId!);
            rsrpDtStatus = evalRes.data?.rsrp_dt_status || '';
            if (rsrpDtStatus === 'success') {
              netDTSuccess = true;
              break;
            }
            if (rsrpDtStatus === 'failed') {
              pollError = 'RSRP DT heatmap failed';
              netDTSuccess = false;
              break;
            }
          } catch (e: any) {
            pollError = 'Failed to poll RSRP DT status: ' + (e?.message || e);
            netDTSuccess = false;
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        if (pollError) {
          console.error(pollError);
        }
        log.debug('NetDT workflow succeeded after rsrp_dt_status polling:', netDTSuccess);
      } catch (e: unknown) {
        console.error('Failed to start netDT workflow:', e);
        netDTSuccess = false;
      }
      log.debug('NetDT workflow succeeded:', netDTSuccess);

      // --- Step 4: Start ranDT workflow if netDT succeeded ---
      if (netDTSuccess) {
        try {
          log.debug('Starting ranDT workflow for evaluation ID:', evaluationId);
          await $apiClient.dtAiModel.ranDtCreate(evaluationId!, {
            ue_start_end_pt: ue_start_end_pt
          });
          log.debug('ranDT workflow started successfully');
        } catch (e: any) {
          console.error('Failed to start ranDT workflow:', e);
        }
        log.debug('ranDT workflow succeeded:', netDTSuccess);
      }
      log.debug('All workflows completed');
    } catch (error: any) {
      console.error('Error occurred during evaluation:', error);
    }
    log.debug('Evaluation process completed');
  };

  // Apply config function - stub that can be expanded with actual logic
  const applyConfig = () => {
    log.debug('Applying configuration for project:', projectId.value);
  };

  let RUmodelBase64: string | null = null;
  async function getRUmodelBase64() {
    const response = await fetch('/RU_model.gltf');
    const gltfJson = await response.json();

    const blob = new Blob([JSON.stringify(gltfJson)], { type: 'application/json' });

    const base64Content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);

      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data.split(',')[1]);
      };

      reader.onerror = (error) => {
        reject(error);
      };
    });
    return base64Content;
  };

  // Add RU function
  const handleAddRU = async () => {
    const ru: RUMarker = {
      id: Date.now(),
      marker: null,
      coordinates: { lng: mapCenter.value[0], lat: mapCenter.value[1] },
      brand_id: defaultBrandId.value ?? 1,
      bandwidth: defaultBrandDetails.value.bandwidth,
      tx_power: defaultBrandDetails.value.tx_power,
      rotation: 0, // Always store geographic rotation (0 = North)
      tilt: 0,
      z: 100 // prevent RU inside the building
    };
    await addRU(ru);
  };

  // Add RU model to map
  const addRU = async (ru: RUMarker, isDraggable = true) => {
    // Check if map is initialized
    if (!map) {
      console.error('Map is not initialized');
      return;
    }
    if (!window.tb) {
      console.error('Threebox (tb) has not been initialized. Please run load3DModel first.');
      return;
    }
    if (RUmodelBase64 === null) {
      console.warn('RU 3D model base64 data is not loaded yet. Fetching now...');
      RUmodelBase64 = await getRUmodelBase64();
      if (RUmodelBase64 === null) {
        console.error('Failed to load RU 3D model from MinIO.');
        return;
      }
    }

    const options = {
      obj: "data:text/plain;base64," + RUmodelBase64,
      type: "gltf",
      scale: { x: 20, y: 20, z: 20 },
      units: "meters",
      rotation: { x: -90, y: 0, z: 0 },
      anchor: "center",
    };

    window.tb.loadObj(options, (model: any) => {
      model.setCoords([ru.coordinates.lng, ru.coordinates.lat, ru.z]);
      const mirrorRotation = (360 - ru.rotation) % 360;
      const rotationZradians = mirrorRotation * (Math.PI / 180);
      model.rotation.z = rotationZradians;
      window.tb.add(model);
      ru.marker = model;
      // set the same ruScale
      if (ru.marker.scale && typeof ru.marker.scale.set === 'function') {
        ru.marker.scale.set(ruScale, ruScale, ruScale);
      }

      // Add to ruMarkers array
      ruMarkers.value.push(ru);

      // track dragging state
      let isDragging = false;
      // timeout for detecting double-click
      let clickTimeout: ReturnType<typeof setTimeout> | null = null;
      
      // use raycaster to detect clicks on the RU model
      map?.on("mousedown", (e) => {
        if(!map) return;
        const rect = map.getCanvas().getBoundingClientRect();

        // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
        const mouse = new THREE.Vector2();
        mouse.x = ((e.point.x) / rect.width) * 2 - 1;
        mouse.y = -((e.point.y) / rect.height) * 2 + 1;  

        // Update the raycaster with the camera and mouse position
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, window.tb.camera);

        // Calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(window.tb.scene.children, true);
        if (intersects.length > 0) {
          // Traverse up to find the parent Threebox marker
          let target: THREE.Object3D | null = intersects[0].object;
          while (target && !(ru.marker === target)) {
            target = target.parent;
          }

          if (target) { // Clicked on the RU model
            isDragging = true;
            map.dragPan.disable();
            selectRU(ru.id);

            if (clickTimeout) {
              // Double-click detected
              clearTimeout(clickTimeout);
              clickTimeout = null;
              isDragging = false; // Prevent dragging on double-click
              map.dragPan.enable();
              openRUConfig(ru);
            } else {
              // Single click - set timeout to detect double-click
              clickTimeout = setTimeout(() => {
                clickTimeout = null;
              }, 300); // 300ms threshold for double-click
            }
          }
        }
      });

      map?.on("mousemove", (e) => {
        if (!isDragging || !isDraggable) return;
        const { lng, lat } = e.lngLat;
        model.setCoords([lng, lat, ru.z]);
        ru.coordinates.lng = lng;
        ru.coordinates.lat = lat;
        // keep the same scale
        if (ru.marker.scale && typeof ru.marker.scale.set === 'function') {
          ru.marker.scale.set(ruScale, ruScale, ruScale);
        }
      });

      map?.on("mouseup", () => {
        if(!map) return;
        if (isDragging) {
          isDragging = false;
          map.dragPan.enable();
        }
      });
    });
  };

  // Update RU model rotation based on tilt (X-axis) and rotation (Z-axis)
  const updateRUrotation = (ruIndex: number, ruXdegrees: number, ruZdegrees: number) => {
    const qPitch = new THREE.Quaternion();
    const qYaw = new THREE.Quaternion();

    qPitch.setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(ruXdegrees)); // Rotation around X-axis
    qYaw.setFromAxisAngle(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(-ruZdegrees)); // Rotation around Z-axis

    // multiply quaternions: finalQuaternion = qYaw * qPitch
    const finalQuaternion = new THREE.Quaternion();
    finalQuaternion.multiplyQuaternions(qYaw, qPitch);

    ruMarkers.value[ruIndex].marker.quaternion.copy(finalQuaternion);
  };

  // Track selected RU ID
  const selectedRUId = ref<number | null>(null);

  // Select RU function
  const selectRU = (ruId: number) => {
    selectedRUId.value = ruId;
  };

  // Open RU configuration dialog
  const openRUConfig = (ru: RUMarker) => {
    selectedRU.value = {
      id: ru.id,
      brand_id: ru.brand_id,
      bandwidth: ru.bandwidth,
      tx_power: ru.tx_power,
      rotation: ru.rotation,
      tilt: ru.tilt,
      z: ru.z,
      marker: ru.marker,
      coordinates: ru.coordinates
    };
    previousBrandId.value = ru.brand_id;
    ruConfigDialog.value = true;
  };

  // Save RU configuration
  const saveRUConfig = () => {
    if (selectedRU.value.id !== null) {
      const ruIndex = ruMarkers.value.findIndex(ru => ru.id === selectedRU.value.id);
      if (ruIndex !== -1) {
        // Update the RU data - convert values to appropriate types
        ruMarkers.value[ruIndex].brand_id = Number(selectedRU.value.brand_id);
        ruMarkers.value[ruIndex].bandwidth = Number(selectedRU.value.bandwidth);
        ruMarkers.value[ruIndex].tx_power = Number(selectedRU.value.tx_power);
        ruMarkers.value[ruIndex].rotation = Number(selectedRU.value.rotation);
        ruMarkers.value[ruIndex].tilt = Number(selectedRU.value.tilt);
        ruMarkers.value[ruIndex].z = Number(selectedRU.value.z);

        // Update RU model rotation
        updateRUrotation(ruIndex, ruMarkers.value[ruIndex].tilt, ruMarkers.value[ruIndex].rotation);
        // Update coordinates height (z)
        const currentCoords = ruMarkers.value[ruIndex].marker.coordinates; // [lng, lat, z]
        ruMarkers.value[ruIndex].marker.setCoords([currentCoords[0], currentCoords[1], ruMarkers.value[ruIndex].z]);
        // keep the same scale
        if (ruMarkers.value[ruIndex].marker.scale && typeof ruMarkers.value[ruIndex].marker.scale.set === 'function') {
          ruMarkers.value[ruIndex].marker.scale.set(ruScale, ruScale, ruScale);
        }
      }
    }
    // Close the dialog
    ruConfigDialog.value = false;
  };

  // Delete RU function
  const deleteRU = () => {
    if (selectedRU.value.id !== null) {
      const ruIndex = ruMarkers.value.findIndex(ru => ru.id === selectedRU.value.id);
      if (ruIndex !== -1) {
        if (window.tb && ruMarkers.value[ruIndex].marker) {
          // remove from Threebox
          window.tb.remove(ruMarkers.value[ruIndex].marker);
          // update coords to trigger redraw
          const currentCoords = ruMarkers.value[ruIndex].marker.coordinates;
          ruMarkers.value[ruIndex].marker.setCoords(currentCoords);
        }
        // Remove from markers array
        ruMarkers.value.splice(ruIndex, 1);
      }
    }
    // Close the dialog
    ruConfigDialog.value = false;
  };

  // Rotate selected RU
  const rotateSelectedRU = (degrees: number) => {
    const ruIndex = ruMarkers.value.findIndex(ru => ru.id === selectedRUId.value);
    if (ruIndex === -1) return;

    // Get selected RU's current rotation
    let rotationZdegrees = ruMarkers.value[ruIndex].rotation || 0;

    rotationZdegrees = (rotationZdegrees + degrees + 360) % 360;
    ruMarkers.value[ruIndex].rotation = rotationZdegrees;

    // Update RU model rotation
    updateRUrotation(ruIndex, ruMarkers.value[ruIndex].tilt, rotationZdegrees);
    // update coords to trigger redraw
    const currentCoords = ruMarkers.value[ruIndex].marker.coordinates;
    ruMarkers.value[ruIndex].marker.setCoords(currentCoords);
    // keep the same scale
    if (ruMarkers.value[ruIndex].marker.scale && typeof ruMarkers.value[ruIndex].marker.scale.set === 'function') {
      ruMarkers.value[ruIndex].marker.scale.set(ruScale, ruScale, ruScale);
    }
  }

  // Add UE function
  const addUE = () => {
    // Check if map is initialized
    if (!map) {
      console.error('Map is not initialized');
      return;
    }
    if (ueMarkers.value.length > 0) {
      console.error("UEs already exist. Only one pair of UEs allowed.");
      return;
    }
    // Default start/end positions: start at map center, end at center + small lat offset
    const startCoord = { lng: mapCenter.value[0], lat: mapCenter.value[1] };
    const endCoord = { lng: mapCenter.value[0], lat: mapCenter.value[1] + 0.0001 };

    // Create start marker
    const startMarker = new mapboxgl.Marker({ color: 'blue', draggable: true })
      .setLngLat([startCoord.lng, startCoord.lat])
      .addTo(map);
    // Create end marker
    const endMarker = new mapboxgl.Marker({ color: 'green', draggable: true })
      .setLngLat([endCoord.lng, endCoord.lat])
      .addTo(map);

    // Store markers and coordinates
    ueMarkers.value = [
      { id: Date.now(), marker: startMarker, coordinates: { ...startCoord }, throughput: null },
      { id: Date.now() + 1, marker: endMarker, coordinates: { ...endCoord }, throughput: null }
    ];

    // Update coordinates on drag
    startMarker.on('dragend', () => {
      const lngLat = startMarker.getLngLat();
      ueMarkers.value[0].coordinates = { lng: lngLat.lng, lat: lngLat.lat };
    });
    endMarker.on('dragend', () => {
      const lngLat = endMarker.getLngLat();
      ueMarkers.value[1].coordinates = { lng: lngLat.lng, lat: lngLat.lat };
    });

    const startPopup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      anchor: 'top',
      offset: 10,
    });
    const endPopup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      anchor: 'top',
      offset: 10,
    });
    
    const startEl = startMarker.getElement();
    startEl.addEventListener('mouseenter', () => {
      if(!map) return;
      startPopup.setLngLat(startMarker.getLngLat()).addTo(map);
      startPopup.setText(`Start UE Throughput: ${ueMarkers.value[0].throughput !== null ? ueMarkers.value[0].throughput.toFixed(2) + ' Mbps' : 'N/A'}`);
    });
    startEl.addEventListener('mouseleave', () => {
      startPopup.remove();
    });

    const endEl = endMarker.getElement();
    endEl.addEventListener('mouseenter', () => {
      if(!map) return;
      endPopup.setLngLat(endMarker.getLngLat()).addTo(map);
      endPopup.setText(`End UE Throughput: ${ueMarkers.value[1].throughput !== null ? ueMarkers.value[1].throughput.toFixed(2) + ' Mbps' : 'N/A'}`);
    });
    endEl.addEventListener('mouseleave', () => {
      endPopup.remove();
    });
  };

  const getStartEndUEThroughput = async (eval_id: number, start_or_end: number) => {
    const objectName = `evaluation_${eval_id}_throughput_dt_heatmap.json`;
    const bucketName = 'throughput-dt';
    const payload = {
      bucket: bucketName,
      object_name: objectName
    };

    let heatmapJson = null;
    try {
      const res = await $apiClient.minIo.getJsonCreate(payload);
      
      if (typeof res.data.json === 'string') {
        heatmapJson = JSON.parse(res.data.json);
      } else {
        heatmapJson = res.data.json;
      }

      if (heatmapJson && Array.isArray(heatmapJson) && heatmapJson.length > 0) {
        const origin_lon = projectLon.value ?? 0;
        const origin_lat = projectLat.value ?? 0;
        const ue = ueMarkers.value[start_or_end];
        
        // Traverse heatmap to find the correct UE by comparing coordinates
        for (const entry of heatmapJson) {
          if(typeof entry.DL_thu !== 'number'){
            continue; // skip invalid entry
          }
          const [lng, lat] = msXYToLonLat(entry.ms_x, entry.ms_y, origin_lon, origin_lat);
          const tolerance = 0.00005; // ~5 meters
          if (Math.abs(lng - ue.coordinates.lng) < tolerance && Math.abs(lat - ue.coordinates.lat) < tolerance) {
            return entry.DL_thu;
          }
        }

        console.warn('No heatmap entry matches UE coordinates');
        return null;
      } else {
        throw new Error('Invalid heatmap data format for UE throughput');
      }
    } catch {
      throw new Error('No data received from MinIO for UE throughput');
    }
  };


  // Keyboard event handler
  const handleKeyDown = (e: KeyboardEvent) => {
    // Only process if an RU is selected
    if (selectedRUId.value === null) return;
    
    // 'Q' key for counter-clockwise rotation
    if (e.key.toLowerCase() === 'q') {
      rotateSelectedRU(-1); // Rotate 1 degree counter-clockwise
    }
    // 'W' key for clockwise rotation
    else if (e.key.toLowerCase() === 'w') {
      rotateSelectedRU(1); // Rotate 1 degree clockwise
    }
  };

  // Setup keyboard listeners
  const setupKeyboardListeners = () => {
    window.addEventListener('keydown', handleKeyDown);
  };

  // Clean up map and 3D model resources on component unmount
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
    if (map) {
      map.off('mousedown', () => {});
      map.off('mousemove', () => {});
      map.off('mouseup', () => {});
      map.remove();
      map = null;
    }
    // Clean up any Threebox resources if necessary
    if (window.tb) {
      window.tb = null;
    }
  });

  // UEs settings object (make it reactive for proper v-model updates)
  const ues = reactive({
    mode: 3,
    ue_cnt: 100,
    ue_radius: 10000,
    ue_x: 0,
    ue_y: 0,
    ue_dis: 1000
  });

  // --- Heatmap logic ---

  // 1. Add heatmap type selection state and options
  const selectedHeatmapType = ref<'rsrp' | 'rsrp_dt' | 'throughput' | 'throughput_dt'>('rsrp');

  // --- Heatmap status polling ---
  const heatmapStatuses = ref({
    rsrp: '',
    rsrp_dt: '',
    throughput: '',
    throughput_dt: ''
  });

  // Store the current evaluationId for polling
  const currentEvaluationId = ref<number | null>(null);

  // Polling timer
  let statusTimer: ReturnType<typeof setInterval> | null = null;

  // Fetch and update heatmap statuses
  const fetchHeatmapStatuses = async () => {
    try {
      // Get evaluationId if not set
      if (!currentEvaluationId.value) {
        currentEvaluationId.value = await getEvaluationId();
      }
      if (!currentEvaluationId.value) return;
      const res = await $apiClient.evaluation.evaluationsDetail(currentEvaluationId.value);
      const data = res.data;
      heatmapStatuses.value = {
        rsrp: data.rsrp_status || '',
        rsrp_dt: data.rsrp_dt_status || '',
        throughput: data.throughput_status || '',
        throughput_dt: data.throughput_dt_status || ''
      };
    } catch (e) {
      // If evaluationId not found, clear statuses
      heatmapStatuses.value = {
        rsrp: '',
        rsrp_dt: '',
        throughput: '',
        throughput_dt: ''
      };
      console.warn('Failed to fetch heatmap statuses:', e);
    }
  };

  // Start polling when evaluationId is available
  const startStatusPolling = async () => {
    try {
      currentEvaluationId.value = await getEvaluationId();
      await fetchHeatmapStatuses();
      if (statusTimer) clearInterval(statusTimer);
      statusTimer = setInterval(fetchHeatmapStatuses, 1000);
    } catch (e) {
      console.warn('Failed to start status polling:', e);
      // No evaluation yet, do not start polling
    }
  };

  // Stop polling on unmount
  onUnmounted(() => {
    if (statusTimer) clearInterval(statusTimer);
  });

  // Start polling when project and evaluation are ready
  watch(
    [() => projectExists.value, () => hasProjectAccess.value, modelLoaded],
    async ([exists, access, loaded]) => {
      if (exists && access && loaded) {
        await startStatusPolling();
      }
    },
    { immediate: true }
  );

  // --- Update heatmapTypeOptions to include status ---
  const heatmapTypeOptions = computed(() => [
    { title: `RSRP (${heatmapStatuses.value.rsrp || '-'})`, value: 'rsrp' },
    { title: `RSRP DT (${heatmapStatuses.value.rsrp_dt || '-'})`, value: 'rsrp_dt' },
    { title: `Throughput (${heatmapStatuses.value.throughput || '-'})`, value: 'throughput' },
    { title: `Throughput DT (${heatmapStatuses.value.throughput_dt || '-'})`, value: 'throughput_dt' }
  ]);

  // Watch for throughput status changes to update UE throughput values
  watch(() =>heatmapStatuses.value.throughput_dt, (newStatus) => {
    if(newStatus === 'success'){
      // If new status is success, fetch throughput for both UEs
      getStartEndUEThroughput(currentEvaluationId.value!, 0).then(throughput => {
        ueMarkers.value[0].throughput = throughput;
      }).catch(err => {
        console.error('Failed to get start UE throughput:', err);
      });
      getStartEndUEThroughput(currentEvaluationId.value!, 1).then(throughput => {
        ueMarkers.value[1].throughput = throughput;
      }).catch(err => {
        console.error('Failed to get end UE throughput:', err);
      });
    }
    else {
      // Reset throughput values if not success
      ueMarkers.value[0].throughput = null;
      ueMarkers.value[1].throughput = null;
    }
  });

  // Heatmap visibility and IDs
  const showHeatmap = ref(false);

  // Utility: Get evaluationId for the current project
  const getEvaluationId = async () => {
    if (!validProjectId.value) throw new Error('Invalid project ID');
    const evalRes = await $apiClient.project.getProjectEvaluations(validProjectId.value);
    if (Array.isArray(evalRes.data) && evalRes.data.length > 0 && evalRes.data[0]?.eval_id) {
      return evalRes.data[0].eval_id;
    }
    throw new Error('No evaluation found for this project');
  };

  // Utility: Load heatmap data from API based on selectedHeatmapType
  const loadHeatmapJson = async (start_or_end: number) => {
    const evaluationId = await getEvaluationId();
    let res;
    if (selectedHeatmapType.value === 'rsrp') {
      try {
        const bucketName = 'rsrp';
        const objectName = `evaluation_${evaluationId}_rsrp_heatmap_${start_or_end}.json`;
        const payload = {
          bucket: bucketName,
          object_name: objectName
        };
        const minioRes = await $apiClient.minIo.getJsonCreate(payload);
        const responseData = minioRes.data;
        if(!responseData || !responseData.json) throw new Error('No RSRP data');
        return responseData.json;
      } catch {
        console.error('Failed to fetch the new version of RSRP heatmap data');
      }
      // Try to fetch the old version of RSRP heatmap data
      try {  
        const bucketName = 'rsrp';
        const objectName = `evaluation_${evaluationId}_rsrp_heatmap.json`;
        const payload = {
          bucket: bucketName,
          object_name: objectName
        };
        const minioRes = await $apiClient.minIo.getJsonCreate(payload);
        const responseData = minioRes.data;
        if(!responseData || !responseData.json) throw new Error('No RSRP data');
        return responseData.json;
      } catch {
        throw new Error('No RSRP data found');
      }
    } else if (selectedHeatmapType.value === 'rsrp_dt') {
      try {
        const bucketName = 'rsrp_dt';
        const objectName = `evaluation_${evaluationId}_rsrp_dt_heatmap_${start_or_end}.json`;
        const payload = {
          bucket: bucketName,
          object_name: objectName
        };
        const minioRes = await $apiClient.minIo.getJsonCreate(payload);
        const responseData = minioRes.data;
        if(!responseData || !responseData.json) throw new Error('No RSRP DT data');
        return responseData.json;
      } catch {
        console.error('Failed to fetch RSRP DT data from MinIO, falling back to API');
      }
      // Fallback to API call if MinIO fetch fails
      try {  
        res = await $apiClient.evaluation.rsrpDtList(evaluationId);
        if (res.data && res.data.rsrp_dt) {
          return res.data.rsrp_dt;
        }
      } catch {
        throw new Error('No RSRP DT data found via API');
      }
    } else if (selectedHeatmapType.value === 'throughput') {
      try {
        const bucketName = 'throughput';
        const objectName = `evaluation_${evaluationId}_throughput_heatmap_${start_or_end}.json`;
        const payload = {
          bucket: bucketName,
          object_name: objectName
        };
        const minioRes = await $apiClient.minIo.getJsonCreate(payload);
        const responseData = minioRes.data;
        if(!responseData || !responseData.json) throw new Error('No Throughput data');
        return responseData.json;
      } catch {
        console.error('Failed to fetch the new version of throughput heatmap data');
      }
      // Try to fetch the old version of throughput heatmap data
      try {  
        const bucketName = 'throughput';
        const objectName = `evaluation_${evaluationId}_throughput_heatmap.json`;
        const payload = {
          bucket: bucketName,
          object_name: objectName
        };
        const minioRes = await $apiClient.minIo.getJsonCreate(payload);
        const responseData = minioRes.data;
        if(!responseData || !responseData.json) throw new Error('No Throughput data');
        return responseData.json;
      } catch {
        throw new Error('No Throughput data found');
      }
    } else if (selectedHeatmapType.value === 'throughput_dt') {
      try {
        const bucketName = 'throughput_dt';
        const objectName = `evaluation_${evaluationId}_throughput_dt_heatmap_${start_or_end}.json`;
        const payload = {
          bucket: bucketName,
          object_name: objectName
        };
        const minioRes = await $apiClient.minIo.getJsonCreate(payload);
        const responseData = minioRes.data;
        if(!responseData || !responseData.json) throw new Error('No Throughput DT data');
        return responseData.json;
      } catch {
        console.error('Failed to fetch Throughput DT data from MinIO, falling back to API');
      }
      // Fallback to API call if MinIO fetch fails
      try {  
        res = await $apiClient.evaluation.throughputDtList(evaluationId);
        if (res.data && res.data.throughput_dt) {
          return res.data.throughput_dt;
        }
      } catch {
        throw new Error('No Throughput DT data found via API');
      }
    }
    throw new Error('Unknown heatmap type');
  };

  // Utility: Get max value among all RU fields for a point (ignoring "N/A") (new format)
  function getMaxRUValue(point: Record<string, any>, _ruKeys: string[]): number|null {
    if (!Array.isArray(point.rus)) return null;
    const values = point.rus
      .map(v => (typeof v === 'number' && !isNaN(v)) ? v : null)
      .filter(v => v !== null) as number[];
    if (values.length === 0) return null;
    return Math.max(...values);
  }

  // Utility: Convert ms_x/ms_y (cm) to lon/lat using project origin
  function msXYToLonLat(
    x_cm: number,
    y_cm: number,
    origin_lon: number,
    origin_lat: number
  ): [number, number] {
    const R = EARTH_RADIUS_CM;
    // Apply rotation_offset (clockwise, radians) to x_cm/y_cm
    // Get rotation_offset, lat_offset, lon_offset from project data
    // Use fallback 0 if not available
    const rotation = typeof modelRotateOffset.value !== 'undefined' && modelRotateOffset.value !== null ? modelRotateOffset.value : 0;
    const lat_offset = typeof modelLatOffset.value !== 'undefined' && modelLatOffset.value !== null ? modelLatOffset.value : 0;
    const lon_offset = typeof modelLonOffset.value !== 'undefined' && modelLonOffset.value !== null ? modelLonOffset.value : 0;

    // Rotate (x_cm, y_cm) by rotation_offset (clockwise)
    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);
    const x_rot = x_cm * cosR - y_cm * sinR;
    const y_rot = x_cm * sinR + y_cm * cosR;

    // Calculate delta lat/lon in radians
    const dlat_rad = y_rot / R;
    const avg_lat_rad = origin_lat * Math.PI / 180;
    const dlon_rad = x_rot / (R * Math.cos(avg_lat_rad));
    // Convert to degrees
    const dlat = dlat_rad * 180 / Math.PI;
    const dlon = dlon_rad * 180 / Math.PI;
    let lat = origin_lat + dlat;
    let lon = origin_lon + dlon;

    // Apply lat_offset and lon_offset
    lat += lat_offset;
    lon += lon_offset;

    return [lon, lat];
  }

  // Add heatmap layer to map
  async function addHeatmapLayer() {
    if (!map || !modelLoaded.value) return;
    removeHeatmapLayer();

    // Load heatmap.json
    let heatmapJson;
    try {
      heatmapJson = await loadHeatmapJson(0);
    } catch (e) {
      console.error('Failed to load heatmap.json:', e);
      return;
    }

    // Parse if heatmapJson is a string
    let heatmapData;
    if (typeof heatmapJson === 'string') {
      try {
        heatmapData = JSON.parse(heatmapJson);
      } catch (e) {
        console.error('Failed to parse heatmapJson string:', e);
        return;
      }
    } else {
      heatmapData = heatmapJson;
    }

    log.debug('Heatmap data loaded:', heatmapData);

    // Prepare original points with ms_x/ms_y converted to lon/lat and value
    const originalPoints: Array<{ lon: number; lat: number; value: number }> = [];
    const origin_lon = projectLon.value ?? 0;
    const origin_lat = projectLat.value ?? 0;

    if (selectedHeatmapType.value === 'throughput_dt') {
      // Throughput DT format: use DL_thu
      for (const pt of heatmapData) {
        if (typeof pt.DL_thu !== 'number') continue;
        const [lon, lat] = msXYToLonLat(pt.ms_x, pt.ms_y, origin_lon, origin_lat);
        originalPoints.push({ lon, lat, value: pt.DL_thu });
      }
    } else if (selectedHeatmapType.value === 'throughput') {
      // Throughput format: use throughput_mbps and ue_x/ue_y
      for (const pt of heatmapData) {
        if (typeof pt.throughput_mbps !== 'number') continue;
        const [lon, lat] = msXYToLonLat(pt.ue_x, pt.ue_y, origin_lon, origin_lat);
        originalPoints.push({ lon, lat, value: pt.throughput_mbps });
      }
    } else {
      // Other formats: use max RU value
      const allRUKeys: string[] = Array.from(
        new Set(heatmapData.flatMap((point: { rus: any[] }) => point.rus?.map((_, idx) => idx.toString()) ?? []))
      ) as string[];
      for (const pt of heatmapData) {
        const maxRU = getMaxRUValue(pt, allRUKeys);
        if (maxRU === null) continue;
        const [lon, lat] = msXYToLonLat(pt.ms_x, pt.ms_y, origin_lon, origin_lat);
        originalPoints.push({ lon, lat, value: maxRU });
      }
    }

    // Build GeoJSON features from grid points
    const features: GeoJSON.Feature<GeoJSON.Point, { value: number }>[] = [];
    for (const pt of originalPoints) {
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [pt.lon, pt.lat] },
        properties: { value: pt.value }
      });
    }

    // Create GeoJSON
    const geojson: GeoJSON.FeatureCollection<GeoJSON.Point, { value: number }> = {
      type: 'FeatureCollection',
      features
    };

    // Add source
    map.addSource(HEATMAP_SOURCE_ID, {
      type: 'geojson',
      data: geojson
    });

    const values = features.map(f => f.properties.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    // Add circle layer for value-based coloring
    // Import ExpressionSpecification from mapbox-gl at the top if not already:
    // import type { ExpressionSpecification } from 'mapbox-gl';

    let circleColorPaint: mapboxgl.ExpressionSpecification;
    if (selectedHeatmapType.value === 'throughput' || selectedHeatmapType.value === 'throughput_dt') {
      // Throughput: blue (0 Mbps) to red (20 Mbps)
      circleColorPaint = [
        'interpolate',
        ['linear'],
        ['get', 'value'],
        minValue, 'rgb(0,0,255)',      // blue at 0 Mbps
        minValue * 0.5 + maxValue * 0.5, 'rgb(0,128,0)',     // green at midpoint
        minValue * 0.25 + maxValue * 0.75, 'rgb(255,255,0)',   // yellow closer to 20
        maxValue, 'rgb(255,0,0)'      // red at 20 Mbps
      ] as mapboxgl.ExpressionSpecification;
    } else {
      // RSRP: blue (-140 dBm) to red (-55 dBm)
      circleColorPaint = [
        'interpolate',
        ['linear'],
        ['get', 'value'],
        minValue, 'rgb(0,0,255)',    // blue at or below -140
        minValue * 0.5 + maxValue * 0.5, 'rgb(0,128,0)',   // green at midpoint
        minValue * 0.25 + maxValue * 0.75, 'rgb(255,255,0)',// yellow closer to -55
        maxValue, 'rgb(255,0,0)'      // red at or above -55
      ] as mapboxgl.ExpressionSpecification;
    }

    map.addLayer({
      id: HEATMAP_LAYER_ID,
      type: 'circle',
      source: HEATMAP_SOURCE_ID,
      layout: {
        visibility: showHeatmap.value ? 'visible' : 'none'
      },
      paint: {
        'circle-radius': {
          stops: [
            [15, 4],
            [22, 12]
          ]
        },
        'circle-color': circleColorPaint,
        'circle-opacity': 0.7
      }
    });

    // Move heatmap layer below the 3D model layer if both exist
    if (map.getLayer(THREEBOX_MODEL_LAYER_ID) && map.getLayer(HEATMAP_LAYER_ID)) {
      map.moveLayer(HEATMAP_LAYER_ID, THREEBOX_MODEL_LAYER_ID);
    }

    // Show/hide color bar according to switch
    const colorBar = document.getElementById('colorBarContainer');
    if (colorBar) {
      colorBar.style.display = showHeatmap.value ? '' : 'none';
      // Update color bar labels and gradient
      const labels = colorBar.querySelectorAll('.color-bar-label');
      const colorBarDiv = colorBar.querySelector('#colorBar');
      if (selectedHeatmapType.value === 'throughput' || selectedHeatmapType.value === 'throughput_dt') {
        if (labels.length > 0) labels[0].textContent = `${maxValue.toFixed(1)} Mbps`;
        if (labels.length > 1) labels[1].textContent = `${minValue.toFixed(1)} Mbps`;
        if (colorBarDiv) {
          (colorBarDiv as HTMLElement).style.background = 'linear-gradient(to bottom, rgb(255,0,0), rgb(255,255,0), rgb(0,128,0), rgb(0,0,255))';
        }
      } else {
        if (labels.length > 0) labels[0].textContent = `${maxValue.toFixed(1)} dBm`;
        if (labels.length > 1) labels[1].textContent = `${minValue.toFixed(1)} dBm`;
        if (colorBarDiv) {
          (colorBarDiv as HTMLElement).style.background = 'linear-gradient(to bottom, rgb(255,0,0), rgb(255,255,0), rgb(0,128,0), rgb(0,0,255))';
        }
      }
    }
  }

  // --- FIX: Watch for heatmap type changes and reload heatmap if visible ---
  watch(
    () => selectedHeatmapType.value,
    async () => {
      if (map && modelLoaded.value && showHeatmap.value) {
        removeHeatmapLayer();
        await addHeatmapLayer();
      }
    }
  );

  // --- FIX: Watch the switch and reload heatmap when turning on ---
  watch(
    () => showHeatmap.value,
    async (visible) => {
      if (map && modelLoaded.value) {
        if (visible) {
          removeHeatmapLayer();
          await addHeatmapLayer();
        } else {
          removeHeatmapLayer();
        }
      }
    }
  );

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
        map.scrollZoom.disable();
      } else {
        map.boxZoom.enable();
        map.dragPan.enable();
        map.dragRotate.enable();
        map.keyboard.enable();
        map.doubleClickZoom.enable();
        map.touchZoomRotate.enable();
        map.scrollZoom.enable();
      }
    }
    if (enabled) showModelEditTips.value = true;
  })

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

    // get current coordinate ** remember this is offset
    let [lon, lat] = [mapOffset.value[0],mapOffset.value[1]];
    let modelRotationZ = mapOffset.value[2];
    let scaleAdjust = mapOffset.value[3] ;

    const step = 0.000025;
    const rotateStep = (Math.PI/36)/5;
    const scaleStep = 0.005;
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
    case 'a': // rotate left
      modelRotationZ = (modelRotationZ + rotateStep + 2 * Math.PI) % (2 * Math.PI);
      break;
    case 'd': // rotate right
      modelRotationZ = (modelRotationZ - rotateStep + 2 * Math.PI) % (2 * Math.PI);
      break;
    case '=': // For small keyboards + and = is the same key
      scaleAdjust += scaleStep;
      break;
    case '+':
      scaleAdjust += scaleStep;
      break;
    case '-':
      scaleAdjust -= scaleStep;
      break;
    default:
      return;
    }
    threeboxModel.setCoords([mapCenter.value[0]+lon, mapCenter.value[1]+lat]);

    // rotate
    threeboxModel.rotation.z = (modelRotationZ);
    // rescale
    if (threeboxModel.object3d && threeboxModel.object3d.scale && typeof threeboxModel.object3d.scale.set === 'function') {
      threeboxModel.object3d.scale.set(scaleFactor.value, scaleFactor.value, scaleFactor.value);
    }
    if (threeboxModel.scale && typeof threeboxModel.scale.set === 'function') {
      threeboxModel.scale.set(scaleFactor.value*scaleAdjust, scaleFactor.value*scaleAdjust, scaleFactor.value*scaleAdjust);
    }
    modelLonOffset.value=lon;
    modelLatOffset.value=lat;
    modelRotateOffset.value=modelRotationZ;
    modelScalingOffset.value=scaleAdjust;
  }
 
  const showModelEditTips = ref(true);
  watch(modelEditEnabled, (enabled) => {
    const mapDiv = document.getElementById('mapContainer');
    if(!mapDiv) return;
    if (enabled) {
      window.addEventListener('keydown', handleKeyMove);
    } else {
      window.removeEventListener('keydown', handleKeyMove);
    }
  })

  // Remove old GNB Status dialog/message/handler
  // - Remove: gnbStatusDialog, gnbStatusMessage, fetchGnbStatus

  // Remove heatmap layer/source if exists
  function removeHeatmapLayer() {
    if (map?.getLayer(HEATMAP_LAYER_ID)) map.removeLayer(HEATMAP_LAYER_ID);
    if (map?.getSource(HEATMAP_SOURCE_ID)) map.removeSource(HEATMAP_SOURCE_ID);
    // Hide color bar
    const colorBar = document.getElementById('colorBarContainer');
    if (colorBar) colorBar.style.display = 'none';
  }

  // RU Position dialog state (was GNB Status)
  const ruPositionDialog = ref(false);
  const ruPositionMessage = ref('');

  // Simulation Config dialog state
  const simConfigDialog = ref(false);
  const simConfig = reactive({
    duration: 10,
    interval: 1,
    mode: 0,
    is_full: false
  });

  // Open Simulation Config dialog
  function openSimConfig() {
    simConfigDialog.value = true;
  }

  // Apply Simulation Config (placeholder)
  function applySimConfig() {
    // TODO: 待後端實作 API
    // PATCH /projects/{id}/simulation-config
    log.debug('Apply Simulation Config (placeholder):', simConfig);
    simConfigDialog.value = false;
  }

  // Fetch RU Position (was fetchGnbStatus)
  async function fetchRuPosition() {
    let tries = 0;
    const RU_POSITION_MAX_TRIES = 256;
    let gnbData: any[] = [];
    while (tries < RU_POSITION_MAX_TRIES) {
      try {
        const res = await $apiClient.gnb.gnbStatusList();
        if (Array.isArray(res.data) && res.data.length > 0) {
          gnbData = res.data;
          break;
        } else {
          tries++;
          console.warn('RU Position empty, retrying...', tries);
        }
      } catch (e) {
        console.error('RU Position fetch error:', e);
        break;
      }
    }
    if (!gnbData.length) {
      ruPositionMessage.value = 'RU Position fetch failed or empty after retries';
      ruPositionDialog.value = true;
      return;
    }
    // Filter GNBs with valid lat/lon
    const validGnbs = gnbData.filter(g => g.lat !== null && g.lon !== null);
    if (validGnbs.length === 0) {
      ruPositionMessage.value = 'No RU has valid location data (lat/lon).';
      ruPositionDialog.value = true;
      return;
    }
    // Remove all existing RU markers
    ruMarkers.value.forEach(ru => {
      window.tb?.remove(ru.marker);
    });
    ruMarkers.value = [];
    // Add new RU markers for each valid GNB (not draggable, but allow rotate and config)
    for (const gnb of validGnbs) {
      const ru: RUMarker = {
        id: gnb.id,
        marker: null,
        coordinates: { lng: gnb.lon, lat: gnb.lat },
        brand_id: defaultBrandId.value ?? 1,
        bandwidth: defaultBrandDetails.value.bandwidth,
        tx_power: defaultBrandDetails.value.tx_power,
        rotation: 0,
        tilt: 0,
        z: 0
      };
      await addRU(ru, false /* not draggable */);
    }
    ruPositionMessage.value = `Added ${validGnbs.length} RU(s) from RU Position.`;
    ruPositionDialog.value = true;
  }

  async function addRUFromCache(value: RU, _array: RU[]): Promise<void> {

    // Type guard for location property
    interface Location {
      lon: number;
      lat: number;
      z: number;
    }
    function hasLocationProperty(obj: unknown): obj is { location: Location } {
      return (
        typeof obj === 'object' &&
        obj !== null &&
        'location' in obj &&
        typeof (obj as any).location === 'object' &&
        typeof (obj as any).location.lon === 'number' &&
        typeof (obj as any).location.lat === 'number' &&
        typeof (obj as any).location.z === 'number'
      );
    }
    const location: Location = hasLocationProperty(value)
      ? value.location
      : { lon: 0, lat: 0, z: 0 };
    const lon = location.lon;
    const lat = location.lat;
    const z = location.z;

    // Defensive: Ensure roll, brand_id, bandwidth, tx_power are numbers
    const rotation = typeof value.roll === 'number' ? value.roll : 0;
    const brand_id = typeof value.brand_id === 'number' ? value.brand_id : 1;
    const bandwidth = typeof value.bandwidth === 'number' ? value.bandwidth : 100;
    const tx_power = typeof value.tx_power === 'number' ? value.tx_power : 20;
    const tilt = typeof value.tilt === 'number' ? value.tilt : 0;

    const newId = Date.now() + Math.floor(Math.random() * 1000); // simple unique id

    const ru: RUMarker = {
      id: newId,
      marker: null,
      coordinates: { lng: lon, lat: lat },
      brand_id: brand_id,
      bandwidth: bandwidth,
      tx_power: tx_power,
      rotation: rotation,
      tilt: tilt,
      z: z
    };

    await addRU(ru);
  }



  // Initialize map when component mounts and project exists + access is confirmed
  onMounted(() => {
    watchEffect(() => {
      if (!isLoadingProject.value && projectExists.value && hasProjectAccess.value) {
        // Initialize map in next tick to ensure DOM is ready
        nextTick(async () => {
          // Wait for map container to be available
          await waitForElement('mapContainer');
          initializeMap();
          setupKeyboardListeners();
        });
      }
    });
  });
</script>

<style scoped>

#mapContainer {
  touch-action: manipulation;
}
.ru-marker {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.ru-marker:hover {
  transform: scale(1.1);
}

.color-bar-container {
  position: absolute;
  bottom: 10px;
  right: 20px;
  width: 20px;
  height: 70px;
  background-color: white;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.color-bar {
  width: 10px;
  height: 180px;
  background: linear-gradient(
    to bottom,
    rgb(255, 0, 0),    /* Red (top) */
    rgb(255, 255, 0),  /* Yellow */
    rgb(0, 128, 0),    /* Green */
    rgb(0, 0, 255)     /* Blue (bottom) */
  );
}

.color-bar-label {
  position: absolute;
  right: 30px;
  white-space: nowrap;
  transform: translateY(-50%);
  font-size: 12px;
}

.model-edit-tips {
  position: fixed;
  top: 80px;
  right: 40px;
  z-index: 9999;
  background: #fffbe7;
  border: 1px solid #e0c97f;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  padding: 18px 24px 12px 18px;
  min-width: 220px;
  font-size: 15px;
  color: #7a5a00;
}
.model-edit-tips ul {
  margin: 8px 0 8px 0;
  padding-left: 18px;
}

.floating-save-btn {
  font-weight: bold;
}

.save-btn-glow {
  background: linear-gradient(90deg, #43e97b 0%, #38f9d7 100%);
  color: #fff !important;
  font-weight: bold;
  font-size: 18px;
  border-radius: 32px;
  box-shadow: 0 4px 24px 0 #43e97b80, 0 1.5px 6px 0 #38f9d780;
  padding: 0 32px;
  transition: box-shadow 0.2s, transform 0.2s;
  letter-spacing: 1px;
  border: none;
}
.save-btn-glow:hover {
  box-shadow: 0 8px 32px 0 #43e97bcc, 0 3px 12px 0 #38f9d7cc;
  transform: scale(1.07);
  background: linear-gradient(90deg, #38f9d7 0%, #43e97b 100%);
}
.virtual-buttons {
  position: absolute;
  top: 100px;
  left: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-weight: bolder;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
.virtual-buttons .v-btn {
  font-weight: bolder !important;
  color: #fff !important;
  margin-bottom: 4px;
  box-shadow: 0 2px 2px rgba(0,0,0,0.15);
  border-radius: 6px;
  background: rgba(255,255,255,0.08);
  transition: background 0.2s;
}
.virtual-buttons .v-btn:last-child {
  margin-bottom: 0;
}
.mapboxgl-marker, .mapboxgl-marker * { pointer-events: auto !important; }
.mapboxgl-marker { z-index: 9999 !important; }
.mapboxgl-map { pointer-events: auto !important; }
</style>