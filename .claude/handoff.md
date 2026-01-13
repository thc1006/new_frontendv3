# ADR-001: WiSDON 前端 UI 修復計畫與 Session 交接文件

> 建立日期：2026-01-13
> 更新日期：2026-01-13
> 狀態：Phase 1-4 已完成，Phase 5-6 待執行
> 決策者：開發團隊

---

## 1. 問題背景與目標

### 1.1 背景
本專案有兩個版本：
- `legacy/`：第一版本（舊版）
- `new/new-frontend/`：第二版本（上線中，未來主線）

設計團隊提供了權威設計規範於 `new_design/` 目錄，包含 Figma 匯出的設計稿和 Nuxt 骨架頁面。需要將設計規範與現有前端進行對齊修復。

### 1.2 目標
1. 將 `new_design/` 作為 UI 設計權威來源
2. 對齊現有前端與設計規範的差異
3. 確保 AI Models 頁面包含完整的 6 個按鈕操作
4. 維持專案的程式碼風格一致性

---

## 2. 權威設計來源分析

### 2.1 Figma 設計檔案 (`new_design/wisdON-figma-node3-407-export/`)

#### 核心頁面（Pages）
| Frame ID | 名稱 | 建議路由 | 尺寸 |
|----------|------|----------|------|
| 3:477 | Login | /auth/login | 1440x1024 |
| 3:1042 | Register | /auth/register | 1440x1024 |
| 3:491 | Profile | /profile | 1440x1024 |
| 3:713 | Projects List | /projects | 1440x1024 |
| 3:505 | Overview | /projects/:projectId/overview | 1440x1024 |
| 3:420 | Configuration/ai model | /projects/:projectId/config/ai-model | 1440x1024 |
| 3:532 | Evaluation | /projects/:projectId/evaluation | 1440x1024 |
| 3:692 | Network Performance | /projects/:projectId/performance/network | 1440x1024 |
| 3:1084 | AI Model Performance | /projects/:projectId/performance/ai-model | 1440x1024 |
| 3:1138 | Ran Slice Performance | /projects/:projectId/performance/ran-slice | 1440x1024 |
| 3:596 | Federal learning | /projects/:projectId/federated | 1440x1140 |
| 3:616 | gNB | /projects/:projectId/gnb | 1440x1024 |
| 3:517 | Scenario#驗測 | /projects/:projectId/scenario | 1440x1024 |
| 3:570 | Simulation | /projects/:projectId/simulation | 1440x1140 |
| 3:1014 | AI assistant | /assistant | 1273x738 |

#### AI Model 相關 Modal 對話框
| Frame ID | 名稱 | 用途 |
|----------|------|------|
| 3:408 | Pretrain | 預訓練設定對話框 (900x806) |
| 3:1124 | Pretrain after upload | 上傳後預訓練提示 |
| 3:1126 | retrain | 重新訓練對話框 (537x666) |
| 3:414 | Disable | 停用確認對話框 |
| 3:1105 | Enable | 啟用確認對話框 |
| 3:1111 | Model Update | 模型更新確認對話框 |
| 3:1159 | pretrain_notice | 預訓練提示訊息 |
| 3:921 | already_pretrain_notice | 已預訓練提示 |
| 3:917 | latest_version_notice | 最新版本提示 |
| 3:975 | Successfully Retrain | 重新訓練成功提示 |

### 2.2 Nuxt Admin Pages 設計 (`new_design/wisdON-nuxt-admin-pages/`)

#### ModelListItem 組件設計（關鍵參考）
```vue
<!-- 設計規範的按鈕配置 -->
<div class="flex gap-3">
  <button class="rounded-lg bg-green-200 px-4 py-2 text-lg">Pre-train</button>
  <button class="rounded-lg bg-gray-200 px-4 py-2 text-lg">Re-train</button>
  <button class="rounded-lg bg-blue-200 px-4 py-2 text-lg">Preview</button>
</div>
```

#### 功能元素
- Enable/Disable switch（切換開關）
- Version selector（版本選擇器）
- Pre-train / Re-train / Preview 按鈕

---

## 3. 現有前端實作狀態

### 3.1 技術棧
- **框架**：Nuxt 3.17.5 + Vue 3
- **UI 庫**：Vuetify 3.8.12
- **狀態管理**：Pinia 3.0.3
- **資料獲取**：TanStack Vue Query 5.81.5
- **測試**：Playwright 1.57.0

### 3.2 已完成功能

