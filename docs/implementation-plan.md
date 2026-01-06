# 實作計畫 (Implementation Plan)

> 日期：2026-01-06
> 基於 Explore 階段分析報告，規劃 Small CLs 實作步驟

---

## 一、總覽

### 目標
將 @legacy/ 的三大功能區塊優點導入 @new/：
1. Login UI - 即時驗證（帳號/信箱存在性檢查）
2. AI Models Actions - 新增 Pretrain, Preview, Enable, Retrain, Update 按鈕
3. Performance - Grafana iframe 嵌入

### 原則聲明

**避免過度生成：**
- 只新增必要的 UI 元件，不預先建立未使用的抽象層
- placeholder handler 直接寫在頁面內，不額外建立 service layer
- 按鈕狀態管理用 ref，不過度使用 Pinia

**避免過早抽象：**
- 重複程式碼出現 3 次以上才考慮抽取
- 不建立通用 Modal 元件，每個功能獨立處理
- 不建立 useModelAction composable，直接在元件內處理

---

## 二、Small CLs 任務清單

### CL-1: AI Models - 新增 Update 按鈕

**目的：** 讓使用者可以更新模型資訊（名稱等）

**修改檔案：**
- `/new/new-frontend/pages/ai-models.vue`

**實作內容：**
1. 在操作欄新增「編輯」按鈕
2. 新增 Update Modal（v-dialog）
3. 使用現有 API：`$apiClient.primitiveAiModel.primitiveAiModelsUpdate()`
4. 狀態管理：editDialog, editingModel, isUpdating

**測試策略：**
- 手動測試：點擊編輯 → Modal 開啟 → 修改名稱 → 儲存 → 列表更新
- 驗證 Snackbar 反饋（成功/失敗）

**驗收條件：**
- [ ] 編輯按鈕正確顯示
- [ ] Modal 可開啟/關閉
- [ ] 更新成功後列表自動刷新
- [ ] 錯誤時顯示 Snackbar

**回滾方式：**
```bash
git revert <commit-hash>
```

---

### CL-2: AI Models - 新增 Enable/Disable 功能

**目的：** 讓使用者可以啟用/停用 AI 模型

**修改檔案：**
- `/new/new-frontend/pages/ai-models.vue`

**實作內容：**
1. 在操作欄新增 v-switch 開關
2. 檢查後端是否有 `enabled` 欄位：
   - 若有：使用 PUT 更新
   - 若無：placeholder handler

**Placeholder 規範（若無後端支援）：**
```typescript
async function handleToggleEnable(modelId: number, currentState: boolean) {
  // TODO: 後端需新增 PATCH /primitive_ai_models/{id}/enable
  // 預期請求：{ enabled: boolean }
  // 預期回應：{ model_id, enabled }
  snackbar.value = {
    show: true,
    text: '啟用/停用功能尚未接上後端',
    color: 'warning'
  }
  console.warn('[TODO] Enable API not implemented', { modelId, currentState })
}
```

**測試策略：**
- 若有 API：驗證狀態切換後列表反映正確狀態
- 若 placeholder：驗證 Snackbar 顯示警告訊息

**驗收條件：**
- [ ] Switch 元件正確顯示
- [ ] 點擊後狀態改變（或顯示 placeholder 訊息）
- [ ] 操作有 loading 狀態

**回滾方式：**
```bash
git revert <commit-hash>
```

---

### CL-3: AI Models - 新增 Pretrain 按鈕 (Placeholder)

**目的：** 預留 Pretrain 功能入口

**修改檔案：**
- `/new/new-frontend/pages/ai-models.vue`

**實作內容：**
1. 新增「Pretrain」按鈕
2. 按鈕點擊觸發 placeholder handler
3. 顯示 Snackbar 警告「功能尚未接上」

**Placeholder 規範：**
```typescript
async function handlePretrain(modelId: number) {
  // TODO: 後端需新增 POST /primitive_ai_models/{id}/pretrain
  // 預期請求：{ config?: PretrainConfig }
  // 預期回應：{ job_id, status: 'queued' }
  snackbar.value = {
    show: true,
    text: 'Pretrain 功能尚未接上後端',
    color: 'warning'
  }
  console.warn('[TODO] Pretrain API not implemented', { modelId })
}
```

**測試策略：**
- 點擊按鈕 → Snackbar 顯示警告
- Console 輸出 TODO 訊息

**驗收條件：**
- [ ] 按鈕正確顯示於操作欄
- [ ] 點擊後顯示 placeholder Snackbar
- [ ] Console 有 TODO 記錄

**回滾方式：**
```bash
git revert <commit-hash>
```

---

### CL-4: AI Models - 新增 Preview 按鈕 (Placeholder)

**目的：** 預留 Preview 功能入口

**修改檔案：**
- `/new/new-frontend/pages/ai-models.vue`

