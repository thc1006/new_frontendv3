<template>
  <div class="ai-list-container">
    <h2>Primitive AI 模型列表</h2>
    <div class="ai-list-table">
      <div class="ai-list-header">
        <div>模型名稱</div>
        <div>模型 ID</div>
        <div>指標數量</div>
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
        <div>
          <v-btn color="primary" @click.stop="showAIDetail(ai)">詳細</v-btn>
          <v-btn color="error" style="margin-left:8px;" @click.stop="openDeleteDialog(ai.model_id)">刪除</v-btn>
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
        <v-card-actions>
          <v-btn color="primary" @click="confirmDelete">確定</v-btn>
          <v-btn text @click="confirmDeleteDialog = false">取消</v-btn>
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
  const deleteTargetId = ref(null)
  const snackbar = ref({ show: false, text: '', color: 'success' })
  const addDialog = ref(false)
  const newAI = ref({ model_name: '' })
  const allMetrics = ref([])

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

  function openDeleteDialog(modelId) {
    deleteTargetId.value = modelId
    confirmDeleteDialog.value = true
  }

  async function confirmDelete() {
    confirmDeleteDialog.value = false
    try {
      await $apiClient.primitiveAiModel.primitiveAiModelsDelete(deleteTargetId.value)
      snackbar.value = { show: true, text: '刪除成功', color: 'success' }
      await fetchAIs()
    } catch (e) {
      snackbar.value = { show: true, text: '刪除失敗', color: 'error' }
      console.log(e)
    }
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
  grid-template-columns: 2fr 1fr 1fr 1fr;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
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