#### Login UI (100%)
- 路徑：`new/new-frontend/pages/login.vue`
- 測試：`tests/e2e/login.spec.ts` (4 個測試)

#### AI Models 頁面 (Phase 1 完成)
- 路徑：`new/new-frontend/pages/ai-models.vue`
- 按鈕狀態：

| 按鈕 | 前端 UI | 後端 API | 狀態 |
|------|:-------:|:--------:|------|
| 詳細 | ✅ | ✅ | 完成 |
| 編輯 | ✅ | ✅ | 完成（PATCH） |
| Preview | ✅ | ❌ | Placeholder (含預覽模態視窗) |
| Pretrain | ✅ | ❌ | Placeholder (含結果模態視窗) |
| Retrain | ✅ | ❌ | Placeholder（有完整對話框） |
| Enable/Disable | ✅ | ❌ | Placeholder |
| Delete | ✅ | ✅ | 完成（有二次確認） |
| 版本選擇器 | ✅ | ✅ | 完成 |

- 測試：`tests/e2e/ai-models.spec.ts` (32 個測試)

#### Performance 頁面 (Phase 2 完成)
- NES：`pages/projects/[projectId]/performance/nes.vue`
- MRO：`pages/projects/[projectId]/performance/mro.vue`
- AI Model：`pages/projects/[projectId]/performance/ai-model.vue` ✅ 新增
- RAN Slice：`pages/projects/[projectId]/performance/ran-slice.vue` ✅ 新增
- Grafana URL 已環境變數化
- 測試：`tests/e2e/performance.spec.ts` (10 個測試)

#### Profile 頁面 (Phase 3 完成)
- 路徑：`new/new-frontend/pages/profile.vue`
- 顯示用戶資訊：帳號、電子郵件、角色、建立日期
- 修改密碼功能：含驗證（密碼長度、密碼一致性）
- 測試：`tests/e2e/profile.spec.ts` (9 個測試)

#### 導航選單 (Phase 4 完成)
- 路徑：`new/new-frontend/layouts/default.vue`
- Performance 子選單新增：AI Model Performance、RAN Slice Performance
- 測試：`tests/e2e/navigation.spec.ts` (9 個測試)

### 3.3 待後端實作的 API
```
PATCH /primitive_ai_models/{id}/enable   → 啟用/停用模型
GET   /primitive_ai_models/{id}/preview  → 預覽模型
POST  /primitive_ai_models/{id}/pretrain → 預訓練
POST  /primitive_ai_models/{id}/retrain  → 重新訓練
```

---

## 4. 差異分析：設計 vs 現有實作

### 4.1 路由結構差異

| 設計規範路由 | 現有實作路由 | 差異說明 |
|--------------|--------------|----------|
| /auth/login | /login | 路由前綴不同（可接受） |
| /auth/register | /register | 路由前綴不同（可接受） |
| /projects/:projectId/config/ai-model | /ai-models | 現有為全域頁面，設計為專案內頁面 |
| /projects/:projectId/performance/network | /projects/[id]/performance/nes | 名稱不同 |
| /projects/:projectId/performance/ai-model | ❌ 不存在 | 需新增 |
| /projects/:projectId/performance/ran-slice | ❌ 不存在 | 需新增 |
| /projects/:projectId/federated | ❌ 不存在 | 需新增 |
| /projects/:projectId/simulation | ❌ 不存在 | 需新增 |
| /projects/:projectId/scenario | ❌ 不存在 | 需新增（有 placeholder） |
| /assistant | ✅ 有 ChatInterface 組件 | 需要獨立頁面 |

### 4.2 AI Models UI 差異

| 設計規範 | 現有實作 | 優先級 |
|----------|----------|--------|
| 6 個按鈕（Pretrain, Preview, Enable, Retrain, Update, Delete） | 已實作 6 個（含 placeholder） | ✅ 結構對齊 |
| Version selector（版本選擇器） | ❌ 不存在 | 🔴 高 |
| Pre-train Result 頁面 | ❌ 不存在 | 🟡 中 |
| Re-train Result 頁面 | ❌ 不存在 | 🟡 中 |
| Preview 頁面 | ❌ 不存在 | 🟡 中 |

### 4.3 缺失功能

| 功能 | 設計規範來源 | 優先級 |
|------|--------------|--------|
| Profile 頁面（修改密碼） | 3:491, 3:996 | 🔴 高 |
| Federal Learning | 3:596, 3:604 | 🟡 中 |
| Simulation | 3:570, 3:582 | 🟡 中 |
| AI Model Performance | 3:1084 | 🟡 中 |
| Ran Slice Performance | 3:1138 | 🟡 中 |
| Scenario 驗測 | 3:517 | 🟢 低 |

