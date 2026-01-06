<template>
  <div class="ru-selector-container">
    <h2>RU 管理系統</h2>
    
    <!-- RU 下拉式選單 -->
    <div class="selector-section">
      <v-select
        v-model="selectedRuKey"
        :items="ruOptions"
        label="選擇 RU"
        item-title="text"
        item-value="value"
        variant="outlined"
        prepend-inner-icon="mdi-access-point"
        style="max-width: 300px;"
        :disabled="loading"
        clearable
        @update:model-value="onRuSelect"
      >
        <template #selection="{ item }">
          <div class="selected-item">
            <v-icon class="me-2" size="small">mdi-access-point</v-icon>
            {{ item.title }}
          </div>
        </template>
        <template #item="{ props, item }">
          <v-list-item v-bind="props" :title="item.title">
            <template #prepend>
              <v-icon>mdi-access-point</v-icon>
            </template>
          </v-list-item>
        </template>
      </v-select>
    </div>

    <!-- RU 詳細資料卡片 -->
    <div v-if="selectedRuData" class="ru-detail-card">
      <v-card elevation="3">
        <v-card-title class="ru-card-title">
          <v-icon class="me-2">mdi-information</v-icon>
          {{ selectedRuData.name || `RU ${selectedRuData.RU_id}` }} 詳細資料
        </v-card-title>
        
        <v-card-text>
          <!-- 空白間隔 -->
          <div style="height: 16px;"/>
          
          <!-- 基本資訊 -->
          <div class="info-section">
            <h4 class="section-title">基本資訊</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">名稱：</span>
                <span class="info-value">{{ selectedRuData.name || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">RU ID：</span>
                <span class="info-value">{{ selectedRuData.RU_id || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">DU ID：</span>
                <span class="info-value">{{ selectedRuData.DU_id || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Project ID：</span>
                <span class="info-value">{{ selectedRuData.project_id || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Brand ID：</span>
                <span class="info-value">{{ selectedRuData.brand_id || 'N/A' }}</span>
              </div>
            </div>
          </div>

          <!-- 位置資訊 -->
          <div class="info-section">
            <h4 class="section-title">位置資訊</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">緯度：</span>
                <span class="info-value">{{ formatCoordinate(selectedRuData.location?.lat) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">經度：</span>
                <span class="info-value">{{ formatCoordinate(selectedRuData.location?.lon) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">高度：</span>
                <span class="info-value">{{ formatCoordinate(selectedRuData.location?.z) }} m</span>
              </div>
            </div>
          </div>

          <!-- 技術規格 -->
          <div class="info-section">
            <h4 class="section-title">技術規格</h4>
            <div class="config-grid">
              <div class="info-item">
                <span class="info-label">Bandwidth：</span>
                <span class="info-value">{{ formatValue(selectedRuData.bandwidth, 'MHz') }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Tx_power：</span>
                <span class="info-value">{{ formatValue(selectedRuData.tx_power, 'dBm') }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Opening_angle：</span>
                <span class="info-value">{{ formatValue(selectedRuData.opening_angle, '°') }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Roll：</span>
                <span class="info-value">{{ formatValue(selectedRuData.roll, '°') }}</span>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- 載入狀態 -->
    <div v-if="loading" class="loading-container">
      <v-progress-circular indeterminate color="primary"/>
      <p class="loading-text">載入中...</p>
    </div>

    <!-- 無資料提示 -->
    <div v-if="!loading && ruOptions.length === 0" class="no-data-container">
      <v-icon size="64" color="grey">mdi-access-point-off</v-icon>
      <p class="no-data-text">目前專案沒有可用的 RU 資料</p>
      <v-btn 
        color="primary" 
        class="mt-4"
        @click="fetchRuData"
      >
        重新載入
      </v-btn>
    </div>

    <!-- 提示訊息 -->
    <v-snackbar 
      v-model="snackbar.show" 
      :color="snackbar.color" 
      timeout="3000"
      location="top"
    >
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, watch } from 'vue'

  const { $apiClient } = useNuxtApp()
  const route = useRoute()

  // 響應式資料
  const ruList = ref([])
  const selectedRuKey = ref(null)
  const loading = ref(false)
  const snackbar = ref({ show: false, text: '', color: 'success' })

  // 從 URL 獲取 project ID
  const currentProjectId = computed(() => {
    return parseInt(route.params.projectId) || null
  })

  // 計算屬性
  const ruOptions = computed(() => {
    // 過濾出符合當前 project ID 的 RU
    const filteredRUs = ruList.value.filter(ru => 
      currentProjectId.value === null || ru.project_id === currentProjectId.value
    )
  
    return filteredRUs.map(ru => {
      const displayName = ru.name || `RU ${ru.RU_id}`
      return {
        text: displayName,
        value: ru.RU_id,
        title: displayName
      }
    })
  })

  const selectedRuData = computed(() => {
    if (!selectedRuKey.value) return null
    const foundRU = ruList.value.find(ru => ru.RU_id === selectedRuKey.value)
  
    // 確認選中的 RU 屬於當前專案
    if (foundRU && (currentProjectId.value === null || foundRU.project_id === currentProjectId.value)) {
      return foundRU
    }
    return null
  })

  // 監聽選擇變化
  watch(selectedRuKey, (newKey, oldKey) => {
    console.log('selectedRuKey 變化:', { from: oldKey, to: newKey })
  
    // 添加詳細的資料調試
    if (newKey) {
      const selectedRU = ruList.value.find(ru => ru.RU_id === newKey)
      if (selectedRU) {
        console.log('選中的 RU 完整資料:', selectedRU)
        console.log('座標資料檢查:', {
          lat: selectedRU.lat,
          lat_type: typeof selectedRU.lat,
          lon: selectedRU.lon, 
          lon_type: typeof selectedRU.lon,
          z: selectedRU.z,
          z_type: typeof selectedRU.z
        })
      }
    }
  })

  // 方法
  async function fetchRuData() {
    loading.value = true
    selectedRuKey.value = null
  
    try {
      console.log(`載入專案 ${currentProjectId.value} 的 RU 資料...`)
    
      // 調用 RU API
      const response = await $apiClient.ru.getRUs()
      console.log('API 回應:', response)
    
      // 檢查回應資料結構
      let apiData = []
    
      if (response && response.data) {
        apiData = Array.isArray(response.data) ? response.data : [response.data]
      } else if (Array.isArray(response)) {
        apiData = response
      } else {
        console.warn('意外的 API 回應格式:', response)
        apiData = []
      }
    
      // 驗證資料格式
      const validRUs = apiData.filter(ru => {
        const isValid = ru && (ru.RU_id !== undefined || ru.name)
        if (!isValid) {
          console.warn('無效的 RU 資料:', ru)
        }
        return isValid
      })
    
      ruList.value = validRUs
      console.log('所有 RU 資料:', ruList.value)
    
      // 詳細檢查第一筆資料的結構
      if (validRUs.length > 0) {
        console.log('第一筆 RU 資料詳細檢查:', validRUs[0])
        console.log('第一筆資料的所有 key:', Object.keys(validRUs[0]))
        console.log('location 物件內容:', validRUs[0].location)
        if (validRUs[0].location) {
          console.log('location 物件的 keys:', Object.keys(validRUs[0].location))
        }
        console.log('座標相關欄位檢查:', {
          'lat存在': 'lat' in validRUs[0],
          'lat值': validRUs[0].lat,
          'lat類型': typeof validRUs[0].lat,
          'lon存在': 'lon' in validRUs[0], 
          'lon值': validRUs[0].lon,
          'lon類型': typeof validRUs[0].lon,
          'z存在': 'z' in validRUs[0],
          'z值': validRUs[0].z,
          'z類型': typeof validRUs[0].z,
          'location物件存在': !!validRUs[0].location
        })
      }
    
      // 計算符合當前專案的 RU 數量
      const projectRUs = validRUs.filter(ru => 
        currentProjectId.value === null || ru.project_id === currentProjectId.value
      )
    
      if (projectRUs.length > 0) {
        showSnackbar(`成功載入 ${projectRUs.length} 個 RU 資料`, 'success')
      } else if (validRUs.length > 0) {
        showSnackbar(`此專案沒有 RU 資料 (共載入 ${validRUs.length} 個其他專案的 RU)`, 'warning')
      } else {
        showSnackbar('資料庫中沒有 RU 資料，請先新增一些 RU', 'warning')
      }
    
    } catch (err) {
      console.error('載入 RU 資料失敗:', err)
    
      let errorMessage = '載入失敗'
      if (err.response) {
        errorMessage = `API 錯誤 (${err.response.status}): ${err.response.statusText}`
        if (err.response.data?.message) {
          errorMessage += ` - ${err.response.data.message}`
        }
      } else if (err.request) {
        errorMessage = '網路連接失敗 - 請檢查網路連接'
      } else {
        errorMessage = err.message || '未知錯誤'
      }
    
      showSnackbar(errorMessage, 'error')
      ruList.value = []
    } finally {
      loading.value = false
    }
  }

  function onRuSelect(ruId) {
    console.log('RU 選擇事件:', ruId)
  
    if (ruId !== null && ruId !== undefined) {
      const selectedRU = ruList.value.find(ru => ru.RU_id === ruId)
      if (selectedRU) {
        const displayName = selectedRU.name || `RU ${selectedRU.RU_id}`
        showSnackbar(`已選擇 ${displayName}`, 'info')
      }
    } else {
      showSnackbar('已清除選擇', 'info')
    }
  }

  function showSnackbar(text, color = 'success') {
    snackbar.value = { show: true, text, color }
  }

  // 格式化座標顯示 - 修復版本（加強調試）
  function formatCoordinate(value) {
    // 添加調試資訊
    console.log('formatCoordinate 輸入值:', value, '類型:', typeof value)
  
    if (value === null || value === undefined) {
      console.log('座標值為 null 或 undefined')
      return 'N/A'
    }
  
    if (typeof value === 'number') {
      const formatted = value.toFixed(6)
      console.log('格式化後的座標:', formatted)
      return formatted
    }
  
    if (typeof value === 'string' && !isNaN(parseFloat(value))) {
      const formatted = parseFloat(value).toFixed(6)
      console.log('字串轉數字後格式化:', formatted)
      return formatted
    }
  
    console.log('座標值無法格式化，返回原值:', String(value))
    return String(value)
  }

  // 新增：格式化數值顯示（處理 0 值的情況）
  function formatValue(value, unit = '') {
    // 檢查是否為 null 或 undefined
    if (value === null || value === undefined) return 'N/A'
  
    // 對於數字類型（包括 0），都正常顯示
    if (typeof value === 'number') {
      return `${value}${unit ? ' ' + unit : ''}`
    }
  
    // 對於字串，檢查是否為空
    if (typeof value === 'string' && value.trim() !== '') {
      return `${value}${unit ? ' ' + unit : ''}`
    }
  
    return 'N/A'
  }

  // 生命週期
  onMounted(() => {
    console.log(`組件已掛載，開始載入專案 ${currentProjectId.value} 的資料`)
    fetchRuData()
  })
</script>

<style scoped>
.ru-selector-container {
  margin: 40px 32px;
}

.selector-section {
  margin: 24px 0;
}

.selected-item {
  display: flex;
  align-items: center;
}

.ru-detail-card {
  margin-top: 32px;
}

.ru-card-title {
  background: linear-gradient(135deg, #1976d2, #42a5f5);
  color: white;
  display: flex;
  align-items: center;
}

.info-section {
  margin-bottom: 24px;
}

.section-title {
  color: #1976d2;
  margin-bottom: 16px;
  font-weight: 600;
  border-bottom: 2px solid #e3f2fd;
  padding-bottom: 8px;
}

.info-grid, .config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  transition: background 0.2s;
}

.info-item:hover {
  background: #e3f2fd;
}

.info-label {
  font-weight: 600;
  color: #424242;
  min-width: 120px;
}

.info-value {
  color: #1976d2;
  font-weight: 500;
  word-break: break-all;
}

.loading-container, .no-data-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 0;
}

.loading-text, .no-data-text {
  margin-top: 16px;
  color: #666;
  font-size: 16px;
}

@media (max-width: 768px) {
  .info-grid, .config-grid {
    grid-template-columns: 1fr;
  }
  
  .ru-selector-container {
    margin: 20px 16px;
  }
  
  .info-label {
    min-width: 100px;
  }
}
</style>