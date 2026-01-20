# 實作計畫 (Implementation Plan)

> 日期：2026-01-06（更新）
> 基於 Explore 階段分析報告，規劃剩餘任務

---

## 一、總覽

### 現況評估

經過完整探索分析，發現 @new/ 版本三大功能區塊已大幅完成：

| 區塊 | 完成度 | 說明 |
|------|--------|------|
| Login/Register | 95% | UI + placeholder 已完成，待後端 API |
| AI Models Actions | 90% | 6 個按鈕已完成，4 個待後端 API |
| Performance Grafana | 100% | 已完成且優於 Legacy |

### 剩餘目標

1. **前端微調**：將 Grafana URL 移至環境變數
2. **後端 API 完成後**：移除 placeholder，接入實際 API

### 原則聲明

**避免過度生成：**
- 只做必要的修改，不擴大範圍
- 不建立多餘的抽象層
- 保持現有程式碼風格

**避免過早抽象：**
- 重複程式碼出現 3 次以上才考慮抽取
- 不建立通用元件，除非確實需要

---

## 二、已完成功能確認

### 已完成 - AI Models 按鈕

以下功能已在 `/frontend/pages/ai-models.vue` 實作完成：

| 按鈕 | 狀態 | 說明 |
|------|------|------|
| 詳細 | ✅ 完成 | Dialog 顯示模型詳情和指標 |
| 編輯 (Update) | ✅ 完成 | Dialog 修改名稱，已接通 PUT API |
| 預覽 (Preview) | ✅ UI 完成 | placeholder handler，待後端 API |
| Pretrain | ✅ UI 完成 | placeholder handler，待後端 API |
| Retrain | ✅ UI 完成 | Dialog + placeholder，待後端 API |
| 刪除 (Delete) | ✅ 完成 | 二次確認 Dialog，已接通 DELETE API |
| 啟用 (Enable) | ✅ UI 完成 | v-switch + placeholder，待後端 API |

### 已完成 - Login/Register

| 功能 | 狀態 | 說明 |
|------|------|------|
| 密碼驗證規則 | ✅ 完成 | 同 Legacy 的 regex |
| 帳號即時檢查 | ✅ UI 完成 | `checkAccountExists` + debounce，待後端 API |
| 信箱即時檢查 | ✅ UI 完成 | `checkEmailExists` + debounce，待後端 API |

### 已完成 - Performance Grafana

| 頁面 | 狀態 | 說明 |
|------|------|------|
| NES | ✅ 完成 | `/pages/performance/nes.vue` |
| MRO | ✅ 完成 | `/pages/performance/mro.vue` |

---

## 三、剩餘 Small CLs 任務清單

### CL-1: Performance - Grafana URL 環境變數化

**目的：** 將硬編碼的 Grafana URL 移至環境變數

**修改檔案：**
- `/frontend/pages/performance/nes.vue`
- `/frontend/pages/performance/mro.vue`
- `/frontend/.env.example`（若存在）

**實作內容：**
1. 在 `nuxt.config.ts` 或 `.env` 新增環境變數
2. 修改頁面讀取環境變數而非硬編碼

**測試策略：**
- 驗證環境變數正確讀取
- 確認 iframe 正常載入

**驗收條件：**
- [ ] Grafana URL 可透過環境變數設定
- [ ] 原有功能不受影響

**回滾方式：**
```bash
git revert <commit-hash>
```

---

---

## 四、待後端 API 完成後的任務

以下任務需等待後端 API 完成後才能實作：

### 後續任務 A: 接入帳號檢查 API

**前置條件：** 後端完成 `GET /auth/check-account?account={account}`

**修改檔案：**
- `/frontend/pages/register.vue`

**實作內容：**
1. 將 `checkAccountExists` 函數從 placeholder 改為實際 API 呼叫
2. 移除 TODO 註解

---

### 後續任務 B: 接入信箱檢查 API

**前置條件：** 後端完成 `GET /auth/check-email?email={email}`

**修改檔案：**
- `/frontend/pages/register.vue`

