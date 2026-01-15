<template>
  <v-container class="fill-height create-project-container" fluid>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="12" md="10" lg="8">
        <!-- page title -->
        <h2 class="text-h4 font-weight-bold mb-4">New Project</h2>

        <!-- form start -->
        <v-form>
          <!-- Project Name -->
          <label class="text-h6 font-weight-medium">Project Name</label>
          <v-text-field 
            v-model="projectName" 
            density="comfortable" 
            :rules="[rules.required]" 
            required
          />

          <!-- Position Selects -->
          <div class="mt-4">
            <v-row dense>
              <!-- Outdoor: Search Address (Figma 3:785) -->
              <template v-if="isOutdoor">
                <v-col cols="8">
                  <label class="text-h6 font-weight-medium">Search Address (OpenStreetMap)</label>
                  <v-text-field
                    v-model="searchAddress"
                    placeholder="請輸入地址，例如 高雄市前鎮區凱旋四路 119號"
                    density="comfortable"
                    outlined
                    hint="門牌號前請加空格，並以阿拉伯數字表示"
                    persistent-hint
                  />
                </v-col>
                <v-col cols="2" class="d-flex align-center justify-center">
                  <v-btn
                    color="primary"
                    class="btn-fixed-width"
                    :disabled="searchDisabled"
                    style="text-transform: capitalize"
                    @click="geocodeAddress"
                  >
                    Search
                  </v-btn>
                </v-col>
              </template>
              <!-- Indoor: Upload map file (Figma 3:814) -->
              <template v-else>
                <v-col cols="8">
                  <label class="text-h6 font-weight-medium">Upload your map file</label>
                  <v-file-input
                    v-model="mapFile"
                    placeholder="選擇地圖檔案"
                    density="comfortable"
                    prepend-icon=""
                    prepend-inner-icon="mdi-upload"
                    accept=".gltf,.glb,.json"
                    hint="支援 GLTF, GLB, JSON 格式"
                    persistent-hint
                  />
                </v-col>
                <v-col cols="2" class="d-flex align-center justify-center">
                  <v-btn
                    color="primary"
                    class="btn-fixed-width"
                    :disabled="uploadDisabled"
                    style="text-transform: capitalize"
                    @click="uploadMapFile"
                  >
                    Upload
                  </v-btn>
                </v-col>
              </template>
            </v-row>
            <!-- Map preview -->
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
                  <!-- Indoor/Outdoor toggle - Figma Node 3:785 -->
                  <div class="mt-4 d-flex align-center">
                    <v-switch
                      v-model="isOutdoor"
                      color="primary"
                      hide-details
                      density="compact"
                    />
                    <span class="ml-2">{{ isOutdoor ? 'outdoor' : 'indoor' }}</span>
                  </div>
                </div>
              </v-col>
            </v-row>
          </div>
          <!-- Members List -->
          <div class="mt-6">
            <label class="text-h6 font-weight-medium">Members List</label>
            <v-row dense>
              <v-col cols="5">
                <v-text-field 
                  v-model="inviteEmail" 
                  label="email" 
                  density="comfortable" 
                  outlined 
                  :rules="[rules.email]"
                />
              </v-col>
              <v-col cols="7">
                <v-btn
                  class="btn-fixed-width"
                  color="primary"
                  style="text-transform: capitalize"
                  :disabled="inviteDisabled"
                  @click="invite"
                >
                  Invite
                </v-btn>
              </v-col>
            </v-row>
            <!-- Displayed Members -->
            <v-row>
              <div class="mt-2">
                <p v-for="(email, idx) in memberEmails" :key="email">
                  {{ email }} <span v-if="idx === 0" class="text-grey">Owner</span>
                </p>
              </div>
            </v-row>
          </div>

          <!-- action button -->
          <div class="d-flex justify-start mt-4">
            <v-btn 
              class="btn-fixed-width me-3" 
              color="primary" 
              style="text-transform: capitalize" 
              :disabled="createDisabled"
              @click="create"
            >
              Create
            </v-btn>
            <v-btn 
              class="btn-fixed-width" 
              color="grey" 
              style="text-transform: capitalize" 
              @click="back"
            >
              Back
            </v-btn>
          </div>
        </v-form>
      </v-col>
    </v-row>
    <v-dialog v-model="isLoading" persistent transition="scale-transition" fullscreen>
      <v-container class="fill-height d-flex justify-center align-center">
        <div class="d-flex flex-column align-center">
          <v-progress-circular indeterminate color="primary" size="64" />
          <div class="mt-4 text-subtitle-1">Creating GLTF map...</div>
        </div>
      </v-container>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">

  import 'mapbox-gl/dist/mapbox-gl.css'
  
  import { onMounted, computed, ref, nextTick } from 'vue'
  import { useRouter } from 'vue-router'
  import mapboxgl from 'mapbox-gl'
  import * as turf from '@turf/turf'

  const { $apiClient } = useNuxtApp()
  const router = useRouter()

  const rules = {
    required: (v: string) => !!v || '此欄位為必填',
    email:    (v: string) => /.+@.+\..+/.test(v) || '電子郵件格式錯誤',
  }
  const projectName = ref('')

  const coordinates = ref({ x: 0, y: 0 })
  const mapContainer = ref<HTMLDivElement | null>(null)
  const visibleScope = ref(0)
  const apiScope = ref(0)
  const isLoading = ref(false)
  const searchAddress = ref('')

  let map: mapboxgl.Map
  
  const inviteEmail = ref('')
  const memberEmails = ref<string[]>([])
  const isOutdoor = ref(true) // 預設 outdoor
  const mapFile = ref<File[]>([]) // Indoor 模式用的地圖檔案

  // Disable invite button
  const inviteDisabled = computed(() => {
    return !inviteEmail.value || rules.email(inviteEmail.value) !== true
  })
  
  // Disable set button
  const searchDisabled = computed(() => {
    return (
      !searchAddress.value
    )
  })

  // Disable upload button (Indoor mode)
  const uploadDisabled = computed(() => {
    return !mapFile.value || mapFile.value.length === 0
  })

  // Disable create button 
  const createDisabled = computed(() => {
    return (
      !projectName.value ||
      rules.required(projectName.value) !== true
    )
  })

  onMounted(async () => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiZGFyaXVzbHVuZyIsImEiOiJjbHk3MWhvZW4wMTl6MmlxMnVhNzI3cW0yIn0.WGvtamOAfwfk3Ha4KsL3BQ'

    // Two styles: prefer online style when online; fallback to local style when offline
    const config = useRuntimeConfig()
    const isOnline = config.public?.isOnline
    const onlineStyle = 'mapbox://styles/mapbox/streets-v12'
    const offlineStyle = config.public?.offlineMapboxGLJSURL
    // Cast runtime config value to the expected Mapbox style type to satisfy TypeScript
    const initialStyle = (isOnline ? onlineStyle : offlineStyle) as string | mapboxgl.StyleSpecification | undefined

    map = new mapboxgl.Map({
      container: mapContainer.value as HTMLElement,
      style: initialStyle,
      center: [120.99665148838264, 24.787036351863208],
      zoom: 18,
      pitch: 0,
      projection: 'globe',
    })

    const nav = new mapboxgl.NavigationControl({ visualizePitch: true })
    map.addControl(nav, 'top-right')
    map.addControl(new mapboxgl.ScaleControl())

    map.on('moveend', () => {
      const center = map.getCenter()
      coordinates.value = { x: center.lng, y: center.lat }
    })

    map.on('zoomend', logVisibleMapSizeInMeters)

    map.on('load', () => {
      const center = map.getCenter()
      coordinates.value = { x: center.lng, y: center.lat }
      logVisibleMapSizeInMeters()
    })
  })

  // Compute map margin
  function logVisibleMapSizeInMeters() {
    if (!map) return

    const bounds = map.getBounds()
    if (!bounds) return

    const nw = bounds.getNorthWest()
    const se = bounds.getSouthEast()

    const distanceInKmLat = turf.distance(
      [nw.lng, nw.lat],
      [nw.lng, se.lat], 
      { units: 'kilometers' }
    )

    const distanceLatMeters = Math.round(distanceInKmLat * 500)

    visibleScope.value = distanceLatMeters * 2
    apiScope.value = distanceLatMeters
    
  }

  function invite() {
    if (
      inviteEmail.value &&
      rules.email(inviteEmail.value) === true &&
      !memberEmails.value.includes(inviteEmail.value)
    ) {
      memberEmails.value.push(inviteEmail.value)
      inviteEmail.value = ''
      alert('Invited!')
    }
  }

  function back() {
    router.back()
  }

  // Nominatim API 
  async function geocodeAddress() {
    if (!searchAddress.value) {
      alert('請輸入地址')
      return
    }

    try {

      const response = await $apiClient.geocode.searchGeocode({
        q: searchAddress.value
      })
      const results = response.data

      if (results.length === 0) {
        alert('找不到該地址，請確認格式或換個關鍵字')
        return
      }

      const { lat, lon, address } = results[0]
      
      const allowedCities = ['高雄市', '新竹市', '新北市']
      const city = address!.city

      if (!allowedCities.includes(city)) {
        alert(`僅支援 ${allowedCities.join('、')} 內的地址`)
        return
      }

      const lng = parseFloat(lon!)
      const latitude = parseFloat(lat!)

      // 更新座標
      coordinates.value = { x: lng, y: latitude }

      // 導航到新地點
      map.setCenter([lng, latitude])

    } catch (error) {
      console.error(error)
      alert('查詢地址時發生錯誤')
    }
  }

  // Indoor 模式：上傳地圖檔案
  // TODO: 待後端 API 實作 - POST /projects/upload-map
  function uploadMapFile() {
    if (!mapFile.value || mapFile.value.length === 0) {
      alert('請選擇地圖檔案')
      return
    }
    // placeholder: 後端 API 尚未實作
    alert('上傳功能尚未接上後端 API')
    console.log('TODO: 上傳地圖檔案', mapFile.value[0]?.name)
  }

  async function create() {
    isLoading.value = true
    const data = {
      title: projectName.value,
      date: new Date().toISOString().slice(0, 10),
      lat: coordinates.value.y,
      lon: coordinates.value.x,
      margin: apiScope.value,
    }
    try {
      const response = await $apiClient.project.projectsCreate(data)
      const projectId = (response.data as any).details.project.project_id

      alert(`Project: ${projectName.value} created!`)
      await nextTick()
      await nextTick()
      window.location.href = `/projects/${projectId}/config/evaluations`
    } catch (e) {
      alert('建立失敗')
      console.error(e)
    } finally {
      isLoading.value = false 
    }
  }
  
</script>

<style scoped>

.btn-fixed-width {
  min-width: 90px;
}

.map-center-marker {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  transform: translate(-50%, -50%);
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 15px solid red;
  z-index: 10;
}
</style>
