<template>
  <div class="ai-list-container">
    <h2>Primitive AI 模型列表</h2>

    <!-- 載入中狀態 -->
    <div v-if="isLoading" class="loading-state">
      <v-progress-circular indeterminate color="primary" />
      <span>載入中...</span>
    </div>

    <!-- 錯誤狀態 -->
    <div v-else-if="loadError" class="error-state">
      <span>{{ loadError }}</span>
      <v-btn color="primary" size="small" @click="fetchAIs">重試</v-btn>
    </div>

    <!-- 空狀態 -->
    <div v-else-if="!aiList.length" class="empty-state">
      <span>目前沒有模型資料</span>
    </div>

    <div v-else class="ai-list-table">
      <div class="ai-list-header">
        <div>模型名稱</div>
        <div>模型 ID</div>
        <div>指標數量</div>
        <div>版本</div>
        <div>啟用</div>
        <div>操作</div>
      </div>
      <div
        v-for="ai in aiList"
        :key="ai.model_id"
        class="ai-list-row"
        style="cursor:pointer"
        @click="showAIDetail(ai)"
      >
        <div>{{ ai.model_name }}</div>
        <div>{{ ai.model_id }}</div>
        <div>{{ ai.ai_metrics?.length ?? 0 }}</div>
        <div @click.stop>
          <v-select
            v-model="selectedVersions[ai.model_id]"
            :items="getVersionList(ai)"
            class="version-select"
            density="compact"
            hide-details
            variant="outlined"
            @update:model-value="handleVersionChange(ai, $event)"
          />
        </div>
        <div class="enable-switch-container" @click.stop>
          <v-switch
            :model-value="ai.enabled ?? false"
            :disabled="btnLoading[ai.model_id]?.enable"
            hide-details
            density="compact"
            color="success"
            @update:model-value="handleToggleEnable(ai, $event)"
          />
          <div v-if="btnLoading[ai.model_id]?.enable" class="switch-loading">
            <v-progress-circular size="16" width="2" indeterminate />
          </div>
        </div>
        <div class="action-btns" @click.stop>
          <v-btn color="primary" size="small" @click="showAIDetail(ai)">詳細</v-btn>
          <v-btn color="warning" size="small" @click="openEditDialog(ai)">編輯</v-btn>
          <v-btn color="info" size="small" :loading="btnLoading[ai.model_id]?.preview" @click="handlePreview(ai)">預覽</v-btn>
          <v-btn color="secondary" size="small" :loading="btnLoading[ai.model_id]?.pretrain" @click="handlePretrain(ai)">Pretrain</v-btn>
          <v-btn color="purple" size="small" @click="openRetrainDialog(ai)">Retrain</v-btn>
          <v-btn color="error" size="small" @click="openDeleteDialog(ai)">刪除</v-btn>
        </div>
      </div>
    </div>

    <!-- 詳細資料 Modal -->
    <v-dialog v-model="detailDialog" max-width="900">
      <v-card v-if="selectedAI">
        <v-card-title>模型詳細資料</v-card-title>
        <v-card-text>
          <div>模型名稱：{{ selectedAI.model_name }}</div>
          <div>模型 ID：{{ selectedAI.model_id }}</div>
          <div v-if="selectedAI.ai_metrics && selectedAI.ai_metrics.length">
            <h4 style="margin-top:16px;">AI 指標：</h4>
            <v-table>
              <thead>
                <tr>
                  <th>名稱</th>
                  <th>描述</th>
                  <th>單位</th>
                  <th>類型</th>
                  <th>間隔</th>
                  <th>Operator</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="metric in selectedAI.ai_metrics" :key="metric.id">
                  <td>{{ metric.name }}</td>
                  <td>{{ metric.description }}</td>
                  <td>{{ metric.unit || '-' }}</td>
                  <td>{{ metric.type }}</td>
                  <td>{{ metric.interval ?? '-' }}</td>
                  <td>{{ metric.operator ?? '-' }}</td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn text @click="detailDialog = false">關閉</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 刪除確認 Modal -->
    <v-dialog v-model="confirmDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>確定要刪除嗎？</v-card-title>
        <v-card-text v-if="deleteTarget">
          將刪除模型：{{ deleteTarget.model_name }} (ID: {{ deleteTarget.model_id }})
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="confirmDeleteDialog = false">取消</v-btn>
          <v-btn color="error" :loading="isDeleting" @click="confirmDelete">確定刪除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 編輯模型 Modal -->
    <v-dialog v-model="editDialog" max-width="500">
      <v-card>
        <v-card-title>編輯模型</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editForm.model_name"
            label="模型名稱"
            :rules="[v => !!v || '模型名稱不可為空']"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="editDialog = false">取消</v-btn>
          <v-btn color="primary" :loading="isUpdating" @click="confirmUpdate">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Retrain Modal -->
    <v-dialog v-model="retrainDialog" max-width="500">
      <v-card>
        <v-card-title>Retrain 模型</v-card-title>
        <v-card-subtitle v-if="retrainTarget" class="pb-2">
          {{ retrainTarget.model_name }} (ID: {{ retrainTarget.model_id }})
        </v-card-subtitle>
        <v-card-text>
          <v-text-field
            v-model.number="retrainConfig.round"
            label="Central exchange round"
            type="number"
            min="1"
          />
          <v-text-field
            v-model.number="retrainConfig.epochs"
            label="Local training epoch"
            type="number"
            min="1"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="retrainDialog = false">取消</v-btn>
          <v-btn color="primary" :loading="isRetraining" @click="confirmRetrain">開始訓練</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Pretrain Result Modal -->
    <v-dialog v-model="pretrainResultDialog" max-width="900">
      <v-card>
        <v-card-title class="pretrain-result-header">Pre-train Result</v-card-title>
        <v-card-subtitle v-if="pretrainResultTarget" class="pb-2">
          {{ pretrainResultTarget.model_name }} (ID: {{ pretrainResultTarget.model_id }})
        </v-card-subtitle>
        <v-card-text>
          <!-- 指標摘要區塊 -->
          <div class="pretrain-metrics-summary">
            <div class="metrics-row">
              <div class="metric-card">
                <div class="metric-label">Accuracy</div>
                <div class="metric-value">92.5%</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Loss</div>
                <div class="metric-value">0.0831</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Epochs</div>
                <div class="metric-value">50</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Training Time</div>
                <div class="metric-value">12m 34s</div>
              </div>
            </div>
            <div class="placeholder-notice">
              <v-icon size="small">mdi-information-outline</v-icon>
              <span>以上為 placeholder 資料，待接入後端 API</span>
            </div>
          </div>
          <!-- 圖表區塊 (placeholder) -->
          <div class="pretrain-chart-area">
            <div class="chart-placeholder">
              <v-icon size="64" color="grey-lighten-1">mdi-chart-line</v-icon>
              <div class="chart-placeholder-text">Training Loss / Accuracy Chart</div>
              <div class="chart-placeholder-subtext">
                TODO: 待接入 GET /primitive_ai_models/{'{'}id{'}'}/pretrain/result
              </div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="pretrainResultDialog = false">關閉</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 新增模型按鈕 -->
    <div style="margin-top:32px; text-align:right;">
      <v-btn color="success" @click="addDialog = true">新增模型</v-btn>
    </div>

    <!-- 新增模型 Modal -->
    <v-dialog v-model="addDialog" max-width="1000">
      <v-card>
        <v-card-title>新增 Primitive AI 模型</v-card-title>
        <v-card-text>
          <v-text-field v-model="newAI.model_name" label="模型名稱" required class="mb-4" />
          <div v-for="metric in allMetrics" :key="metric.abstract_metrics_id" class="metric-item">
            <v-checkbox
              v-model="metric.selected"
              :label="metric.display_name"
              density="compact"
              hide-details
            />
            <div v-if="metric.selected" class="metric-fields">
              <v-text-field v-model="metric.input.name" label="名稱" density="compact" />
              <v-text-field v-model="metric.input.description" label="描述" density="compact" />
              <v-text-field v-model="metric.input.type" label="類型" density="compact" />
              <v-text-field v-model="metric.input.interval" label="間隔" type="number" density="compact" />
              <v-text-field v-model="metric.input.operator" label="Operator" density="compact" />
              <v-text-field v-model="metric.input.unit" label="單位" density="compact" />
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="confirmAdd">新增</v-btn>
          <v-btn text @click="addDialog = false">取消</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 刪除成功/失敗提示 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2000" location="top">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  const { $apiClient } = useNuxtApp()

  const aiList = ref([])
  const detailDialog = ref(false)
  const selectedAI = ref(null)
  const confirmDeleteDialog = ref(false)
  const deleteTarget = ref(null)
  const isDeleting = ref(false)
  const snackbar = ref({ show: false, text: '', color: 'success' })
  const addDialog = ref(false)
  const newAI = ref({ model_name: '' })
  const allMetrics = ref([])

  // 編輯相關狀態
  const editDialog = ref(false)
  const editForm = ref({ model_id: null, model_name: '' })
  const isUpdating = ref(false)

  // Retrain 相關狀態
  const retrainDialog = ref(false)
  const retrainTarget = ref(null)
  const retrainConfig = ref({ round: 10, epochs: 5 })
  const isRetraining = ref(false)

  // Pretrain Result 相關狀態
  const pretrainResultDialog = ref(false)
  const pretrainResultTarget = ref(null)

  // 版本選擇器狀態
  const selectedVersions = ref({})

  // 頁面載入狀態
  const isLoading = ref(true)
  const loadError = ref(null)

  // 各按鈕的 loading 狀態（per model）
  const btnLoading = ref({})

  onMounted(async () => {
    await fetchAIs()
    await fetchAllMetrics()
  })

  async function fetchAIs () {
    isLoading.value = true
    loadError.value = null
    try {
      const res = await $apiClient.primitiveAiModel.primitiveAiModelsList()
      aiList.value = res.data.sort((a, b) => a.model_id - b.model_id)
      // 初始化各模型的版本選擇
      aiList.value.forEach(ai => {
        if (!selectedVersions.value[ai.model_id]) {
          const versions = getVersionList(ai)
          selectedVersions.value[ai.model_id] = versions[0] || 'v1'
        }
      })
    } catch (e) {
      loadError.value = '載入模型列表失敗'
      snackbar.value = { show: true, text: '載入模型列表失敗', color: 'error' }
      console.error('Failed to fetch AI models:', e)
    } finally {
      isLoading.value = false
    }
  }

  // 取得模型的可用版本清單
  // TODO: 待後端提供版本 API 後，改為從 ai 物件讀取
  function getVersionList(_ai) {
    // 暫時用假資料，未來會從 _ai 物件讀取實際版本
    const baseVersions = ['v1', 'v2', 'v3']
    return baseVersions
  }

  // 版本切換處理 (placeholder)
  function handleVersionChange(ai, newVersion) {
    // TODO: 後端需新增 PATCH /primitive_ai_models/{id}/version
    // 預期請求：{ version: string }
    // 預期回應：{ model_id, current_version }
    snackbar.value = {
      show: true,
      text: `版本切換功能尚未接上後端 (${ai.model_name} → ${newVersion})`,
      color: 'warning'
    }
    console.warn('[TODO] Version switch API not implemented', {
      modelId: ai.model_id,
      modelName: ai.model_name,
      selectedVersion: newVersion
    })
  }

  // 只取 abstract metrics 的 display_name 與 id，並初始化一組 input 欄位
  async function fetchAllMetrics () {
    const res = await $apiClient.abstractMetrics.abstractMetricsList()
    allMetrics.value = res.data.map(m => ({
      abstract_metrics_id: m.id,
      display_name: m.display_name,
      selected: false,
      input: {
        name: '',
        description: '',
        type: '',
        interval: '',
        operator: '',
        unit: '',
      }
    }))
  }

  function showAIDetail(ai) {
    selectedAI.value = ai
    detailDialog.value = true
  }

  function openDeleteDialog(ai) {
    deleteTarget.value = ai
    confirmDeleteDialog.value = true
  }

  async function confirmDelete() {
    if (!deleteTarget.value) return
    isDeleting.value = true
    try {
      await $apiClient.primitiveAiModel.primitiveAiModelsDelete(deleteTarget.value.model_id)
      snackbar.value = { show: true, text: '刪除成功', color: 'success' }
      confirmDeleteDialog.value = false
      await fetchAIs()
    } catch (e) {
      snackbar.value = { show: true, text: '刪除失敗', color: 'error' }
      console.log(e)
    } finally {
      isDeleting.value = false
    }
  }

  // 開啟編輯對話框
  function openEditDialog(ai) {
    editForm.value = {
      model_id: ai.model_id,
      model_name: ai.model_name
    }
    editDialog.value = true
  }

  // 確認更新
  async function confirmUpdate() {
    if (!editForm.value.model_name.trim()) {
      snackbar.value = { show: true, text: '模型名稱不可為空', color: 'error' }
      return
    }
    isUpdating.value = true
    try {
      await $apiClient.primitiveAiModel.primitiveAiModelsUpdate(
        editForm.value.model_id,
        { model_name: editForm.value.model_name }
      )
      snackbar.value = { show: true, text: '更新成功', color: 'success' }
      editDialog.value = false
      await fetchAIs()
    } catch (e) {
      snackbar.value = { show: true, text: '更新失敗', color: 'error' }
      console.log(e)
    } finally {
      isUpdating.value = false
    }
  }

  // 設定按鈕 loading 狀態的輔助函式
  function setBtnLoading(modelId, btnType, value) {
    if (!btnLoading.value[modelId]) {
      btnLoading.value[modelId] = {}
    }
    btnLoading.value[modelId][btnType] = value
  }

  // Enable/Disable 切換 (placeholder)
  function handleToggleEnable(ai, newState) {
    // TODO: 後端需新增 PATCH /primitive_ai_models/{id}/enable
    // 預期請求：{ enabled: boolean }
    // 預期回應：{ model_id, enabled }
    setBtnLoading(ai.model_id, 'enable', true)
    setTimeout(() => {
      snackbar.value = {
        show: true,
        text: '啟用/停用功能尚未接上後端',
        color: 'warning'
      }
      console.warn('[TODO] Enable API not implemented', {
        modelId: ai.model_id,
        modelName: ai.model_name,
        newState
      })
      setBtnLoading(ai.model_id, 'enable', false)
    }, 500)
  }

  // Preview (placeholder)
  function handlePreview(ai) {
    // TODO: 後端需新增 GET /primitive_ai_models/{id}/preview
    // 預期回應：{ preview_data, metrics_summary }
    setBtnLoading(ai.model_id, 'preview', true)
    setTimeout(() => {
      snackbar.value = {
        show: true,
        text: 'Preview 功能尚未接上後端',
        color: 'warning'
      }
      console.warn('[TODO] Preview API not implemented', {
        modelId: ai.model_id,
        modelName: ai.model_name
      })
      setBtnLoading(ai.model_id, 'preview', false)
    }, 500)
  }

  // Pretrain (placeholder) - 顯示模擬結果對話框
  function handlePretrain(ai) {
    // TODO: 後端需新增 POST /primitive_ai_models/{id}/pretrain
    // 預期請求：{ config?: PretrainConfig }
    // 預期回應：{ job_id, status: 'queued' }
    // TODO: 實際流程應該要呼叫 API 取得真正的訓練結果
    setBtnLoading(ai.model_id, 'pretrain', true)
    setTimeout(() => {
      console.warn('[TODO] Pretrain API not implemented', {
        modelId: ai.model_id,
        modelName: ai.model_name
      })
      setBtnLoading(ai.model_id, 'pretrain', false)
      // 開啟結果對話框（顯示 placeholder 資料）
      pretrainResultTarget.value = ai
      pretrainResultDialog.value = true
    }, 500)
  }

  // 開啟 Retrain 對話框
  function openRetrainDialog(ai) {
    retrainTarget.value = ai
    retrainConfig.value = { round: 10, epochs: 5 }
    retrainDialog.value = true
  }

  // 確認 Retrain (placeholder)
  function confirmRetrain() {
    // TODO: 後端需新增 POST /primitive_ai_models/{id}/retrain
    // 預期請求：{ round: number, epochs: number }
    // 預期回應：{ job_id, status: 'queued' }
    isRetraining.value = true
    setTimeout(() => {
      snackbar.value = {
        show: true,
        text: 'Retrain 功能尚未接上後端',
        color: 'warning'
      }
      console.warn('[TODO] Retrain API not implemented', {
        modelId: retrainTarget.value?.model_id,
        modelName: retrainTarget.value?.model_name,
        config: retrainConfig.value
      })
      isRetraining.value = false
      retrainDialog.value = false
    }, 500)
  }

  async function confirmAdd() {
    if (!newAI.value.model_name.trim()) {
      snackbar.value = { show: true, text: '模型名稱不可為空', color: 'error' }
      return
    }

    // 組合 ai_metrics
    const selectedMetrics = []
    allMetrics.value.forEach(metric => {
      if (metric.selected && metric.input.name.trim()) {
        selectedMetrics.push({
          abstract_metrics_id: metric.abstract_metrics_id,
          description: metric.input.description,
          interval: Number(metric.input.interval) || 0,
          name: metric.input.name,
          operator: metric.input.operator || '=',
          type: metric.input.type || null,
          unit: metric.input.unit || null
        })
      }
    })
    try {
      await $apiClient.primitiveAiModel.primitiveAiModelsCreate({
        model_name: newAI.value.model_name,
        ai_metrics: selectedMetrics
      })
      snackbar.value = { show: true, text: '新增成功', color: 'success' }
      addDialog.value = false
      newAI.value = { model_name: '' }
      await fetchAIs()
    } catch (e) {
      snackbar.value = { show: true, text: '新增失敗', color: 'error' }
      console.log(e)
    }
  }