**實作內容：**
1. 新增「預覽」按鈕
2. 按鈕點擊觸發 placeholder handler

**Placeholder 規範：**
```typescript
async function handlePreview(modelId: number) {
  // TODO: 後端需新增 GET /primitive_ai_models/{id}/preview
  // 預期回應：{ preview_data, metrics_summary }
  snackbar.value = {
    show: true,
    text: 'Preview 功能尚未接上後端',
    color: 'warning'
  }
  console.warn('[TODO] Preview API not implemented', { modelId })
}
```

**測試策略：**
- 點擊按鈕 → Snackbar 顯示警告

**驗收條件：**
- [ ] 按鈕正確顯示
- [ ] 點擊後顯示 placeholder Snackbar

**回滾方式：**
```bash
git revert <commit-hash>
```

---

### CL-5: AI Models - 新增 Retrain 按鈕 (Placeholder)

**目的：** 預留 Retrain 功能入口

**修改檔案：**
- `/new/new-frontend/pages/ai-models.vue`

**實作內容：**
1. 新增「Retrain」按鈕
2. 新增 Retrain Modal（參考 @legacy/ 的 Config + Performance 顯示）
3. 按鈕點擊開啟 Modal，確認後觸發 placeholder handler

**Placeholder 規範：**
```typescript
async function handleRetrain(modelId: number, config: RetrainConfig) {
  // TODO: 後端需新增 POST /primitive_ai_models/{id}/retrain
  // 預期請求：{ round: number, epochs: number }
  // 預期回應：{ job_id, status: 'queued' }
  snackbar.value = {
    show: true,
    text: 'Retrain 功能尚未接上後端',
    color: 'warning'
  }
  console.warn('[TODO] Retrain API not implemented', { modelId, config })
}

// 資料契約（預期格式，不可假造 URL）
interface RetrainConfig {
  round: number    // Central exchange round
  epochs: number   // Local training epoch
}
```

**測試策略：**
- 點擊 Retrain → Modal 開啟
- 填寫參數 → 點擊確認 → Snackbar 警告
- Modal 可正常關閉

**驗收條件：**
- [ ] 按鈕正確顯示
- [ ] Modal 可開啟/關閉
- [ ] 參數輸入欄位正常運作
- [ ] 確認後顯示 placeholder Snackbar

**回滾方式：**
```bash
git revert <commit-hash>
```

---

### CL-6: AI Models - 按鈕狀態管理

**目的：** 為所有操作按鈕新增 loading 狀態與 disabled 條件

**修改檔案：**
- `/new/new-frontend/pages/ai-models.vue`

**實作內容：**
1. 新增 `actionLoading` ref 追蹤各操作狀態
2. 按鈕在操作中顯示 loading spinner
3. 操作中 disable 其他按鈕防止重複觸發

**狀態設計：**
```typescript
const actionLoading = ref<{
  update: number | null,    // 正在更新的 model_id
  enable: number | null,    // 正在切換的 model_id
  pretrain: number | null,
  preview: number | null,
  retrain: number | null,
  delete: number | null,
}>({
  update: null,
  enable: null,
  pretrain: null,
  preview: null,
  retrain: null,
  delete: null,
})
```

**測試策略：**
- 觸發操作 → 按鈕顯示 loading
- 操作完成 → loading 消失
- 操作中其他同模型按鈕 disabled

**驗收條件：**
- [ ] 操作中按鈕顯示 loading
- [ ] 操作完成恢復正常
- [ ] 不會重複觸發

**回滾方式：**
```bash
git revert <commit-hash>
```

---

### CL-7: AI Models - Delete 二次確認優化

**目的：** 確認現有 Delete 流程符合規範（二次確認）

**修改檔案：**
- `/new/new-frontend/pages/ai-models.vue`（若需調整）

**實作內容：**
1. 檢查現有 confirmDeleteDialog 邏輯
2. 確保 Delete 按鈕有明確的 loading 狀態
3. 確保確認對話框清楚顯示要刪除的模型名稱

**測試策略：**
- 點擊刪除 → 確認對話框開啟
- 顯示模型名稱
- 確認後 loading → 成功/失敗反饋

**驗收條件：**
- [ ] 確認對話框顯示模型名稱
- [ ] 有 loading 狀態
- [ ] 成功/失敗 Snackbar

**回滾方式：**
```bash
git revert <commit-hash>
```

---

### CL-8: Performance - 新增 Grafana 頁面 (NES)

**目的：** 嵌入 NES Grafana 儀表板

**修改檔案：**
- 新增 `/new/new-frontend/pages/performance/nes.vue`

**實作內容：**
```vue
<template>
  <div class="performance-container">
    <h2>Performance - NES</h2>
    <iframe
      :src="grafanaUrl"
      frameborder="0"
      class="grafana-iframe"
    />
  </div>
</template>

<script setup lang="ts">
// TODO: 將 Grafana URL 移至環境變數或設定檔
const grafanaUrl = 'http://140.113.144.121:2982/d/adkys2aoyeqkgf/nes'
</script>

<style scoped>
.performance-container {
  padding: 24px;
}
.grafana-iframe {
  width: 100%;
  height: 900px;
  border: none;
  border-radius: 8px;
}
</style>
```

