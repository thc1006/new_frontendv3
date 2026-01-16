# WiSDON Frontend 待辦清單

> 基於 Figma Layer 277:2 (expert) 的深度分析
> 更新日期：2026-01-16

---

## 已完成頁面 ✅

| 頁面 | 前端檔案 | Figma Node | 狀態 |
|------|---------|------------|------|
| Login | `pages/login.vue` | 277:201 | ✅ 完全符合 |
| Projects List | `pages/index.vue` | 277:154 | ✅ 完全符合 |
| Overview (OUTDOOR) | `pages/projects/[projectId]/overviews.vue` | 277:11, 277:64 | ✅ 符合 |
| Overview (INDOOR) | `overviews.vue` (projectType=INDOOR) | 17:318 | ✅ 完全符合 |
| Scene Deployment | `pages/projects/[projectId]/scene-deployment.vue` | 277:24 | ✅ 已修復 |
| AI Simulator Menu | `pages/projects/[projectId]/ai-simulator.vue` | 277:952 | ✅ 完全符合 |
| NES Model Select | `ai-simulator.vue` (selectedModel=nes) | 277:465 | ✅ 完全符合 |
| NES Pre-train Running | `ai-simulator.vue` | 277:383 | ✅ 完全符合 |
| NES Pre-train Finish | `ai-simulator.vue` | 277:342 | ✅ 完全符合 |
| Positioning Model Select | `ai-simulator.vue` (selectedModel=positioning) | 277:907 | ✅ 完全符合 |
| Positioning Pre-train Running | `ai-simulator.vue` | 277:824 | ✅ 完全符合 |
| Positioning Pre-train Finish | `ai-simulator.vue` | 277:783 | ✅ 完全符合 |
| Positioning Review Initial | `ai-simulator.vue` (posReviewMode=true) | 277:702 | ✅ 完全符合 |
| Positioning Review with Path | `ai-simulator.vue` | 277:599, 277:652 | ✅ 完全符合 |
| Positioning Finetune Running | `ai-simulator.vue` (posFinetuneStatus=running) | 277:993 | ✅ 完全符合 |
| Positioning Finetune Finish | `ai-simulator.vue` (posFinetuneStatus=finish) | 277:1032 | ✅ 完全符合 |
| Positioning Enable Mode | `ai-simulator.vue` (posEnableMode=true) | 277:1190 | ✅ 完全符合 |
| NES Review Mode | `ai-simulator.vue` (nesReviewMode=true) | 277:1286, 277:296 | ✅ 完全符合 |
| NES Finetune Running | `ai-simulator.vue` (nesFinetuneStatus=running) | 277:1326 | ✅ 完全符合 |
| NES Finetune Finish | `ai-simulator.vue` (nesFinetuneStatus=finish) | 277:1366 | ✅ 完全符合 |
| NES Upload Dialog | `ai-simulator.vue` (showNesUploadDialog=true) | 277:510, 277:1405 | ✅ 完全符合 |
| NES Enable Mode | `ai-simulator.vue` (nesEnableMode=true) | 277:1190 | ✅ 完全符合 |
| NES Dashboard | `ai-simulator.vue` (nesDashboardMode=true) | 277:1526, 277:1561 | ✅ 完全符合 |
| Positioning Upload Dialog | `ai-simulator.vue` (showPosUploadDialog=true) | 277:1070 | ✅ 完全符合 |
| AI-RAN Applications | `pages/projects/[projectId]/ai-ran.vue` | 277:1256 | ✅ 完全符合 |
| AI-RAN NES Finetune | `ai-ran.vue` (selectedModel=nes) | 277:1486, 277:1597 | ✅ 完全符合 |
| AI-RAN POS Finetune | `ai-ran.vue` (selectedModel=positioning) | 277:993, 277:1032 | ✅ 完全符合 |

---

## 待實作頁面

### P1 優先級 - NES Model 系列

| 頁面名稱 | Figma Node | 說明 | 預估工作量 |
|---------|------------|------|-----------|
| NES model select init (post-sim) | 277:1472 | 模擬後選擇頁面 | 中 |

### P1 優先級 - Positioning Model 系列