</script>

<style scoped>
.ai-list-container {
  margin-top: 40px;
  margin-left: 32px;
  margin-right: 32px;
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

h2 {
  color: #1a1a1a;
  font-weight: 600;
  margin-bottom: 8px;
}

.ai-list-table {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  overflow: hidden;
}

.ai-list-header,
.ai-list-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 120px 80px 3fr;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
}

.action-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* 按鈕樣式優化 */
.action-btns :deep(.v-btn) {
  font-weight: 500;
  letter-spacing: 0.3px;
  transition: all 0.2s ease;
}

.action-btns :deep(.v-btn:hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.ai-list-header {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: #fff;
  font-weight: 600;
  letter-spacing: 0.5px;
  font-size: 14px;
}

.ai-list-row {
  background: #fff;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.25s ease;
  font-weight: 500;
}

.ai-list-row:last-child {
  border-bottom: none;
}

.ai-list-row:hover {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #1a1a1a;
}

/* Switch 樣式 */
:deep(.v-switch) {
  transform: scale(0.9);
}

/* Enable/Disable switch 容器 */
.enable-switch-container {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.switch-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  padding: 4px;
}

/* 版本選擇器樣式 */
.version-select {
  max-width: 100px;
}

.version-select :deep(.v-field) {
  font-size: 13px;
}

.version-select :deep(.v-field__input) {
  padding: 4px 8px;
  min-height: 32px;
}

/* 載入/錯誤/空狀態 */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  margin-top: 16px;
  color: #666;
}

