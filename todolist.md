# WiSDON Frontend 待辦事項清單

> 產出日期：2026-01-14
> 分析範圍：new/new-frontend/, new_design/, legacy/
> 當前測試數：83 個 E2E 測試通過

---

## 目錄

1. [優先級說明](#優先級說明)
2. [P0 - 緊急項目](#p0---緊急項目)
3. [P1 - 高優先級](#p1---高優先級)
4. [P2 - 中優先級](#p2---中優先級)
5. [P3 - 低優先級](#p3---低優先級)
6. [後端 API 待實作](#後端-api-待實作)
7. [設計與實作差異](#設計與實作差異)
8. [技術債務](#技術債務)
9. [性能優化](#性能優化)
10. [測試覆蓋](#測試覆蓋)

---

## 優先級說明

| 優先級 | 定義 | 建議時程 |
|--------|------|---------|
| **P0** | 影響生產環境、安全性、用戶體驗的緊急問題 | 立即處理 |
| **P1** | 重要功能缺失或品質問題 | 1-2 週內 |
| **P2** | 改進項目，提升開發效率或代碼品質 | 1 個月內 |
| **P3** | 長期優化，技術債務清理 | 季度規劃 |

---

## P0 - 緊急項目

### 性能問題

- [x] **圖片資源優化** ✅ 已完成 (2026-01-13)
  - 轉換 PNG → WebP，7.6MB → 948KB (87.5% 節省)

- [x] **Bundle Code Splitting** ✅ 已完成 (2026-01-14)
  - 檔案：`nuxt.config.ts` 新增 manualChunks 配置
  - 結果：THREE.js (849KB) 和 Mapbox (547KB) 分離成獨立 chunks
  - 效果：不使用地圖/3D 的頁面可節省 ~1.4MB 下載量

- [ ] **進階動態載入** (P3 - 可選優化)
  - 使用 `defineAsyncComponent` 進一步懶加載地圖組件
  - 當前 manualChunks 已提供基本分離，此項為進階優化

### 安全問題

- [x] **Token 儲存方式** ✅ 已修復 (2026-01-14)
  - 檔案：`plugins/api.clients.ts`
  - 發現：系統使用 **Flask-Login session-based 認證**（非 JWT）
  - 狀態：httpOnly cookie 已由 Flask 預設啟用
  - 修復：移除無用的 localStorage 死代碼，啟用 `withCredentials: true`

- [x] **CSRF 防護** ✅ 基本保護已存在
  - 發現：Flask 3.0+ 預設 `SameSite=Lax`，已提供基本 CSRF 防護
  - 狀態：可阻擋第三方網站發起的 POST/PUT/DELETE 請求
  - 待後端：如需完整 CSRF token 機制，後端需安裝 Flask-WTF

---

## P1 - 高優先級

### 代碼品質

- [ ] **TypeScript 類型安全**
  - 檔案：`pages/index.vue`, `stores/assistant.ts`
  - 問題：44 處使用 `any` 類型
  - 解決：定義明確的 interface（Project, User, AIModel）
  - 工時：1 天

- [ ] **錯誤處理不完整**
  - 檔案：`pages/ai-models.vue`
  - 問題：Enable/Preview/Pretrain/Retrain 無實際錯誤處理
  - 解決：為所有 placeholder 添加統一錯誤處理
  - 工時：4 小時

- [ ] **API 層缺少攔截器**
  - 檔案：`plugins/api.clients.ts`
  - 問題：無全局錯誤攔截（401/403/500）
  - 解決：添加 Axios interceptors
  - 工時：3 小時

### 重複代碼

- [ ] **Performance 頁面重構**
  - 檔案：`pages/projects/[projectId]/performance/` (4 個頁面)
  - 問題：nes.vue, mro.vue, ai-model.vue, ran-slice.vue 有 90% 相似代碼
  - 解決：抽取為 `GrafanaPerformance.vue` 通用組件
  - 工時：3 小時

- [ ] **地圖初始化邏輯重複**
  - 檔案：`pages/index.vue`, `pages/projects/[projectId]/config/evaluations.vue`
  - 問題：Mapbox 初始化代碼重複
  - 解決：抽取為 `composables/useMapbox.ts`
  - 工時：4 小時

### Vue Query 配置

- [ ] **全局 staleTime 配置**
  - 檔案：需新建 `plugins/vue-query.ts`
  - 問題：使用默認值（0），導致每次組件掛載都重新請求
  - 解決：設定 5 分鐘 staleTime，關閉 refetchOnWindowFocus
  - 工時：1 小時

---

## P2 - 中優先級

### 功能完善

- [ ] **AI Assistant 整合確認**
  - 檔案：`components/ChatInterface.vue` vs 設計稿 `admin/ai-assistant.vue`
  - 問題：需確認是否符合設計規格（聊天室列表、預設問題）
  - 解決：比對設計稿，補齊缺失功能
  - 工時：1 天

- [ ] **Scenario Overview 頁面結構**
  - 設計：`scenario-overview-outdoor.vue`, `scenario-overview-indoor.vue`
  - 實作：僅有 `overviews.vue`
  - 問題：設計有分頁，實作為單一頁面
  - 解決：確認產品需求，決定是否拆分
  - 工時：需產品確認

- [ ] **選單項目對齊**
  - 設計：`menu-outdoor.vue`, `menu-indoor.vue`
  - 實作：Vuetify Navigation Drawer
  - 問題：需確認所有選單項目已涵蓋
  - 解決：比對設計，補齊缺失項目
  - 工時：2 小時

### 開發體驗

- [ ] **移除 Console.log**
  - 檔案：全域 107 處
  - 問題：生產環境不應有 debug log
  - 解決：設定 Vite build 移除 console，或使用 Logger 服務
  - 工時：2 小時

- [ ] **TODO 註解整理**
  - 檔案：全域 45 處 TODO/PLACEHOLDER
  - 問題：分散的待辦事項難以追蹤
  - 解決：轉移至 issue tracking 系統
  - 工時：2 小時

### 性能優化

- [ ] **Mapbox Marker 更新優化**
  - 檔案：`pages/index.vue:223-277`
  - 問題：每次更新都移除全部 markers 再重建
  - 解決：差分更新，僅處理變化的 markers
  - 工時：3 小時

- [ ] **3D 模型緩存**
  - 檔案：`pages/projects/[projectId]/config/evaluations.vue`
  - 問題：每次進入頁面都重新下載 GLTF 模型
  - 解決：實作模型緩存 composable
  - 工時：4 小時

---

## P3 - 低優先級

### 長期優化

- [ ] **建立 Component Library**
  - 問題：缺乏標準化的通用組件
  - 解決：整理 Button、Form、Dialog 等組件，建立 Storybook
  - 工時：1 週

- [ ] **Service Worker 實作**
  - 問題：無離線支援，資源重複下載
  - 解決：實作 PWA，緩存 Mapbox 樣式和 3D 模型
  - 工時：3 天

- [ ] **虛擬滾動**
  - 檔案：`pages/ai-models.vue`
  - 問題：當模型數量 > 100 時效能下降
  - 解決：使用 vue-virtual-scroller
  - 工時：3 小時

- [ ] **Vuetify 樹搖優化**
  - 問題：Bundle 包含未使用的 Vuetify 組件
  - 解決：配置 Vuetify tree-shaking
  - 工時：2 小時

### 架構改進

- [ ] **API 層重構**
  - 問題：直接使用自動生成的 API 客戶端
  - 解決：為每個模組建立 wrapper service
  - 工時：1 週

- [ ] **狀態管理整理**
  - 問題：Pinia + Vue Query 混用邊界不清
  - 解決：明確定義 client state vs server state 職責
  - 工時：2 天

---

## 後端 API 待實作

### AI Models 相關（前端 placeholder 已完成）

| API | 方法 | 說明 | 前端檔案 |
|-----|------|------|---------|
| `/primitive_ai_models/{id}/enable` | PATCH | 啟用/停用模型 | ai-models.vue:502-530 |
| `/primitive_ai_models/{id}/preview` | GET | 預覽模型資訊 | ai-models.vue:531-560 |
| `/primitive_ai_models/{id}/pretrain` | POST | 執行預訓練 | ai-models.vue:561-587 |
| `/primitive_ai_models/{id}/retrain` | POST | 重新訓練（round, epochs） | ai-models.vue:446-500 |
| `/primitive_ai_models/{id}/version` | PATCH | 版本切換 | ai-models.vue:TBD |

### AI Model Evaluation 相關

| API | 方法 | 說明 | 前端檔案 |
|-----|------|------|---------|
| `/projects/{id}/ai-model-evaluation/inference` | GET | 模型推斷結果 | ai-model-evaluation.vue:74-90 |

### Project 相關

| 欄位/API | 說明 | 影響 |
|----------|------|------|
| `Project.category` | OUTDOOR/INDOOR 分類欄位 | index.vue 目前用奇偶數模擬 |

---

## 設計與實作差異

### 實作優於設計

| 功能 | 設計 | 實作 | 差異 |
|------|------|------|------|
| Login | 基本表單 | 動畫 + 驗證 + 錯誤處理 | 實作更優 |
| Projects List | 靜態圖片 | Mapbox 互動地圖 | 實作更優 |
| AI Models | 3 按鈕 | 6 按鈕 + Modal | 功能更完整 |
| Scenario Overview | Placeholder | 3D 地圖 + Heatmap | 實作遠超設計 |
| Pretrain/Retrain/Preview | 全頁面 | Modal 對話框 | UX 更佳 |

### 設計未實作

| 設計檔案 | 狀態 | 行動 |
|---------|------|------|
| `ai-assistant.vue` | 需確認 | 比對 ChatInterface.vue |
| `scenario-overview-outdoor.vue` | 可能整合 | 確認是否需要獨立頁面 |
| `scenario-overview-indoor.vue` | 可能整合 | 確認是否需要獨立頁面 |
| `menu-outdoor.vue` | 需確認 | 確認選單項目完整性 |
| `menu-indoor.vue` | 需確認 | 確認選單項目完整性 |

---

## 技術債務

### 代碼品質

| 項目 | 數量 | 位置 | 優先級 |
|------|------|------|--------|
| `any` 類型使用 | 44 處 | 全域 | P1 |
| `as any` 強制轉型 | 12 處 | stores/assistant.ts | P1 |
| Console.log | 107 處 | 全域 | P2 |
| TODO 註解 | 45 處 | 全域 | P2 |
| Magic Number | 20+ 處 | 地圖相關 | P3 |

### 重複代碼

| 項目 | 影響檔案 | 解決方案 |
|------|---------|---------|
| Performance 頁面 | 4 個 | 抽取通用組件 |
| 地圖初始化 | 3 個 | 抽取 composable |
| fadeIn 動畫 | 5+ 個 | 移至全域樣式 |

### 缺失項目

| 項目 | 當前狀態 | 建議 |
|------|---------|------|
| 單元測試 | 無 | 為 stores/ 添加 Vitest |
| API Mock | 無 | 建立 MSW mock 層 |
| 錯誤邊界 | 部分 | 完善 ErrorBoundary |
| Loading 狀態 | 部分 | 統一 Loading 組件 |

---

## 性能優化

### Bundle Size 優化

| 項目 | 當前 | 目標 | 節省 |
|------|------|------|------|
| 主 Bundle | 1.5 MB | 500 KB | 67% |
| 圖片資源 | 7.6 MB | 400 KB | 95% |
| 總傳輸 | 8.5 MB | 1.2 MB | 86% |

### Core Web Vitals 目標

| 指標 | 當前（估計） | 目標 | 改善 |
|------|-------------|------|------|
| FCP | 2.5s | 0.9s | -64% |
| LCP | 4.2s | 1.5s | -64% |
| TTI | 5.8s | 2.0s | -66% |

### 優化清單

- [ ] 圖片轉 WebP
- [ ] Code Splitting（Mapbox, THREE.js）
- [ ] 動態載入地圖組件
- [ ] Vue Query staleTime 配置
- [ ] Marker 差分更新
- [ ] 3D 模型緩存
- [ ] Service Worker

---

## 測試覆蓋

### E2E 測試現況

| 檔案 | 測試數 | 覆蓋功能 |
|------|--------|---------|
| login.spec.ts | 4 | 登入流程 |
| ai-models.spec.ts | 32 | AI 模型管理 |
| performance.spec.ts | 10 | 效能頁面 |
| profile.spec.ts | 9 | 個人資料 |
| navigation.spec.ts | 9 | 導航選單 |
| ai-model-evaluation.spec.ts | 11 | 模型評估 |
| projects-list.spec.ts | 17 | 專案列表+地圖 |
| **總計** | **83** | - |

### 測試缺口

| 項目 | 當前 | 需要 |
|------|------|------|
| 單元測試（stores/） | 0 | 至少 20 個 |
| 單元測試（composables/） | 0 | 至少 10 個 |
| API Mock 測試 | 0 | 按模組覆蓋 |
| 視覺回歸測試 | 0 | 關鍵頁面 |

---

## 進度追蹤

### 已完成（Phase 1-6 + 優化 + 安全）

- [x] Phase 1: Login UI
- [x] Phase 2: AI Models 頁面（6 按鈕）
- [x] Phase 3: Profile 頁面
- [x] Phase 4: 導航選單對齊
- [x] Phase 5: AI Model Evaluation 頁面
- [x] Phase 6: Projects List + 地圖佈局
- [x] **P0 圖片優化**: PNG → WebP (7.6MB → 948KB, 87.5% 節省)
- [x] **P1 Vue Query**: 全域 staleTime 5 分鐘，關閉 refetchOnWindowFocus
- [x] **P1 useMapbox**: 建立可重用 composable 減少 5 個檔案的重複代碼
- [x] **P2 console.log**: 生產環境自動移除（保留 error/warn）
- [x] **P1 TypeScript**: index.vue any 類型修復 (9→0)
- [x] **P0 安全**: 確認 Flask-Login session 認證（非 JWT），移除死代碼，httpOnly 已預設啟用
- [x] **P0 CSRF**: 確認 SameSite=Lax 已提供基本防護
- [x] **P0 Code Splitting**: THREE.js (849KB) 和 Mapbox (547KB) 分離成獨立 chunks

### 進行中

(無)

### 待開始

- [ ] P1 TypeScript any 修復 (32 處)
- [ ] P1 Performance 頁面重構（抽取通用組件）
- [ ] P2 功能完善
- [ ] P3 長期優化
- [ ] P3 進階動態載入（defineAsyncComponent）

---

## 附錄

### 關鍵檔案路徑

```
new/new-frontend/
├── pages/
│   ├── index.vue .................. 專案列表+地圖
│   ├── login.vue .................. 登入
│   ├── ai-models.vue .............. AI 模型管理
│   └── projects/[projectId]/
│       ├── ai-model-evaluation.vue
│       ├── overviews.vue .......... 3D 地圖總覽
│       └── config/evaluations.vue . 評估設定
├── stores/
│   ├── user.ts
│   └── assistant.ts
├── plugins/
│   └── api.clients.ts ............. API 客戶端
└── tests/e2e/ ..................... E2E 測試
```

### 設計檔案路徑

```
new_design/
├── wisdON-nuxt-admin-pages/pages/admin/
│   ├── login.vue
│   ├── projects-list.vue
│   ├── ai-model-evaluation.vue
│   ├── ai-assistant.vue
│   ├── pretrain.vue / retrain.vue / preview.vue
│   └── scenario-overview*.vue
└── wisdON-figma-node3-407-export/docs/
    ├── navigation_spec.md
    ├── workflow.md
    └── route_map.md
```

---

*此文件由深度分析 agents 自動產出，請定期更新進度狀態。*