---

## 5. 修復計畫（依 Small CLs 拆分）

### 5.1 原則聲明

#### TDD Rule
- 每個任務先寫測試（或驗收機制）
- 確認測試 fail
- 寫最少量實作讓測試 pass
- 必要時才 refactor

#### Boy Scout Rule
- 每次改動順手清理同檔案內的小問題
- 不得把重構擴散成大改

#### Small CLs
- 每個 commit 只做一件事
- 可獨立驗證
- 保持 build 綠燈

#### 反模式提醒
> ⚠️ **禁止過度生成**：不要生成超出需求的程式碼
> ⚠️ **禁止過早抽象**：沒有重複使用點就不要抽介面
> ⚠️ **禁止臆測 API**：無後端支援的功能使用 placeholder

---

### 5.2 修復任務清單

#### Phase 1：AI Models 頁面強化（高優先）

**任務 1.1：新增版本選擇器**
- 目的：對齊設計規範的 Version selector
- 修改檔案：`pages/ai-models.vue`
- 測試策略：E2E 測試版本選擇 UI
- 驗收條件：版本下拉選單可正常運作（placeholder 資料）
- 回滾方式：git revert

**任務 1.2：完善 Pretrain 對話框**
- 目的：對齊 Figma 3:408 的設計
- 修改檔案：`pages/ai-models.vue`
- 測試策略：E2E 測試對話框開啟/關閉/表單驗證
- 驗收條件：對話框符合設計規範尺寸和欄位
- 回滾方式：git revert

**任務 1.3：新增 Pre-train Result 模態視窗**
- 目的：顯示預訓練結果（對齊 admin/pretrain.vue）
- 修改檔案：`pages/ai-models.vue` 或新增組件
- 測試策略：E2E 測試結果顯示
- 驗收條件：結果視窗正確顯示 placeholder 資料
- Placeholder：`// TODO: 待接入 GET /primitive_ai_models/{id}/pretrain/result`

**任務 1.4：新增 Preview 模態視窗**
- 目的：顯示模型預覽（對齊 admin/preview.vue）
- 修改檔案：`pages/ai-models.vue`
- 測試策略：E2E 測試預覽顯示
- 驗收條件：預覽視窗正確顯示 placeholder 資料
- Placeholder：`// TODO: 待接入 GET /primitive_ai_models/{id}/preview`

---

#### Phase 2：Performance 頁面擴充（中優先）

**任務 2.1：新增 AI Model Performance 頁面**
- 目的：對齊設計規範 3:1084
- 新增檔案：`pages/projects/[projectId]/performance/ai-model.vue`
- 測試策略：E2E 測試頁面載入和 Grafana iframe
- 驗收條件：頁面結構與 NES/MRO 一致
- 環境變數：`NUXT_PUBLIC_GRAFANA_AI_MODEL_URL`

**任務 2.2：新增 Ran Slice Performance 頁面**
- 目的：對齊設計規範 3:1138
- 新增檔案：`pages/projects/[projectId]/performance/ran-slice.vue`
- 測試策略：E2E 測試頁面載入
- 驗收條件：頁面結構與 NES/MRO 一致
- 環境變數：`NUXT_PUBLIC_GRAFANA_RAN_SLICE_URL`

---

#### Phase 3：Profile 功能啟用（中優先）

**任務 3.1：啟用 Profile 頁面**
- 目的：對齊設計規範 3:491
- 修改檔案：`pages/profile.vue`、`layouts/default.vue`
- 測試策略：E2E 測試頁面導航和顯示
- 驗收條件：側邊選單可導航至 Profile

**任務 3.2：新增修改密碼功能**
- 目的：對齊設計規範 3:996
- 修改檔案：`pages/profile.vue`
- 測試策略：E2E 測試修改密碼對話框
- 驗收條件：對話框可開啟/關閉，表單驗證正常
- Placeholder：`// TODO: 待接入 PATCH /user/password`

---

#### Phase 4：導航選單對齊（已完成）

