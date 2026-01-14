# WiSDON Frontend 待辦事項清單

> 產出日期：2026-01-14 (Figma Node 3:407 深度分析更新)
> 分析範圍：new/new-frontend/, new_design/, Figma DunvlOkbkGlFFpWzZbtvuf
> 當前測試數：114 個 E2E 測試通過

---

## 目錄

1. [優先級說明](#優先級說明)
2. [Figma 設計對齊狀態](#figma-設計對齊狀態)
3. [P0 - 緊急項目](#p0---緊急項目)
4. [P1 - 高優先級](#p1---高優先級)
5. [P2 - 中優先級](#p2---中優先級)
6. [P3 - 低優先級](#p3---低優先級)
7. [後端 API 待實作](#後端-api-待實作)
8. [技術債務](#技術債務)
9. [測試覆蓋](#測試覆蓋)

---

## 優先級說明

| 優先級 | 定義 | 建議時程 |
|--------|------|---------|
| **P0** | 影響生產環境、安全性、用戶體驗的緊急問題 | 立即處理 |
| **P1** | 重要功能缺失或品質問題 | 1-2 週內 |
| **P2** | 改進項目，提升開發效率或代碼品質 | 1 個月內 |
| **P3** | 長期優化，技術債務清理 | 季度規劃 |

---

## Figma 設計對齊狀態

> 根據 Figma Node 3:407 "Normal user" layer 分析

### 已完成頁面 (100%)

| Figma Node | 頁面名稱 | 實作檔案 | E2E 測試數 |
|------------|----------|---------|-----------|
| 3:477 | Login | `pages/login.vue` | 12 |
| 3:491 | Profile | `pages/profile.vue` | 10 |
| 3:713 | Projects List | `pages/index.vue` | 29 |
| 3:420 | AI Model 配置 | `pages/ai-models.vue` | 32 |
| 3:532 | Evaluation | `pages/projects/[projectId]/config/evaluations.vue` | 7 |
| 3:505 | Overview | `pages/projects/[projectId]/overviews.vue` | - |
| 3:626 | AI Model Evaluation | `pages/projects/[projectId]/ai-model-evaluation.vue` | 11 |
| 3:692, 3:1063 | Network Performance | `pages/projects/[projectId]/performance/nes.vue` | 10 |
| 3:1084 | AI Model Performance | `pages/projects/[projectId]/performance/ai-model.vue` | - |
| 3:1138 | Ran Slice Performance | `pages/projects/[projectId]/performance/ran-slice.vue` | - |
| 3:844 | Menu | `layouts/default.vue` | 9 |

### 待實作頁面

| Figma Node | 頁面名稱 | 優先級 | 備註 |
|------------|----------|--------|------|
| 3:1042 | **Register** | P1 | 缺少註冊頁面 |
| 3:785, 3:814 | **Create Project** | P1 | indoor/outdoor toggle |
| 3:755 | **Project Setting** | P1 | 專案設定與成員管理 |
| 3:662 | Upload AI Model | P2 | 上傳 AI 模型 |
| 3:596 | Federal Learning | P2 | 聯邦學習主頁 |
| 3:604 | Federal Learning Model | P2 | 聯邦學習模型詳情 |
| 3:616 | gNB | P2 | gNodeB 配置頁 |
| 3:517 | Scenario | P2 | 場景驗測頁面 |
| 3:570, 3:582 | Simulation | P2 | 模擬頁面 |
| 3:1014 | AI Assistant (完整版) | P3 | 完整聊天室界面 |

### 待實作對話框/模態視窗

| Figma Node | 名稱 | 優先級 | 備註 |
|------------|------|--------|------|
| 3:996 | Change Password | ✅ 已完成 | Profile 頁面 |
| 3:408 | Pretrain Modal | ✅ 已完成 | ai-models.vue |
| 3:1126 | Retrain Modal | ✅ 已完成 | ai-models.vue |
| 3:414 | Disable Confirm | ✅ 已完成 | ai-models.vue |
| 3:1105 | Enable Confirm | ✅ 已完成 | ai-models.vue |
| 3:1111 | Model Update | ✅ 已完成 | ai-models.vue |
| 3:876 | Delete Project Warning | P1 | 刪除專案確認 |
| 3:953 | Upload Model Warning | P2 | 上傳模型警告 |
| 3:963 | Insufficient Data Warning | P2 | 資料不足警告 |
| 3:929 | Choose Simulation Data | P2 | 選擇模擬資料 |
| 3:1118 | CoTrain Confirm | P3 | 聯合訓練確認 |
| 3:1132 | CoTrain Form | P3 | 聯合訓練表單 |

---

## P0 - 緊急項目

### 已完成

- [x] **圖片資源優化** ✅ (2026-01-13)
  - 轉換 PNG → WebP，7.6MB → 948KB (87.5% 節省)

- [x] **Bundle Code Splitting** ✅ (2026-01-14)
  - THREE.js (849KB) 和 Mapbox (547KB) 分離成獨立 chunks

- [x] **安全性修復** ✅ (2026-01-14)
  - Flask-Login session 認證確認安全
  - localStorage 死代碼移除
  - CSRF 防護 (SameSite=Lax)

- [x] **測試環境修復** ✅ (2026-01-14)
  - Playwright 設定改用 HTTP (nginx port 80)
  - 登入按鈕選擇器統一為 "Login"
  - 114/114 測試通過

---

## P1 - 高優先級

### 缺少頁面實作

- [ ] **Register 頁面** (Figma 3:1042)
  - 位置：`pages/register.vue`
  - 功能：帳號、Email、密碼、確認密碼
  - 工時：3 小時

- [ ] **Create Project 頁面** (Figma 3:785, 3:814)
  - 位置：`pages/projects/create.vue`
  - 功能：專案名稱、地址搜尋、地圖選點、indoor/outdoor toggle、成員邀請
  - 工時：1 天

- [ ] **Project Setting 頁面** (Figma 3:755)
  - 位置：`pages/projects/[projectId]/setting.vue`
  - 功能：專案名稱編輯、成員列表、邀請/移除成員、刪除專案
  - 工時：1 天

### 代碼品質

- [ ] **TypeScript 類型安全**
  - 檔案：`stores/assistant.ts`, `pages/*/overviews.vue`
  - 問題：32 處使用 `any` 類型
  - 工時：1 天

- [ ] **API 層攔截器**
  - 檔案：`plugins/api.clients.ts`
  - 問題：無全局錯誤攔截（401/403/500）
  - 工時：3 小時

---

## P2 - 中優先級

### 缺少頁面實作

- [ ] **Upload AI Model 頁面** (Figma 3:662)
  - 位置：`pages/ai-models/upload.vue`
  - 功能：模型名稱、檔案上傳、配置、現有模型選擇
  - 工時：4 小時

- [ ] **gNB 頁面** (Figma 3:616)
  - 位置：`pages/projects/[projectId]/gnb.vue`
  - 功能：gNodeB 配置與管理
  - 工時：4 小時

- [ ] **Scenario 頁面** (Figma 3:517)
  - 位置：`pages/projects/[projectId]/scenario.vue`
  - 功能：場景驗測、地圖顯示、小人走動動畫
  - 工時：1 天

- [ ] **Simulation 頁面** (Figma 3:570, 3:582)
  - 位置：`pages/projects/[projectId]/simulation.vue`
  - 功能：模擬設定、資料儲存、已儲存資料列表
  - 工時：1 天

- [ ] **Federal Learning 頁面** (Figma 3:596, 3:604)
  - 位置：`pages/federal-learning/index.vue`, `pages/federal-learning/[modelId].vue`
  - 功能：聯邦學習模型列表與詳情
  - 工時：1 天

### 功能增強

- [ ] **AI Assistant 完整版** (Figma 3:1014)
  - 當前：簡易聊天介面
  - 目標：聊天室列表、新增聊天室、預設問題按鈕
  - 工時：4 小時

- [ ] **Delete Project 確認對話框** (Figma 3:876)
  - 功能：刪除專案二次確認、成功/失敗訊息
  - 工時：2 小時

---

## P3 - 低優先級

### 進階功能

- [ ] **CoTrain (聯合訓練)** (Figma 3:1118, 3:1132)
  - 功能：選擇多個專案進行聯合訓練
  - 工時：1 天

- [ ] **Simulation Data 列表** (Figma 3:1163)
  - 功能：已儲存模擬資料列表與選擇
  - 工時：3 小時

### 長期優化

- [ ] **建立 Component Library**
  - 整理 Button、Form、Dialog 等組件
  - 工時：1 週

- [ ] **Service Worker 實作**
  - 離線支援、資源緩存
  - 工時：3 天

---

## 後端 API 待實作

### AI Models 相關（前端 placeholder 已完成）

| API | 方法 | 說明 | 前端檔案 |
|-----|------|------|---------|
| `/primitive_ai_models/{id}/enable` | PATCH | 啟用/停用模型 | ai-models.vue |
| `/primitive_ai_models/{id}/preview` | GET | 預覽模型資訊 | ai-models.vue |
| `/primitive_ai_models/{id}/pretrain` | POST | 執行預訓練 | ai-models.vue |
| `/primitive_ai_models/{id}/retrain` | POST | 重新訓練 | ai-models.vue |

### 新增需求

| API | 方法 | 說明 | 對應 Figma |
|-----|------|------|-----------|
| `/auth/register` | POST | 用戶註冊 | 3:1042 |
| `/projects` | POST | 建立專案 | 3:785 |
| `/projects/{id}/members` | GET/POST/DELETE | 專案成員管理 | 3:755 |
| `/primitive_ai_models/upload` | POST | 上傳 AI 模型 | 3:662 |
| `/projects/{id}/simulation` | GET/POST | 模擬資料 | 3:570 |
| `/federal-learning/models` | GET | 聯邦學習模型列表 | 3:596 |

---

## 技術債務

### 代碼品質

| 項目 | 數量 | 位置 | 優先級 |
|------|------|------|--------|
| `any` 類型使用 | 32 處 | stores/, pages/ | P1 |
| Console.log | 0 (生產) | 自動移除 | ✅ |
| TODO 註解 | 45 處 | 全域 | P2 |

### 重複代碼

| 項目 | 影響檔案 | 解決方案 | 優先級 |
|------|---------|---------|--------|
| Performance 頁面 | 4 個 | 抽取通用組件 | P2 |
| 地圖初始化 | 已解決 | useMapbox.ts | ✅ |

---

## 測試覆蓋

### E2E 測試現況

| 檔案 | 測試數 | 覆蓋功能 |
|------|--------|---------|
| login.spec.ts | 12 | 登入流程、Figma 對齊 |
| ai-models.spec.ts | 32 | AI 模型管理 |
| projects-list.spec.ts | 29 | 專案列表+地圖 |
| ai-model-evaluation.spec.ts | 11 | 模型評估 |
| navigation.spec.ts | 9 | 導航選單 |
| profile.spec.ts | 10 | 個人資料 |
| performance.spec.ts | 10 | 效能頁面 |
| evaluations.spec.ts | 7 | 評估設定 |
| chat-interface.spec.ts | 4 | AI 助手 |
| **總計** | **114** | - |

### 待新增測試

| 功能 | 預估測試數 |
|------|-----------|
| Register 頁面 | 8 |
| Create Project 頁面 | 12 |
| Project Setting 頁面 | 10 |

---

## 進度追蹤

### 已完成 (Phase 1-6 + 優化 + 安全 + Figma 對齊)

- [x] Phase 1: Login UI
- [x] Phase 2: AI Models 頁面（6 按鈕）
- [x] Phase 3: Profile 頁面
- [x] Phase 4: 導航選單對齊
- [x] Phase 5: AI Model Evaluation 頁面
- [x] Phase 6: Projects List + 地圖佈局
- [x] P0 圖片優化: PNG → WebP (87.5% 節省)
- [x] P0 Code Splitting: THREE.js / Mapbox 獨立 chunks
- [x] P0 安全性: Flask-Login 確認、死代碼清理
- [x] P0 測試環境: Playwright HTTP 設定修復
- [x] P1 Vue Query: staleTime 5 分鐘
- [x] P1 useMapbox: 可重用 composable
- [x] Figma 對齊: Login Accessibility (Copilot Review)

### 進行中

(無)

### 待開始 (Phase 7+)

- [ ] **Phase 7: Register 頁面** (P1)
- [ ] **Phase 8: Create Project 頁面** (P1)
- [ ] **Phase 9: Project Setting 頁面** (P1)
- [ ] Phase 10: Upload AI Model (P2)
- [ ] Phase 11: gNB / Scenario / Simulation (P2)
- [ ] Phase 12: Federal Learning (P2)
- [ ] Phase 13: AI Assistant 完整版 (P3)

---

## 附錄

### 關鍵檔案路徑

```
new/new-frontend/
├── pages/
│   ├── index.vue .................. 專案列表+地圖
│   ├── login.vue .................. 登入
│   ├── register.vue ............... 註冊 (待實作)
│   ├── ai-models.vue .............. AI 模型管理
│   └── projects/[projectId]/
│       ├── ai-model-evaluation.vue
│       ├── setting.vue ............ 專案設定 (待實作)
│       ├── gnb.vue ................ gNB (待實作)
│       ├── scenario.vue ........... 場景 (待實作)
│       ├── simulation.vue ......... 模擬 (待實作)
│       └── config/evaluations.vue
├── tests/e2e/ ..................... E2E 測試 (114 個)
└── playwright.config.ts ........... HTTP localhost 設定
```

### Figma 參考

```
Figma File: DunvlOkbkGlFFpWzZbtvuf
Node 3:407 "Normal user" 包含所有一般用戶頁面設計
關鍵子節點:
- 3:477 Login
- 3:1042 Register
- 3:785/3:814 Create Project
- 3:755 Project Setting
- 3:662 Upload AI Model
```

---

*此文件於 2026-01-14 根據 Figma Node 3:407 深度分析更新。*