**實作內容：**
1. 將 `checkEmailExists` 函數從 placeholder 改為實際 API 呼叫
2. 移除 TODO 註解

---

### 後續任務 C: 接入 Enable API

**前置條件：** 後端完成 `PATCH /primitive_ai_models/{id}/enable`

**修改檔案：**
- `/frontend/pages/ai-models.vue`

**實作內容：**
1. 將 `handleToggleEnable` 函數從 placeholder 改為實際 API 呼叫
2. 移除 TODO 註解

---

### 後續任務 D: 接入 Pretrain API

**前置條件：** 後端完成 `POST /primitive_ai_models/{id}/pretrain`

**修改檔案：**
- `/frontend/pages/ai-models.vue`

**實作內容：**
1. 將 `handlePretrain` 函數從 placeholder 改為實際 API 呼叫
2. 移除 TODO 註解

---

### 後續任務 E: 接入 Preview API

**前置條件：** 後端完成 `GET /primitive_ai_models/{id}/preview`

**修改檔案：**
- `/frontend/pages/ai-models.vue`

**實作內容：**
1. 將 `handlePreview` 函數從 placeholder 改為實際 API 呼叫
2. 設計預覽資料的顯示 UI

---

### 後續任務 F: 接入 Retrain API

**前置條件：** 後端完成 `POST /primitive_ai_models/{id}/retrain`

**修改檔案：**
- `/frontend/pages/ai-models.vue`

**實作內容：**
1. 將 `confirmRetrain` 函數從 placeholder 改為實際 API 呼叫
2. 移除 TODO 註解

---

## 五、執行順序

```
當前可執行：
└── CL-1: Grafana URL 環境變數化

待後端 API 完成後：
├── 任務 A: 接入帳號檢查 API
├── 任務 B: 接入信箱檢查 API
├── 任務 C: 接入 Enable API
├── 任務 D: 接入 Pretrain API
├── 任務 E: 接入 Preview API
└── 任務 F: 接入 Retrain API
```

---

## 六、測試覆蓋確認

現有實作已覆蓋以下測試項目：

| 測試項目 | 檔案位置 | 狀態 |
|---------|---------|------|
| 按鈕可用/不可用狀態 | ai-models.vue | ✅ 已有 |
| 點擊後狀態轉移 | ai-models.vue | ✅ 已有 loading 狀態 |
| Delete confirm 流程 | ai-models.vue | ✅ 已實作二次確認 |
| Placeholder 警告顯示 | ai-models.vue, register.vue | ✅ 已實作 Snackbar |
| debounce 驗證 | register.vue | ✅ 已實作 500ms debounce |

---

## 七、風險與緩解

| 風險 | 緩解措施 | 狀態 |
|------|---------|------|
| 後端 API 不存在 | 使用 placeholder handler + TODO 註記 | ✅ 已處理 |
| Grafana 網路不通 | iframe 加 loading/error 處理 | ✅ 已處理 |
| API 規格變更 | placeholder 預留資料契約，但不假造 URL | ✅ 已處理 |

---

## 八、Commit 規範

每個 CL 獨立 commit，格式：
```
feat(performance): move Grafana URL to environment variable

- Add GRAFANA_NES_URL and GRAFANA_MRO_URL to nuxt.config.ts
- Update nes.vue and mro.vue to use runtime config
- Update .env.example with new variables
```

**禁止：**
- emoji
- 混合多個功能
- push 到 remote

---

## 九、結論

經過完整探索分析，發現 @new/ 版本的三大功能區塊已經大幅完成：

1. **Login/Register**：UI 和驗證邏輯完整，即時檢查的 placeholder 已就位
2. **AI Models Actions**：6 個目標按鈕全部完成，其中 2 個已接通 API，4 個有 placeholder
3. **Performance Grafana**：已完成且優於 Legacy（有載入/錯誤處理）

**剩餘工作：**
- 前端：僅需 CL-1（Grafana URL 環境變數化）
- 後端：需開發 6 個 API（帳號檢查、信箱檢查、Enable、Pretrain、Preview、Retrain）

**建議：**
與後端團隊協調 API 開發優先順序，前端可隨時接入。
