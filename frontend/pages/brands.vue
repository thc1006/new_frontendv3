<template>
  <div class="brand-list-container">
    <h2>RU 品牌列表</h2>
    <div class="brand-list-table">
      <div class="brand-list-header">
        <div>品牌名稱</div>
        <div>品牌 ID</div>
        <div>頻寬</div>
        <div>功率</div>
        <div>操作</div>
      </div>
      <div
        v-for="brand in brandList"
        :key="brand.brand_id"
        class="brand-list-row"
        style="cursor:pointer"
        @click="showBrandDetail(brand)"
      >
        <div>{{ brand.brand_name }}</div>
        <div>{{ brand.brand_id }}</div>
        <div>{{ brand.bandwidth }}</div>
        <div>{{ brand.tx_power }}</div>
        <div>
          <v-btn color="primary" @click.stop="showBrandDetail(brand)">詳細</v-btn>
          <v-btn color="error" style="margin-left:8px;" :disabled="brand.brand_id == null" @click.stop="openDeleteDialog(brand.brand_id!)">刪除</v-btn>
        </div>
      </div>
    </div>

    <!-- 詳細資料 Modal -->
    <v-dialog v-model="detailDialog" max-width="900">
      <v-card v-if="selectedBrand">
        <v-card-title>品牌詳細資料</v-card-title>
        <v-card-text>
          <div>品牌名稱：{{ selectedBrand.brand_name }}</div>
          <div>品牌 ID：{{ selectedBrand.brand_id }}</div>
          <div>頻寬：{{ selectedBrand.bandwidth }}</div>
          <div>功率：{{ selectedBrand.tx_power }}</div>
          <div v-if="selectedBrand.brand_metrics && selectedBrand.brand_metrics.length">
            <h4 style="margin-top:16px;">品牌指標：</h4>
            <v-table>
              <thead>
                <tr>
                  <th>名稱</th>
                  <th>描述</th>
                  <th>單位</th>
                  <th>來源</th>
                  <th>類型</th>
                  <th>間隔</th>
                  <th>Operator</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="metric in selectedBrand.brand_metrics" :key="metric.name + metric.abstract_metrics_id">
                  <td>{{ metric.name }}</td>
                  <td>{{ metric.description }}</td>
                  <td>{{ metric.unit || '-' }}</td>
                  <td>{{ metric.api_source }}</td>
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

    <!-- 新增品牌按鈕 -->
    <div style="margin-top:32px; text-align:right;">
      <v-btn color="success" @click="openAddDialog">新增品牌</v-btn>
    </div>

    <!-- 新增品牌 Modal -->
    <v-dialog v-model="addDialog" max-width="1000">
      <v-card>
        <v-card-title>新增品牌</v-card-title>
        <v-card-text>
          <v-text-field v-model="newBrand.brand_name" label="品牌名稱" required style="margin-bottom:16px;" />
          <v-text-field v-model="newBrand.bandwidth" label="頻寬" required style="margin-bottom:16px;" />
          <v-text-field v-model="newBrand.tx_power" label="功率" required style="margin-bottom:16px;" />

          <div v-for="metric in allMetrics" :key="metric.abstract_metrics_id" style="margin-top:24px;">
            <v-checkbox
              v-model="metric.selected"
              :label="metric.display_name"
            />
            <div v-if="metric.selected" style="margin-left:24px;">
              <v-text-field v-model="metric.input.name" label="名稱" style="display:block;max-width:400px;margin-bottom:12px;" />
              <v-text-field v-model="metric.input.description" label="描述" style="display:block;max-width:400px;margin-bottom:12px;" />
              <v-text-field v-model="metric.input.api_source" label="API 來源" style="display:block;max-width:400px;margin-bottom:12px;" />
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

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { createModuleLogger } from '~/utils/logger'
  import type { Brand, BrandMetrics, BrandMetricsRequest } from '~/apis/Api'

  // Local interface definitions
  interface SnackbarState {
    show: boolean
    text: string
    color: 'success' | 'error' | 'warning' | 'info'
  }

  interface MetricInput {
    name: string
    description: string
    api_source: string
    type: string
    interval: string | number
    operator: string
    unit: string
  }

  interface SelectableMetric {
    abstract_metrics_id: number
    display_name: string
    selected: boolean
    input: MetricInput
  }

  interface NewBrandForm {
    brand_name: string
    bandwidth: string
    tx_power: string
  }

  const log = createModuleLogger('Brands')
  const { $apiClient } = useNuxtApp()

  const brandList = ref<Brand[]>([])
  const detailDialog = ref<boolean>(false)
  const selectedBrand = ref<Brand | null>(null)
  const confirmDeleteDialog = ref<boolean>(false)
  const deleteTargetId = ref<number | null>(null)
  const snackbar = ref<SnackbarState>({ show: false, text: '', color: 'success' })
  const addDialog = ref<boolean>(false)
  const newBrand = ref<NewBrandForm>({ brand_name: '', bandwidth: '', tx_power: '' })
  const allMetrics = ref<SelectableMetric[]>([])

  onMounted(async () => {
    await fetchBrands()
    await fetchAllMetrics()
  })

  async function fetchBrands(): Promise<void> {
    const res = await $apiClient.brand.brandsList()
    brandList.value = res.data
  }

  // 只取 abstract metrics 的 display_name 與 id，並初始化一組 input 欄位
  async function fetchAllMetrics(): Promise<void> {
    const res = await $apiClient.abstractMetrics.abstractMetricsList()
    allMetrics.value = res.data.map(m => ({
      abstract_metrics_id: m.id ?? 0,
      display_name: m.display_name ?? '',
      selected: false,
      input: {
        name: '',
        description: '',
        api_source: '',
        type: '',
        interval: '',
        operator: '',
        unit: ''
      }
    }))
  }

  function showBrandDetail(brand: Brand): void {
    selectedBrand.value = brand
    detailDialog.value = true
  }

  function openDeleteDialog(brandId: number): void {
    if (brandId == null) return
    deleteTargetId.value = brandId
    confirmDeleteDialog.value = true
  }

  async function confirmDelete(): Promise<void> {
    confirmDeleteDialog.value = false
    if (deleteTargetId.value === null) return
    try {
      await $apiClient.brand.brandsDelete(deleteTargetId.value)
      snackbar.value = { show: true, text: '刪除成功', color: 'success' }
      await fetchBrands()
    } catch (e) {
      snackbar.value = { show: true, text: '刪除失敗', color: 'error' }
      log.error('Failed to delete brand', e)
    }
  }

  async function confirmAdd(): Promise<void> {
    if (!newBrand.value.brand_name.trim()) {
      snackbar.value = { show: true, text: '品牌名稱不可為空', color: 'error' }
      return
    }
    const bandwidth = newBrand.value.bandwidth?.toString().trim() ? Number(newBrand.value.bandwidth) : 5
    const tx_power = newBrand.value.tx_power?.toString().trim() ? Number(newBrand.value.tx_power) : 5

    // 組合 brand_metrics（只取勾選且填寫的 metrics，且不含 id）
    const selectedMetrics: BrandMetricsRequest[] = []
    allMetrics.value.forEach(metric => {
      if (metric.selected && metric.input.name.trim()) {
        selectedMetrics.push({
          abstract_metrics_id: metric.abstract_metrics_id,
          api_source: metric.input.api_source || null,
          description: metric.input.description || null,
          interval: metric.input.interval ? Number(metric.input.interval) : null,
          name: metric.input.name,
          operator: metric.input.operator || null,
          type: metric.input.type || '',
          unit: metric.input.unit || null
        })
      }
    })
    try {
      await $apiClient.brand.brandsCreate({
        brand_name: newBrand.value.brand_name,
        bandwidth,
        tx_power,
        brand_metrics: selectedMetrics
      })
      snackbar.value = { show: true, text: '新增成功', color: 'success' }
      addDialog.value = false
      newBrand.value = { brand_name: '', bandwidth: '', tx_power: '' }
      await fetchBrands()
    } catch (e) {
      snackbar.value = { show: true, text: '新增失敗', color: 'error' }
      log.error('Failed to add brand', e)
    }
  }

  // 新增：開啟新增品牌表單時，填入 metrics 預設值
  function openAddDialog(): void {
    // 先填品牌基本資料（如需）
    newBrand.value = { brand_name: '', bandwidth: '', tx_power: '' }
    // 取得第一個品牌的 metrics
    let firstMetrics: BrandMetrics[] = []
    if (brandList.value.length > 0 && Array.isArray(brandList.value[0].brand_metrics)) {
      firstMetrics = brandList.value[0].brand_metrics
    }
    // 依照 allMetrics，把第一個品牌的 metrics 填入 input
    allMetrics.value.forEach(metric => {
      // 找到同 abstract_metrics_id 的 metric
      const found = firstMetrics.find(m => m.abstract_metrics_id === metric.abstract_metrics_id)
      if (found) {
        metric.selected = true
        metric.input = {
          name: found.name ?? '',
          description: found.description ?? '',
          api_source: found.api_source ?? '',
          type: found.type ?? '',
          interval: found.interval ?? '',
          operator: found.operator ?? '',
          unit: found.unit ?? ''
        }
      } else {
        metric.selected = false
        metric.input = {
          name: '',
          description: '',
          api_source: '',
          type: '',
          interval: '',
          operator: '',
          unit: ''
        }
      }
    })
    addDialog.value = true
  }
</script>

<style scoped>
.brand-list-container {
  margin-top: 40px;
  margin-left: 32px;
  margin-right: 32px;
}
.brand-list-table {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
}
.brand-list-header,
.brand-list-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
}
.brand-list-header {
  background: #000000;
  color: #fff;
  font-weight: bold;
  border-radius: 12px 12px 0 0;
  letter-spacing: 1px;
}
.brand-list-row {
  background: #fff;
  color: #333;
  border-bottom: 1px solid #e0e0e0;
  transition: background 0.2s;
  font-weight: bold;
}
.brand-list-row:last-child {
  border-radius: 0 0 12px 12px;
}
.brand-list-row:hover {
  background: #333;
  color: #fff;
}
</style>