.error-state {
  color: #d32f2f;
}

/* 新增模型按鈕區塊 */
.ai-list-container > div:last-of-type {
  margin-top: 24px;
}

.ai-list-container > div:last-of-type :deep(.v-btn) {
  font-weight: 600;
  padding: 0 24px;
}

/* 新增模型 Modal 樣式 */
.metric-item {
  margin-top: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.metric-item:last-child {
  border-bottom: none;
}

.metric-fields {
  margin-left: 32px;
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  max-width: 600px;
}

.metric-fields :deep(.v-text-field) {
  margin-bottom: 0;
}

/* Pretrain Result 樣式 */
.pretrain-result-header {
  background: linear-gradient(135deg, #c7c7c7 0%, #e0e0e0 100%);
  color: #1a1a1a;
  font-weight: 600;
}

.pretrain-metrics-summary {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.metric-card {
  background: #fff;
  border-radius: 6px;
  padding: 12px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.metric-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
}

.placeholder-notice {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 12px;
  color: #888;
}

.pretrain-chart-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  color: #999;
}

.chart-placeholder-text {
  font-size: 16px;
  margin-top: 8px;
  color: #666;
}

.chart-placeholder-subtext {
  font-size: 12px;
  margin-top: 4px;
  color: #aaa;
}
</style>