**任務 4.1：更新側邊選單結構** ✅
- 目的：對齊設計規範的選單架構（3:844）
- 修改檔案：`layouts/default.vue`
- 測試策略：E2E 測試選單項目和導航
- 驗收條件：選單結構符合設計規範
- **狀態**：已完成 (PR #3)

---

#### Phase 5：AI Model Evaluation 頁面（全新功能）

> 這是一個**全新的頁面**，在 Figma 設計中出現但 `new/` 完全沒有實作。

**設計來源**: `new_design/wisdON-nuxt-admin-pages/pages/admin/ai-model-evaluation.vue`

**頁面結構**:
```
┌─────────────────────────────────────────────────────────────┐
│ 頁首 (與現有頁面一致)                                          │
├─────────────────────────────────────────────────────────────┤
│ AI Model Evaluation (頁面標題)                               │
├───────────────────┬─────────────────────────────────────────┤
│ Model list        │ Model Inference                         │
│ ───────────       │ ─────────────────                       │
│ [Switch] NES      │                                          │
│                   │  (視覺化推斷結果區域)                      │
│ [Switch] Positioning                                         │
│                   │  顯示地圖上的模型推斷結果                   │
│                   │                                          │
├───────────────────┴─────────────────────────────────────────┤
│ (408px 寬)        │ (916px 寬)                               │
└─────────────────────────────────────────────────────────────┘
```

**任務 5.1：建立頁面骨架與路由**
- 目的：建立 AI Model Evaluation 頁面的基本結構
- 檔案：
  - 新增 `new/new-frontend/pages/projects/[projectId]/ai-model-evaluation.vue`
  - 修改 `new/new-frontend/layouts/default.vue` (新增選單項目)
- 測試策略：頁面可訪問、標題顯示正確
- 驗收條件：瀏覽 `/projects/:id/ai-model-evaluation` 顯示頁面骨架
- 回滾方式：刪除新檔案、還原選單修改

**任務 5.2：實作 Model list 側邊欄**
- 目的：左側 Model list 面板含切換開關
- 檔案：修改 `ai-model-evaluation.vue`
- UI 元素：
  - 標題列 (灰底 #c7c7c7)
  - NES toggle (v-switch)
  - Positioning toggle (v-switch)
- 測試策略：切換開關可點擊、狀態正確切換
- 驗收條件：兩個開關可獨立切換 on/off

**任務 5.3：實作 Model Inference 面板**
- 目的：右側視覺化區域
- 檔案：修改 `ai-model-evaluation.vue`
- UI 元素：
  - 標題列 (灰底)
  - 視覺化容器 (先放 placeholder 圖片或空白區域)
- 測試策略：面板可見、標題顯示正確
- 驗收條件：右側面板顯示 "Model Inference" 標題

**任務 5.4：實作切換連動邏輯 (Placeholder)**
- 目的：開關切換時觸發視覺化更新
- 檔案：修改 `ai-model-evaluation.vue`
- 邏輯：
  - 開關狀態變更 → 呼叫 placeholder handler
  - handler 顯示 "尚未接上後端" snackbar
  - 記錄 TODO 待後端 API 完成
- 測試策略：切換時有視覺回饋
- 驗收條件：placeholder 訊息正確顯示

**Placeholder API (待後端實作)**:
```
GET /projects/{projectId}/ai-model-evaluation/inference
  Query params:
    - model_type: "NES" | "Positioning"
    - enabled: boolean
  Response:
    - inference_data: object (待定義)
    - visualization_url: string (可選)
```

**TDD 測試案例** (`tests/e2e/ai-model-evaluation.spec.ts`):
```
1. 頁面基本載入
   - should navigate to AI Model Evaluation page
   - should display page title "AI Model Evaluation"

2. Model list 側邊欄
   - should display Model list panel
   - should have NES toggle switch
   - should have Positioning toggle switch
   - should toggle NES switch on/off
   - should toggle Positioning switch on/off

3. Model Inference 面板
   - should display Model Inference panel
   - should show visualization area

4. 切換開關與視覺化連動
   - should update visualization when NES is toggled (placeholder)
   - should update visualization when Positioning is toggled (placeholder)
```

---

#### Phase 6：Projects List 頁面改進

**設計來源**: `new_design/wisdON-nuxt-admin-pages/pages/admin/projects-list.vue`

**目前實作**: `new/new-frontend/pages/index.vue`
- 簡單的專案卡片列表
- 無 INDOOR/OUTDOOR 分類
- 無地圖背景
- 卡片樣式與設計不同

**Figma 設計特點**:
1. **地圖背景**：左側顯示 803x821px 圓角地圖圖片
2. **INDOOR/OUTDOOR 分類**：專案按類別分組顯示
3. **卡片樣式升級**：
   - 日期標籤 (藍色藥丸形狀)
   - 用戶標籤 (灰色藥丸形狀)
   - View Project / Delete Project 連結
4. **建立按鈕**：藍底白字 "+ CREATE NEW PROJECT"

**任務 6.1：新增專案分類標籤**
- 目的：顯示 OUTDOOR/INDOOR 分類標籤
- 檔案：修改 `new/new-frontend/pages/index.vue`
- UI 元素：
  - OUTDOOR 標籤 (圓角藥丸, 深灰底 rgba(55,54,72,0.48))
  - INDOOR 標籤 (同上)
- 測試策略：標籤可見
- 驗收條件：頁面顯示兩個分類標籤
- 注意：分類資料可能需要後端 API 支援，若無則顯示全部專案不分類

**任務 6.2：升級專案卡片樣式**
- 目的：對齊 Figma 設計的卡片外觀
- 檔案：修改 `new/new-frontend/pages/index.vue`
- 樣式變更：
  - 圓角 10px
  - 日期標籤 (藍色藥丸 #006ab5)
  - 用戶標籤 (灰色藥丸 rgba(0,0,0,0.15))
  - View Project 連結 (藍字)
  - Delete Project 連結 (紅字 #b50003)
- 測試策略：視覺樣式正確
- 驗收條件：卡片樣式與 Figma 設計一致

**任務 6.3：新增地圖背景 (可選)**
- 目的：左側顯示地圖視覺元素
- 檔案：修改 `new/new-frontend/pages/index.vue`
- 實作選項：
  - A) 使用靜態圖片 (最簡單)
  - B) 使用 Mapbox 嵌入 (需評估效能)
  - C) 維持現狀，僅改善卡片樣式
- 測試策略：背景元素存在 (若實作)
- 注意：此為視覺增強，優先級較低

**任務 6.4：新增建立專案按鈕**
- 目的：藍色 "+ CREATE NEW PROJECT" 按鈕
- 檔案：修改 `new/new-frontend/pages/index.vue`
- UI 元素：
  - 藍底白字按鈕 (#006ab5)
  - 點擊導向 `/projects/create`
- 測試策略：按鈕可點擊、導航正確
- 驗收條件：點擊後跳轉建立頁面

**Placeholder 資料結構 (待後端確認)**:
```typescript
// 專案分類 (若後端支援)
interface Project {
  id: number
  name: string
  category: 'INDOOR' | 'OUTDOOR'  // 新增欄位
  created_at: string
  owner: {
    account: string
  }
}
```

**TDD 測試案例** (`tests/e2e/projects-list.spec.ts`):
```
1. 基本頁面結構
   - should display projects list page
   - should have map background (或 placeholder)
   - should have create project button

2. 專案分類
   - should display OUTDOOR section label
   - should display INDOOR section label
   - should group projects by category

3. 專案卡片
   - should display project name
   - should display date badge with calendar icon
   - should display user badge with user icon
   - should have View Project link
   - should have Delete Project link with confirmation

4. 互動功能
   - should navigate to project on View Project click
   - should delete project with confirmation
   - should navigate to create page on button click
```

---

#### Phase 5-6 優先級建議

| Phase | 功能 | 優先級 | 原因 |
|-------|------|--------|------|
| 5 | AI Model Evaluation | P1 (高) | 全新功能，Figma 明確設計 |
| 6.1 | INDOOR/OUTDOOR 分類 | P2 (中) | 需後端配合，可先 placeholder |
| 6.2 | 卡片樣式升級 | P2 (中) | 純前端修改，視覺改善 |
| 6.3 | 地圖背景 | P3 (低) | 視覺增強，非必要 |
| 6.4 | 建立按鈕 | P2 (中) | 功能已存在，只是樣式調整 |

**實作順序建議**：
1. **Phase 5 先行**：AI Model Evaluation 是全新頁面，與現有程式碼耦合度低，可獨立開發測試
2. **Phase 6 漸進**：Projects List 改進可分階段進行，先做卡片樣式 (風險低)，再做分類 (需後端)

**避免過度生成/過早抽象**：
- Phase 5：不要建立通用的 "Toggle Panel" 元件，直接在頁面內實作兩個 v-switch
- Phase 6：卡片樣式直接在 index.vue 內修改，不要抽出 ProjectCard 元件

---

## 6. Pipeline 驗證清單

每個 commit 前必須通過：

```bash
# 1. TypeScript 類型檢查
cd new/new-frontend && npx nuxi typecheck

# 2. ESLint 檢查
npm run lint

# 3. E2E 測試
npx playwright test

# 4. 構建驗證
npm run build
```

---

## 7. 檔案結構參考（現有專案）

```
new/new-frontend/
├── pages/
│   ├── login.vue              # 登入（對齊 ✅）
│   ├── register.vue           # 註冊（對齊 ✅）
│   ├── index.vue              # 專案列表（Phase 6 需改進）
│   ├── ai-models.vue          # AI 模型管理（Phase 1 ✅）
│   ├── profile.vue            # 個人資料（Phase 3 ✅）
│   └── projects/[projectId]/
│       ├── overviews.vue      # 專案概覽（對齊 ✅）
│       ├── setting.vue        # 專案設定（對齊 ✅）
│       ├── config/
│       │   └── evaluations.vue
│       ├── performance/
│       │   ├── nes.vue        # NES 效能（對齊 ✅）
│       │   ├── mro.vue        # MRO 效能（對齊 ✅）
│       │   ├── ai-model.vue   # AI 模型效能（Phase 2 ✅）
│       │   └── ran-slice.vue  # RAN Slice 效能（Phase 2 ✅）
│       └── ai-model-evaluation.vue  # 🆕 Phase 5 待新增
├── layouts/
│   └── default.vue            # 主佈局（Phase 4 ✅ 導航選單）
├── components/
│   └── ChatInterface.vue      # 聊天介面
├── stores/
│   ├── user.ts
│   └── assistant.ts
└── tests/e2e/
    ├── login.spec.ts          # 4 個測試
    ├── ai-models.spec.ts      # 32 個測試
    ├── performance.spec.ts    # 10 個測試
    ├── profile.spec.ts        # 9 個測試
    ├── navigation.spec.ts     # 9 個測試
    └── ai-model-evaluation.spec.ts  # 🆕 Phase 5 待新增
```

---

## 8. 程式碼風格規範（依現有專案）

### 8.1 Vue 組件
- 使用 `<script setup>` 語法
- 優先使用 Vuetify 3 組件
- 樣式使用 `<style scoped>`

### 8.2 TypeScript
- 部分頁面使用 `lang="ts"`（建議統一）
- API 類型由 swagger-typescript-api 自動生成

### 8.3 命名規範
- 頁面檔案：kebab-case (`ai-models.vue`)
- 組件：PascalCase (`ChatInterface.vue`)
- 變數：camelCase

### 8.4 註解規範
- 使用繁體中文
- 註解量不超過程式碼本身
- 說明「為什麼」而非「做什麼」

---

## 9. Session 交接資訊

### 9.1 下一個 Session 的進入點
1. 閱讀此文件了解完整上下文
2. 閱讀 `CLAUDE.md` 了解專案規範
3. **從 Phase 5 任務 5.1 開始執行**（AI Model Evaluation 頁面）
4. Phase 1-4 已完成，PR #3 待審核

### 9.2 重要檔案路徑
- 設計權威來源：`new_design/`
- 現有前端：`new/new-frontend/`
- 專案規範：`CLAUDE.md`
- 軟體工程規範：`專案軟體工程.md`、`過早抽象錯誤.md`

### 9.3 測試帳號
- 帳號：`admin1`
- 密碼：`admin1`

### 9.4 啟動方式
```bash
cd new/
docker compose build frontend
docker compose up -d
```

---

## 10. 決策記錄

### 決策 1：使用 Placeholder 而非假造 API
- **情境**：部分 AI Models 功能無後端 API
- **決策**：使用 placeholder handler，顯示「尚未接上後端」
- **理由**：避免臆測 API 結構，保持程式碼誠實

### 決策 2：維持現有路由結構
- **情境**：設計規範使用 `/auth/login`，現有使用 `/login`
- **決策**：維持現有路由
- **理由**：避免破壞現有功能，差異可接受

### 決策 3：不新增抽象層
- **情境**：NES/MRO 頁面程式碼重複
- **決策**：暫不抽取共用組件
- **理由**：遵守「過早抽象」規範，除非有第三個類似頁面

---

## 11. 現有前端完整檔案清單與狀態

### 11.1 頁面檔案清單（pages/）

#### Admin 專屬頁面（需 ADMIN 角色）
| 檔案 | 路由 | 狀態 | 設計對應 | 修改需求 |
|------|------|------|----------|:--------:|
| `ai-models.vue` | /ai-models | 功能完成，部分 placeholder | 17:484 | ✅ 強化 |
| `users.vue` | /users | ✅ 完成 | 無 | ❌ |
| `brands.vue` | /brands | ✅ 完成 | 無 | ❌ |
| `unapproved-model.vue` | /unapproved-model | ❌ Placeholder | 無 | 🟡 視需求 |

#### User 頁面
| 檔案 | 路由 | 狀態 | 設計對應 | 修改需求 |
|------|------|------|----------|:--------:|
| `login.vue` | /login | ✅ 完成 | 3:477 | 🟡 微調 |
| `register.vue` | /register | ✅ 完成 | 3:1042 | ❌ |
| `index.vue` | / | ✅ 完成 | 3:713 | 🟡 微調 |
| `profile.vue` | /profile | ❌ Placeholder | 3:491, 3:996 | ✅ 重寫 |
| `scenario.vue` | /scenario | ❌ Placeholder | 3:517 | ✅ 重寫 |
| `upload.vue` | /upload | ❌ Placeholder | 3:662 | ✅ 重寫 |

#### 專案內頁面
| 檔案 | 路由 | 狀態 | 設計對應 | 修改需求 |
|------|------|------|----------|:--------:|
| `overviews.vue` | /projects/[id]/overviews | ✅ 完成 | 3:505 | ❌ |
| `setting.vue` | /projects/[id]/setting | ✅ 完成 | 3:755 | ❌ |
| `create.vue` | /projects/create | ✅ 完成 | 3:785 | ❌ |
| `evaluations.vue` | /projects/[id]/config/evaluations | ✅ 完成 | 3:532 | ❌ |
| `gnb.vue` | /projects/[id]/config/gnb | ✅ 完成 | 3:616 | 🟡 微調 |
| `nes.vue` | /projects/[id]/performance/nes | ✅ 完成 | 3:692 | ❌ |
| `mro.vue` | /projects/[id]/performance/mro | ✅ 完成 | 3:692 | ❌ |
| **ai-model.vue** | /projects/[id]/performance/ai-model | ❌ 不存在 | 3:1084 | ✅ 新增 |
| **ran-slice.vue** | /projects/[id]/performance/ran-slice | ❌ 不存在 | 3:1138 | ✅ 新增 |
| **federated/index.vue** | /projects/[id]/federated | ❌ 不存在 | 3:596 | ✅ 新增 |
| **simulation/index.vue** | /projects/[id]/simulation | ❌ 不存在 | 3:570 | ✅ 新增 |

### 11.2 Placeholder 頁面詳情

以下頁面目前僅顯示「網頁維護中」圖片：
```
pages/profile.vue         → 需重寫為個人資料頁面
pages/scenario.vue        → 需重寫為場景驗測頁面
pages/upload.vue          → 需重寫為 AI 模型上傳頁面
pages/unapproved-model.vue → 需重寫為待審核模型頁面
```

### 11.3 導航選單需修改項目

`layouts/default.vue` 中被註解的項目（第 130-133 行）：
```javascript
// 需重新啟用：
{ title: 'Profile', to: '/profile' },
{ title: 'Upload AI Model', to: '/upload' },
{ title: 'Scenario', to: '/scenario' },
{ title: 'Unapproved Model', to: '/unapproved-model', requiredRole: 'ADMIN' },
```

專案選單需新增項目（第 142-162 行）：
```javascript
// 需要新增：
{ title: 'Federal learning', to: `/projects/${projectId.value}/federated` },
{ title: 'Simulation', to: `/projects/${projectId.value}/simulation` },
// Performance 子選單需新增：
{ title: 'AI Model', to: `/projects/${projectId.value}/performance/ai-model` },
{ title: 'Ran Slice', to: `/projects/${projectId.value}/performance/ran-slice` },
```

---

## 12. 媒體素材保留策略

### 12.1 現有素材清單（public/）
```
✅ 全部保留，不刪除：
├── Alvin.png               # 彩蛋圖片（unapproved-model）
├── Crews.jpg               # 團隊合照（Footer 連結）
├── RU_model.gltf           # RU 3D 模型（地圖使用）
├── Webpage-Maintening.png  # 維護中圖片（placeholder 頁面）
├── background.jpg          # 背景圖
├── capyengineer.png        # 彩蛋圖片（profile）
├── favicon.ico             # 網站圖標
├── nycu.png                # NYCU Logo
├── robots.txt              # SEO 設定
├── tfn.png                 # TFN Logo
└── wisdon.png              # WiSDON Logo
```

### 12.2 素材使用對應
| 素材 | 使用位置 | 說明 |
|------|----------|------|
| wisdon.png | layouts/default.vue | Logo（WiSDON 模式） |
| tfn.png | layouts/default.vue | Logo（TFN 模式） |
| nycu.png | 預留 | 可用於 Footer 或關於頁面 |
| Crews.jpg | layouts/default.vue | Footer 版權連結 |
| RU_model.gltf | overviews.vue, evaluations.vue | 3D 地圖 RU 模型 |
| Webpage-Maintening.png | profile, scenario, upload, unapproved-model | Placeholder 頁面 |
| capyengineer.png | profile.vue | 彩蛋（點擊 10+ 次顯示） |
| Alvin.png | unapproved-model.vue | 彩蛋（點擊 10+ 次顯示） |
| background.jpg | 預留 | 可用於登入頁面背景 |

### 12.3 新功能可能需要的素材
```
📁 可能需要新增（待設計確認）：
├── grafana-ai-model-placeholder.png   # AI Model Performance 預覽圖
├── grafana-ran-slice-placeholder.png  # Ran Slice Performance 預覽圖
├── federated-learning-icon.svg        # 聯邦學習圖標
└── simulation-icon.svg                # 模擬圖標
```

---

## 13. 修改任務總覽（按優先級）

### 🔴 高優先級（P0）- 已完成
| # | 任務 | 類型 | 修改檔案 | 狀態 |
|---|------|------|----------|--------|
| 1 | AI Models 版本選擇器 | Admin | pages/ai-models.vue | ✅ 完成 |
| 2 | AI Models Pre-train Result | Admin | pages/ai-models.vue | ✅ 完成 |
| 3 | AI Models Preview 視窗 | Admin | pages/ai-models.vue | ✅ 完成 |
| 4 | Profile 頁面重寫 | User | pages/profile.vue | ✅ 完成 |
| 5 | 修改密碼對話框 | User | pages/profile.vue | ✅ 完成 |

### 🟡 中優先級（P1）- 部分完成
| # | 任務 | 類型 | 修改檔案 | 狀態 |
|---|------|------|----------|--------|
| 6 | AI Model Performance 頁面 | User | pages/.../performance/ai-model.vue | ✅ 完成 |
| 7 | RAN Slice Performance 頁面 | User | pages/.../performance/ran-slice.vue | ✅ 完成 |
| 8 | 導航選單啟用 Profile | Layout | layouts/default.vue | ✅ 完成 |
| 9 | 導航選單新增項目 | Layout | layouts/default.vue | ✅ 完成 |
| 10 | Federal Learning 頁面 | User | pages/.../federated/index.vue | ❌ 待做 |
| 11 | Simulation 頁面 | User | pages/.../simulation/index.vue | ❌ 待做 |

### 🆕 新增任務（Phase 5-6）
| # | 任務 | 類型 | 修改檔案 | 狀態 |
|---|------|------|----------|--------|
| 16 | AI Model Evaluation 頁面 | User | pages/.../ai-model-evaluation.vue | ❌ 待做 (P1) |
| 17 | Projects List INDOOR/OUTDOOR | User | pages/index.vue | ❌ 待做 (P2) |
| 18 | Projects List 卡片樣式 | User | pages/index.vue | ❌ 待做 (P2) |
| 19 | Projects List 地圖背景 | User | pages/index.vue | ❌ 待做 (P3) |

### 🟢 低優先級（P2）
| # | 任務 | 類型 | 修改檔案 | 狀態 |
|---|------|------|----------|--------|
| 12 | Scenario 頁面重寫 | User | pages/scenario.vue | ❌ 待做 |
| 13 | Upload 頁面重寫 | User | pages/upload.vue | ❌ 待做 |
| 14 | Unapproved Model 頁面 | Admin | pages/unapproved-model.vue | ❌ 待做 |
| 15 | AI Models Re-train Result | Admin | pages/ai-models.vue | ✅ 完成 |

---

## 附錄 A：設計檔案對照表

完整的 Figma Frame 對照表請參考：
- `new_design/wisdON-figma-node3-407-export/manifests/route_map.json`
- `new_design/wisdON-figma-node3-407-export/docs/workflow.md`

---

## 附錄 B：參考資料

- Claude Code Memory System: https://docs.anthropic.com/claude-code/memory
- TDD 原則: https://martinfowler.com/bliki/TestDrivenDevelopment.html
- Boy Scout Rule: https://www.oreilly.com/library/view/97-things-every/9780596809515/ch08.html
- Small CLs: https://google.github.io/eng-practices/review/developer/small-cls.html
