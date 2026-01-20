# Explore 階段分析報告

> 日期：2026-01-06
> 目標：分析 @legacy/ 與 @new/ 差異，為三大功能區塊（Login UI、AI Models Actions、Performance）提供移植評估

---

## 一、專案架構概覽

### @legacy/ 結構
```
legacy/
├── backend/                    # Python 後端
│   ├── DB_dump/
│   ├── heatmap/
│   ├── method/
│   └── script/
└── frontend/                   # Flask + Jinja2
    ├── app.py                  # 主應用 (含所有路由)
    ├── util.py
    ├── templates/              # HTML 樣板
    │   ├── index.html          # 登入頁
    │   ├── register.html       # 註冊頁
    │   ├── AI_config.html      # AI 模型配置
    │   ├── performanceNES.html # Grafana NES
    │   └── performanceMRO.html # Grafana MRO
    └── static/
        ├── css/
        └── js/
            ├── register.js
            └── AI_config.js
```

**技術棧：** Flask + Jinja2 + Bootstrap 5 + jQuery AJAX

### @new/ 結構
```
new/
├── backend/                    # Flask + SQLAlchemy
│   ├── controllers/            # RESTful API
│   ├── models/                 # ORM 模型
│   └── app.py
└── new-frontend/               # Nuxt 3 + Vue 3
    ├── apis/Api.ts             # 自動生成的 API Client
    ├── pages/
    │   ├── login.vue
    │   ├── register.vue
    │   └── ai-models.vue
    ├── stores/                 # Pinia
    ├── querys/                 # TanStack Vue Query
    └── components/
```

**技術棧：** Nuxt 3 + Vue 3 + TypeScript + Vuetify 3 + Pinia + TanStack Vue Query

---

## 二、三大區塊現況摘要

### A. Login UI / Flow

#### @legacy/ 怎麼做、優點是什麼

**檔案位置：**
- `/legacy/frontend/templates/index.html` (登入)
- `/legacy/frontend/templates/register.html` (註冊)

**優點：**
1. **完整密碼驗證規則：**
   ```
   pattern="^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.*(.)\1{2,}).{8,20}$"
   ```
   - 8-20 字元
   - 必須包含大寫、小寫、數字、特殊符號
   - 禁止連續 3 個相同字元

2. **即時 AJAX 驗證：**
   - 輸入帳號時即時檢查是否已存在 (HTTP 200 = 已存在，404 = 可用)
   - 輸入信箱時即時檢查是否已存在
   - 前端 email 格式驗證

3. **完整 UX 反饋：**
   - 所有欄位驗證通過前，Register 按鈕維持 disabled
   - 即時顯示 is-valid / is-invalid 樣式
   - 清楚的錯誤訊息

#### @new/ 目前怎麼做、缺口是什麼

**檔案位置：**
- `/frontend/pages/login.vue`
- `/frontend/pages/register.vue`

**已實現：**
- 登入：帳號/密碼 + Vue Query mutation + Snackbar 錯誤反饋
- 註冊：**密碼驗證規則已移植完成**（同 legacy regex）
- 成功 Dialog 提示
- 表單 disabled 狀態管理

**缺口（已部分解決）：**
- 即時帳號檢查：**已有 placeholder 實作**（`checkAccountExists` + debounce 500ms）
- 即時信箱檢查：**已有 placeholder 實作**（`checkEmailExists` + debounce 500ms）
- 目前回傳 `false`（假設都可用），等待後端 API 完成

#### 可移植/不可移植的原因

| 功能 | 可移植性 | 原因 |
|------|---------|------|
| 密碼驗證規則 | ✅ 已移植 | @new/ register.vue 已有相同 regex |
| 即時帳號檢查 | ✅ 已有 placeholder | `checkAccountExists` + debounce，待接 API |
| 即時信箱檢查 | ✅ 已有 placeholder | `checkEmailExists` + debounce，待接 API |

---

### B. AI Models Actions (底部按鈕群)

#### @legacy/ 怎麼做、優點是什麼

**檔案位置：**
- `/legacy/frontend/templates/AI_config.html`
- `/legacy/frontend/static/js/AI_config.js`

**現有功能按鈕：**

