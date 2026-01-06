<template>
  <div class="ai-list-container">
    <h2>Primitive AI 模型列表</h2>
    <div class="ai-list-table">
      <div class="ai-list-header">
        <div>模型名稱</div>
        <div>模型 ID</div>
        <div>指標數量</div>
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
          <v-switch
            :model-value="ai.enabled ?? false"
            hide-details
            density="compact"
            color="success"
            @update:model-value="handleToggleEnable(ai, $event)"
          />
        </div>
        <div class="action-btns" @click.stop>
          <v-btn color="primary" size="small" @click="showAIDetail(ai)">詳細</v-btn>
          <v-btn color="warning" size="small" @click="openEditDialog(ai)">編輯</v-btn>
          <v-btn color="info" size="small" @click="handlePreview(ai)">預覽</v-btn>
          <v-btn color="secondary" size="small" @click="handlePretrain(ai)">Pretrain</v-btn>
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
        <v-card-subtitle v-if="retrainTarget">
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

    <!-- 新增模型按鈕 -->
    <div style="margin-top:32px; text-align:right;">
      <v-btn color="success" @click="addDialog = true">新增模型</v-btn>
    </div>

    <!-- 新增模型 Modal -->
    <v-dialog v-model="addDialog" max-width="1000">
      <v-card>
        <v-card-title>新增 Primitive AI 模型</v-card-title>
        <v-card-text>
          <v-text-field v-model="newAI.model_name" label="模型名稱" required style="margin-bottom:16px;" />
          <div v-for="metric in allMetrics" :key="metric.abstract_metrics_id" style="margin-top:24px;">
            <v-checkbox
              v-model="metric.selected"
              :label="metric.display_name"
            />
            <div v-if="metric.selected" style="margin-left:24px;">
              <v-text-field v-model="metric.input.name" label="名稱" style="display:block;max-width:400px;margin-bottom:12px;" />
              <v-text-field v-model="metric.input.description" label="描述" style="display:block;max-width:400px;margin-bottom:12px;" />
              <v-text-field v-model="metric.input.type" label="類型" style="display:block;max-width:400px;margin-bottom:12px;" />
              <v-text-field v-model="metric.input.interval" label="間隔" type="number" style="display:block;max-width:400px;margin-bottom:12px;" />
              <v-text-field v-model="metric.input.operator" label="Operator" style="display:block;max-width:400px;margin-bottom:12px;" />
              <v-text-field v-model="metric.input.unit" label="單位" style="display:block;max-width:400px;margin-bottom:12px;" />
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

  onMounted(async () => {
    await fetchAIs()
    await fetchAllMetrics()
  })

  async function fetchAIs () {
    const res = await $apiClient.primitiveAiModel.primitiveAiModelsList()
    // aiList.value = res.data
    aiList.value = res.data.sort((a, b) => a.model_id - b.model_id)
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

  // Enable/Disable 切換 (placeholder)
  function handleToggleEnable(ai, newState) {
    // TODO: 後端需新增 PATCH /primitive_ai_models/{id}/enable
    // 預期請求：{ enabled: boolean }
    // 預期回應：{ model_id, enabled }
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
  }

  // Preview (placeholder)
  function handlePreview(ai) {
    // TODO: 後端需新增 GET /primitive_ai_models/{id}/preview
    // 預期回應：{ preview_data, metrics_summary }
    snackbar.value = {
      show: true,
      text: 'Preview 功能尚未接上後端',
      color: 'warning'
    }
    console.warn('[TODO] Preview API not implemented', {
      modelId: ai.model_id,
      modelName: ai.model_name
    })
  }

  // Pretrain (placeholder)
  function handlePretrain(ai) {
    // TODO: 後端需新增 POST /primitive_ai_models/{id}/pretrain
    // 預期請求：{ config?: PretrainConfig }
    // 預期回應：{ job_id, status: 'queued' }
    snackbar.value = {
      show: true,
      text: 'Pretrain 功能尚未接上後端',
      color: 'warning'
    }
    console.warn('[TODO] Pretrain API not implemented', {
      modelId: ai.model_id,
      modelName: ai.model_name
    })
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
}
.ai-list-table {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
}
.ai-list-header,
.ai-list-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 80px 3fr;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
}
.action-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.ai-list-header {
  background: #000000;
  color: #fff;
  font-weight: bold;
  border-radius: 12px 12px 0 0;
  letter-spacing: 1px;
}
.ai-list-row {
  background: #fff;
  color: #333;
  border-bottom: 1px solid #e0e0e0;
  transition: background 0.2s;
  font-weight: bold;
}
.ai-list-row:last-child {
  border-radius: 0 0 12px 12px;
}
.ai-list-row:hover {
  background: #333;
  color: #fff;
}
</style>