| 頁面名稱 | Figma Node | 說明 | 預估工作量 |
|---------|------------|------|-----------|
| ~~Positioning model Pre-train upload~~ | 277:741 | ✅ 已實作 (showPosUploadDialog) | - |

### P1 優先級 - POS Model 系列

> 注意：POS Model 實際上是 Positioning 模型的不同狀態視圖，已在 Positioning Finetune/Enable 中實作完成。

| 頁面名稱 | Figma Node | 說明 | 狀態 |
|---------|------------|------|------|
| POS model finetuning | 277:993 | ✅ = Positioning Finetune Running | 已完成 |
| POS model finetuning finish | 277:1032 | ✅ = Positioning Finetune Finish | 已完成 |
| POS model upload dataset | 277:1070 | ✅ = Positioning Upload Dialog | 已完成 |
| POS model Inference (2) | 277:1190 | ✅ = Positioning Enable Mode | 已完成 |

### P2 優先級 - AI-RAN Model 系列

> AI-RAN Applications 是獨立頁面，與 AI Simulator 差異：無警告橫幅、"Project" 標題、Model 下拉選單。

| 頁面名稱 | Figma Node | 說明 | 狀態 |
|---------|------------|------|------|
| AI-RAN Applications 主頁 | 277:1256 | ✅ `ai-ran.vue` 獨立頁面 | 已完成 |
| AI-RAN NES Finetune | 277:1486, 277:1597 | ✅ NES Model 控制面板 + Training Charts | 已完成 |
| AI-RAN Positioning | 277:1481+ | Positioning 控制面板 (基礎) | 已完成 |

---

## 實作建議

### 優先順序
1. 先完成 Positioning Model 系列 (與 NES 結構相似，可複用邏輯)
2. 再完成 POS Model 系列
3. 最後實作 AI-RAN Model 系列

### 共用組件建議
- **TrainingChart**: 訓練過程圖表 (Reward/Loss) - 已在 NES 實作
- **ModelSelect**: 模型選擇下拉選單
- **StatusBadge**: 狀態標籤 (running/finish/idle)
- **UploadDialog**: 上傳資料對話框

### 後端 API 需求
```
POST /ai-simulator/positioning/pretrain/start
POST /ai-simulator/positioning/pretrain/stop
GET  /ai-simulator/positioning/pretrain/status
POST /ai-simulator/positioning/inference
POST /ai-simulator/pos/finetuning/start
GET  /ai-simulator/pos/finetuning/status
POST /ai-simulator/pos/inference
```

---

## 變更記錄

| 日期 | 變更內容 |
|------|---------|
| 2026-01-16 | 建立待辦清單，基於 Figma Layer 277:2 分析 |
| 2026-01-16 | 修復 Scene Deployment 標題字體 (48px) 和色標位置 (垂直) |
| 2026-01-16 | 實作 Positioning Model 系列頁面 (select, pre-train running/finish) |
| 2026-01-16 | 實作 Positioning Review 模式 (Add Path, UE/Path 圖例, 路徑視覺化) |
| 2026-01-16 | 實作 Positioning Finetune/Enable 系列頁面 (finetune running/finish, enable mode) |
| 2026-01-16 | 實作 NES Review 模式 (場景選擇, gNB/UE markers, heatmap 控制) |
| 2026-01-16 | 實作 NES Finetune 系列頁面 (finetune running/finish, upload dialog, enable mode) |
| 2026-01-16 | 實作 Positioning Upload 對話框 (showPosUploadDialog), POS Model 系列標記為已完成 |
| 2026-01-16 | 實作 NES Dashboard 模式 (nesDashboardMode), AI-RAN Model 系列部分標記為已完成 |
| 2026-01-16 | 新增 AI-RAN Applications 獨立頁面 (ai-ran.vue)，包含 Model List、NES Finetune、Training Charts |
| 2026-01-16 | 實作 POS RAN Model (AI-RAN Positioning)，MSE Loss 雙線圖表 (training/validation) |
| 2026-01-16 | 實作 INDOOR Overview 頁面對齊 (Node 17:318)，專案類型偵測、地圖縮放/俯仰角調整 |