| 按鈕 | 功能描述 | 實作方式 |
|------|---------|---------|
| Auto Apply On/Off | 切換自動套用 + 設定各模型比例分配 | Modal + Slider + Input |
| Create Model | 新增 AI 模型 | Modal + 輸入名稱 |
| Delete Model | 刪除 AI 模型 | Modal + 下拉選擇 |
| Input | 上傳 .pth + 設定參數 | 每個模型一個按鈕 + Modal |
| Enable/Disable | 模型開關 | form-switch checkbox |
| Retrain | 重新訓練 | Modal (Config + Query Performance + Deployment + Retrain) |

**優點：**
1. 功能完整，涵蓋 AI 模型生命週期
2. Auto Apply 比例分配 UI 直觀（滑桿同步數值輸入）
3. Retrain Modal 整合多項操作（Config、Query、Deploy、Retrain）

#### @new/ 目前怎麼做、缺口是什麼

**檔案位置：**
- `/frontend/pages/ai-models.vue`

**已實現：**
- 模型列表（表格顯示 + hover 效果）
- 詳細資料（Modal 顯示指標）
- 刪除（確認 Dialog + Snackbar 反饋）
- 新增模型（Modal + 選擇 abstract metrics）
- **編輯（Update）**：已實作，可修改模型名稱
- **Enable/Disable**：已有 v-switch UI + placeholder handler
- **Pretrain**：已有按鈕 + placeholder handler
- **Preview**：已有按鈕 + placeholder handler
- **Retrain**：已有 Dialog（round + epochs 配置）+ placeholder handler

**目標按鈕現況（更新於 2026-01-06）：**

| 按鈕 | @new/ 現況 | 後端端點 | 狀態 |
|------|-----------|---------|------|
| Pretrain | ✅ 按鈕 + placeholder | ❌ 無端點 | 待後端 API |
| Preview | ✅ 按鈕 + placeholder | ❌ 無端點 | 待後端 API |
| Enable | ✅ switch + placeholder | ❌ 無端點 | 待後端 PATCH API |
| Retrain | ✅ Dialog + placeholder | ❌ 無端點 | 待後端 API |
| Update | ✅ 已實作 | ✅ PUT API | 完成 |
| Delete | ✅ 已實作 | ✅ DELETE API | 完成 |

#### 可移植/不可移植的原因

| 功能 | 可移植性 | 原因 |
|------|---------|------|
| UI 結構 | ✅ 已完成 | Vuetify 元件已實作 |
| Create/Delete | ✅ 已完成 | API 端點存在且已接通 |
| Update | ✅ 已完成 | PUT 端點已接通 |
| Retrain/Pretrain | ✅ UI 已完成 | 已有 placeholder，待後端 API |
| Preview | ✅ UI 已完成 | 已有 placeholder，待後端 API |
| Enable | ✅ UI 已完成 | 已有 placeholder，待後端 PATCH API |

---

### C. Performance (Grafana)

#### @legacy/ 怎麼做、優點是什麼

**檔案位置：**
- `/legacy/frontend/templates/performanceNES.html`
- `/legacy/frontend/templates/performanceMRO.html`

**實作方式：**
```html
<!-- NES -->
<iframe src="http://140.113.144.121:2982/d/adkys2aoyeqkgf/nes"
        frameborder="0"
        style="width: 100%; height: 900px" />

<!-- MRO -->
<iframe src="http://140.113.144.121:2982/d/bdl9s0tm6mebkf/mro"
        frameborder="0"
        style="width: 100%; height: 1000px" />
```

**優點：**
1. 極簡實作（純 iframe 嵌入）
2. Grafana 負責所有視覺化邏輯
3. 即時數據更新

#### @new/ 目前怎麼做、缺口是什麼

**現況（已完成）：**
- `/pages/performance/nes.vue` - NES Grafana 頁面
- `/pages/performance/mro.vue` - MRO Grafana 頁面
- 使用 Vue 3 組件 + iframe 嵌入
- 已有載入狀態（v-progress-circular）
- 已有錯誤處理（v-snackbar）
- 已有重新整理按鈕
- Grafana URL 硬編碼（有 TODO 註記）

**優於 Legacy 的改進：**
- 載入狀態指示
- 錯誤處理反饋
- 重新整理功能

**待改進：**
- 將 Grafana URL 移至環境變數或設定檔

#### 可移植/不可移植的原因

| 功能 | 可移植性 | 原因 |
|------|---------|------|
| Grafana iframe | ✅ 已完成 | Vue 組件已實作 |
| Dashboard URL | ✅ 已完成 | 使用相同 URL |
| 響應式高度 | ✅ 已完成 | CSS + flex layout |
| 載入/錯誤處理 | ✅ 已完成 | 優於 Legacy |

