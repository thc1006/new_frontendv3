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
- `/new/new-frontend/pages/login.vue`
- `/new/new-frontend/pages/register.vue`

**已實現：**
- 登入：帳號/密碼 + Vue Query mutation + Snackbar 錯誤反饋
- 註冊：**密碼驗證規則已移植完成**（同 legacy regex）
- 成功 Dialog 提示
- 表單 disabled 狀態管理

**缺口：**
- 沒有即時檢查帳號是否存在
- 沒有即時檢查信箱是否存在

#### 可移植/不可移植的原因

| 功能 | 可移植性 | 原因 |
|------|---------|------|
| 密碼驗證規則 | ✅ 已移植 | @new/ register.vue L96 已有相同 regex |
| 即時帳號檢查 | ⚠️ 需新增 | 需要後端 API 支援 + 前端 debounce |
| 即時信箱檢查 | ⚠️ 需新增 | 需要後端 API 支援 + 前端 debounce |

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
- `/new/new-frontend/pages/ai-models.vue`

**已實現：**
- 模型列表（表格顯示 + hover 效果）
- 詳細資料（Modal 顯示指標）
- 刪除（確認 Dialog + Snackbar 反饋）
- 新增模型（Modal + 選擇 abstract metrics）

**缺口（目標按鈕）：**

| 按鈕 | @new/ 現況 | 後端端點 | 移植方案 |
|------|-----------|---------|---------|
| Pretrain | ❌ 沒有 | ❌ 無端點 | placeholder handler |
| Preview | ❌ 沒有 | ❌ 無端點 | placeholder handler |
| Enable | ❌ 沒有 | ⚠️ 不確定 | placeholder / 檢查 PUT |
| Retrain | ❌ 沒有 | ❌ 無端點 | placeholder handler |
| Update | ❌ 沒有 | ✅ PUT /primitive_ai_models/{id} | 可直接實作 |
| Delete | ✅ 已有 | ✅ DELETE | - |

#### 可移植/不可移植的原因

| 功能 | 可移植性 | 原因 |
|------|---------|------|
| UI 結構 | ✅ 可移植 | Bootstrap → Vuetify 轉換 |
| Create/Delete | ✅ 已有 | API 端點存在 |
| Update | ✅ 可實作 | PUT 端點存在 |
| Retrain/Pretrain | ❌ 需 placeholder | 後端無對應端點 |
| Preview | ❌ 需 placeholder | 後端無對應端點 |
| Enable | ⚠️ 待確認 | 需檢查是否有 PATCH 端點或欄位 |

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

**現況：**
- 完全沒有 Grafana 整合
- 沒有 Performance 專用頁面
- `/pages/projects/[projectId]/overviews.vue` 有熱力圖，但非 Grafana

**缺口：**
- 需要新增 Performance 頁面
- 需要嵌入 Grafana iframe

#### 可移植/不可移植的原因

| 功能 | 可移植性 | 原因 |
|------|---------|------|
| Grafana iframe | ✅ 100% | Vue 支援 iframe |
| Dashboard URL | ✅ 直接複製 | 純字串配置 |
| 響應式高度 | ✅ 可實作 | CSS style 屬性 |

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
- `/new/new-frontend/pages/login.vue` - 登入頁面 (140 行)
- `/new/new-frontend/pages/register.vue` - 註冊頁面 (138 行)
- `/new/new-frontend/stores/user.ts` - 使用者狀態
- `/new/new-frontend/middleware/auth.global.ts` - 認證中介軟體

**AI Models：**
- `/new/new-frontend/pages/ai-models.vue` - AI 模型頁面 (265 行)
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

## 五、移植優先級與風險評估

### 優先級排序

| 優先級 | 區塊 | 複雜度 | 風險 |
|--------|------|--------|------|
| 1 | AI Models Actions | 中 | 低（大部分需 placeholder） |
| 2 | Performance Grafana | 低 | 低（純 iframe） |
| 3 | Login 即時驗證 | 中 | 中（需確認後端 API） |

### 風險項目

1. **AI Models 後端 API 缺失**
   - Retrain、Pretrain、Preview 無端點
   - 應對：放置 placeholder handler，顯示「尚未接上」提示

2. **Login 即時驗證 API**
   - @new/ 後端需確認是否有帳號/信箱檢查端點
   - 應對：先檢查 Api.ts，若無則放置 placeholder

3. **Grafana 網路連通性**
   - iframe 指向外部 IP (140.113.144.121:2982)
   - 應對：確保網路可達或提供配置選項

---

## 六、下一步：Plan 階段

根據 Explore 結果，Plan 階段需要：

1. 為 AI Models 設計 6 個按鈕的 UI（Pretrain, Preview, Enable, Retrain, Update, Delete）
2. 定義 placeholder handler 的行為與 TODO 格式
3. 規劃 Performance 頁面路由與元件結構
4. 確認 Login 即時驗證的後端支援情況
5. 切分 Small CLs，每個可獨立驗證