**測試策略：**
- 訪問 /performance/nes → iframe 正確載入
- Grafana 儀表板顯示正常

**驗收條件：**
- [ ] 頁面可正常訪問
- [ ] iframe 正確嵌入
- [ ] 響應式高度正常

**回滾方式：**
```bash
git revert <commit-hash>
```

---

### CL-9: Performance - 新增 Grafana 頁面 (MRO)

**目的：** 嵌入 MRO Grafana 儀表板

**修改檔案：**
- 新增 `/new/new-frontend/pages/performance/mro.vue`

**實作內容：**
與 CL-8 類似，URL 為 `http://140.113.144.121:2982/d/bdl9s0tm6mebkf/mro`

**測試策略：**
- 訪問 /performance/mro → iframe 正確載入

**驗收條件：**
- [ ] 頁面可正常訪問
- [ ] iframe 正確嵌入

**回滾方式：**
```bash
git revert <commit-hash>
```

---

### CL-10: Login - 即時帳號存在性檢查

**目的：** 註冊時即時檢查帳號是否已存在

**修改檔案：**
- `/new/new-frontend/pages/register.vue`

**前置條件：**
先檢查 Api.ts 是否有帳號檢查 API

**實作內容（若有 API）：**
1. 新增 accountStatus ref
2. 帳號輸入 debounce 300ms 後發送檢查請求
3. 顯示 is-valid / is-invalid 狀態

**實作內容（若無 API - Placeholder）：**
```typescript
async function checkAccountExists(account: string) {
  // TODO: 後端需新增 GET /auth/check-account?account={account}
  // 預期回應：{ exists: boolean }
  console.warn('[TODO] Account check API not implemented', { account })
  return { exists: false } // 暫時假設可用
}
```

**測試策略：**
- 輸入帳號 → 300ms 後觸發檢查
- 若已存在顯示錯誤提示
- 若 placeholder 則 console 輸出 TODO

**驗收條件：**
- [ ] debounce 正常運作
- [ ] 狀態反饋正確
- [ ] 不影響表單提交邏輯

**回滾方式：**
```bash
git revert <commit-hash>
```

---

### CL-11: Login - 即時信箱存在性檢查

**目的：** 註冊時即時檢查信箱是否已存在

**修改檔案：**
- `/new/new-frontend/pages/register.vue`

**實作內容：**
與 CL-10 類似，檢查 email 欄位

**Placeholder 規範：**
```typescript
async function checkEmailExists(email: string) {
  // TODO: 後端需新增 GET /auth/check-email?email={email}
  // 預期回應：{ exists: boolean }
  console.warn('[TODO] Email check API not implemented', { email })
  return { exists: false }
}
```

**驗收條件：**
- [ ] debounce 正常運作
- [ ] 狀態反饋正確

**回滾方式：**
```bash
git revert <commit-hash>
```

---

## 三、執行順序

```
Phase 1: AI Models 核心功能
├── CL-1: Update 按鈕（有 API）
├── CL-7: Delete 優化
└── CL-6: 狀態管理

Phase 2: AI Models Placeholder
├── CL-2: Enable/Disable
├── CL-3: Pretrain
├── CL-4: Preview
└── CL-5: Retrain

Phase 3: Performance
├── CL-8: NES Grafana
└── CL-9: MRO Grafana

Phase 4: Login Enhancement
├── CL-10: 帳號檢查
└── CL-11: 信箱檢查
```

---

## 四、測試覆蓋總結

根據 CLAUDE.md 要求，每個 CL 需覆蓋：

| 測試項目 | 覆蓋 CL |
|---------|--------|
| 按鈕可用/不可用狀態（disabled 條件）| CL-1 ~ CL-7 |
| 點擊後狀態轉移（loading → success/error）| CL-1 ~ CL-7 |
| Delete confirm 流程 | CL-7 |
| Placeholder 警告顯示 | CL-2 ~ CL-5, CL-10, CL-11 |

---

## 五、風險與緩解

| 風險 | 緩解措施 |
|------|---------|
| 後端 API 不存在 | 使用 placeholder handler + TODO 註記 |
| Grafana 網路不通 | iframe 加 loading fallback |
| API 規格變更 | placeholder 預留資料契約，但不假造 URL |

---

## 六、Commit 規範

每個 CL 獨立 commit，格式：
```
feat(ai-models): add Update button and modal

- Add edit button to action column
- Implement update modal with v-dialog
- Use existing PUT API endpoint
- Add snackbar feedback
```

**禁止：**
- emoji
- 混合多個功能
- push 到 remote
