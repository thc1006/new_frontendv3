# Evaluations 頁面 Figma 設計對齊修復計畫

## 目標
修正 `pages/projects/[projectId]/config/evaluations.vue` 的 UI，使其符合 Figma 設計規範。

## 當前狀況分析

### 現有按鈕（第 116-132 行）
- Add RU （保留）
- Add UE （需改名為 UES SETTINGS）
- RU Position （保留）
- Save RU （需移除，不在 Figma 設計中）
- 缺少：SIMULATION CONFIG 按鈕

### 底部控制列（第 146-171 行）
- 現有：Evaluate, Apply Config, Heatmap dropdown, Show heatmap toggle
- 需調整為：左側（Evaluate, Apply Config）, 中間（Heatmap dropdown, Show heatmap toggle）, 右側（Edit Model toggle）

## 修復任務清單（Small CLs）

### Task 1: Red Phase - 新增測試檔案
**目的**: 建立 E2E 測試，驗證 Figma 設計對齊要求
**修改檔案**: `tests/e2e/evaluations.spec.ts` (新建)
**測試策略**: Playwright E2E，測試按鈕存在性、命名、佈局
**驗收條件**: 測試會失敗（因為 UI 尚未修改）
**回滾方式**: 刪除測試檔案

測試內容：
1. 檢查 SIMULATION CONFIG 按鈕存在
2. 檢查 UES SETTINGS 按鈕存在（不是 Add UE）
3. 檢查 Save RU 按鈕不存在
4. 檢查頂部按鈕水平排列
5. 檢查底部控制列佈局

### Task 2: Green Phase - 修改頂部按鈕佈局
**目的**: 修正頂部按鈕命名和新增缺少的按鈕
**修改檔案**: `pages/projects/[projectId]/config/evaluations.vue`
**測試策略**: 執行 Task 1 測試，確認測試通過
**驗收條件**:
- "Add UE" 改為 "UES SETTINGS"
- 新增 "SIMULATION CONFIG" 按鈕（placeholder handler）
- 移除 "Save RU" 按鈕
- 按鈕水平排列（使用 Flexbox/Grid）

**回滾方式**: git revert

實作細節：
- 重新命名 `addUE` 按鈕文字為 "UES SETTINGS"
- 新增 `simConfigDialog` 狀態變數
- 新增 Simulation Config 對話框（包含 duration, interval, mode, is_full）
- 移除 "Save RU" 按鈕（handleSaveRU 功能保留，但不顯示在 UI）
- 確保按鈕群組水平排列（已在 v-row/v-col 中）

### Task 3: Green Phase - 調整底部控制列佈局
**目的**: 重新排列底部按鈕群組
**修改檔案**: `pages/projects/[projectId]/config/evaluations.vue`
**測試策略**: 執行 Task 1 測試，確認測試通過
**驗收條件**:
- 使用 Flexbox 分為三區：左（Evaluate, Apply Config）、中（Heatmap dropdown, Show heatmap toggle）、右（Edit Model toggle）

**回滾方式**: git revert

實作細節：
- 使用 `v-row` + `v-col` 分為三列
- 左列: `cols="3"` (Evaluate, Apply Config)
- 中列: `cols="6"` (Heatmap dropdown, Show heatmap toggle)
- 右列: `cols="3"` (Edit Model toggle)

### Task 4: Refactor - Boy Scout Rule 清理
**目的**: 清理同檔案內的小問題
**修改檔案**: `pages/projects/[projectId]/config/evaluations.vue`
**測試策略**: 執行所有測試，確保無破壞
**驗收條件**:
- 變數命名一致性檢查
- 移除未使用的註解
- 簡化重複邏輯（如果有）

**回滾方式**: git revert

## 避免過度生成 & 過早抽象

1. 不引入新框架或通用抽象層
2. Simulation Config 對話框只做 placeholder，不連接實際 API
3. 保持現有功能不變，只調整 UI 佈局
4. 不改動地圖、RU、UE 的核心邏輯

## 測試覆蓋範圍

- SIMULATION CONFIG 按鈕可見性
- UES SETTINGS 按鈕可見性
- Save RU 按鈕不可見
- 頂部按鈕水平排列
- 底部控制列三區佈局
- Simulation Config 對話框開啟/關閉
- Simulation Config 欄位存在性

## 執行順序

1. 新增測試檔案（Task 1）
2. 執行測試確認會失敗
3. 修改頂部按鈕（Task 2）
4. 執行測試確認部分通過
5. 調整底部控制列（Task 3）
6. 執行測試確認全部通過
7. 清理代碼（Task 4）
8. 最終測試驗證
9. 本地 commit（不 push）

## Commit 訊息規範

```
test: add E2E tests for Evaluations page Figma alignment

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

```
fix: align Evaluations page UI with Figma design (top buttons)

- Rename "Add UE" to "UES SETTINGS"
- Add "SIMULATION CONFIG" button with placeholder dialog
- Remove "Save RU" button from UI
- Ensure horizontal button layout

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

```
fix: adjust Evaluations page bottom controls layout

- Restructure bottom bar into three sections (left/center/right)
- Left: Evaluate, Apply Config
- Center: Heatmap dropdown, Show heatmap toggle
- Right: Edit Model toggle

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

```
refactor: clean up Evaluations page code (Boy Scout)

- Remove unused comments
- Improve variable naming consistency

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

## TODO for Backend

```typescript
// TODO: 待後端實作 API
PATCH /projects/{id}/simulation-config  → 儲存模擬設定
GET   /projects/{id}/simulation-config  → 取得模擬設定
```

---