---

## 三、關鍵檔案路徑清單

### @legacy/ 關鍵檔案

**Login 系統：**
- `/legacy/frontend/templates/index.html` - 登入頁面
- `/legacy/frontend/templates/register.html` - 註冊頁面（含 inline JS）
- `/legacy/frontend/static/js/register.js` - 密碼驗證邏輯

**AI Models：**
- `/legacy/frontend/templates/AI_config.html` - AI 模型配置 UI + JS
- `/legacy/frontend/static/js/AI_config.js` - AI 配置事件邏輯

**Performance：**
- `/legacy/frontend/templates/performanceNES.html` - NES Grafana
- `/legacy/frontend/templates/performanceMRO.html` - MRO Grafana

### @new/ 關鍵檔案

**Login 系統：**
- `/frontend/pages/login.vue` - 登入頁面 (140 行)
- `/frontend/pages/register.vue` - 註冊頁面 (138 行)
- `/frontend/stores/user.ts` - 使用者狀態
- `/frontend/middleware/auth.global.ts` - 認證中介軟體

**AI Models：**
- `/frontend/pages/ai-models.vue` - AI 模型頁面 (265 行)
- `/new/backend/controllers/PrimitiveAIModel.py` - RESTful API

**效能（待新增）：**
- 目前無對應檔案

---

## 四、@new/ 程式碼風格摘要

**命名規範：**
- 檔案名：kebab-case (`auth.global.ts`)
- 變數：camelCase (`selectedAI`, `isLoading`)
- Vue 組件：PascalCase (`ChatInterface.vue`)

**Composition API 風格：**
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
const aiList = ref([])
const detailDialog = ref(false)
</script>
```

**狀態管理：**
- 伺服器狀態：TanStack Vue Query
- 本地狀態：ref / reactive
- 全域狀態：Pinia stores

**API 呼叫：**
```typescript
const { $apiClient } = useNuxtApp()
await $apiClient.primitiveAiModel.primitiveAiModelsList()
```

**UI 元件：**
- Vuetify 3 (v-card, v-dialog, v-btn, v-table, v-snackbar)
- Material Design Icons (mdi-*)

---

## 五、完成狀態總結

### 三大區塊完成度

| 區塊 | 完成度 | 備註 |
|------|--------|------|
| Login/Register | 95% | placeholder 已就位，待後端 API |
| AI Models Actions | 90% | 6 個按鈕 UI 已完成，4 個待後端 API |
| Performance Grafana | 100% | 已完成且優於 Legacy |

### 待完成項目

1. **後端 API 開發（非前端範圍）**
   - `GET /auth/check-account?account={account}` - 帳號存在性檢查
   - `GET /auth/check-email?email={email}` - 信箱存在性檢查
   - `PATCH /primitive_ai_models/{id}/enable` - 模型啟用/停用
   - `POST /primitive_ai_models/{id}/pretrain` - 預訓練
   - `GET /primitive_ai_models/{id}/preview` - 預覽
   - `POST /primitive_ai_models/{id}/retrain` - 重新訓練

2. **前端微調**
   - 將 Grafana URL 移至環境變數
   - 待後端 API 完成後，移除 placeholder 並接入實際 API

### 風險項目

1. **後端 API 排程**
   - 目前所有 placeholder 功能都在等待後端 API
   - 應對：前端已完成，可隨時接入

2. **Grafana 網路連通性**
   - iframe 指向外部 IP (140.113.144.121:2982)
   - 應對：已有錯誤處理，建議將 URL 移至設定檔

---

## 六、結論

**探索結果摘要：**

經過完整分析，發現 @new/ 版本已經相當成熟：

1. **Login/Register**：密碼驗證規則已完成，即時帳號/信箱檢查的 UI 和 debounce 邏輯已就位，只待後端 API。

2. **AI Models Actions**：目標的 6 個按鈕（Pretrain、Preview、Enable、Retrain、Update、Delete）UI 全部完成，其中 Update 和 Delete 已接通 API，其餘 4 個有完整的 placeholder handler。

3. **Performance Grafana**：兩個頁面已完成，且比 Legacy 版本更完善（有載入狀態、錯誤處理、重新整理功能）。

**下一步建議：**

1. 與後端團隊協調 API 開發優先順序
2. 待 API 完成後，逐一移除 placeholder 並接入實際功能
3. 將 Grafana URL 移至環境變數（小改動，可獨立完成）
