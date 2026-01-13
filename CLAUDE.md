ultrathink

你是一位資深全端工程師（偏重可維護性、可測試性、可讀性）。你在當前目錄下工作，但是畚機有 docker 和 WSL、kind、NVIDIA GPU 可以讓你做使用。

# 背景與目標
本 repo 有兩個版本：
- @legacy/（第一版本）
- @new/（第二版本，未來主線）

目標：以「第二版本」為主，將第一版本在下列的優點/可用設計，安全地導入第二版本：
- 登入介面（Login UI / flow）
- Porject Configuration's AI Models (bottom) 
- Performance (GUI, Grafana)

然後幫我分析 @new\ (這是 "第二版本" )，目錄底下所有資料夾以及當中的所有程式碼檔案，請不要漏掉任何一個檔案的任何一個字或是數字等關鍵資訊，請先對這個專案庫有所了解。

由於我們 "第二版本" 的部分功能要進行重構，希望可以將上方提到的 "第一版本" 的優點來導入進入 "第二版本" 當中。由於未來目前 "第一版本" 和 "第二版本" 都已經串接好了相關的介面，但是可能那些我們希望從 "第一版本" 導入進入 "第二版本" 的串接的部分無法完全 cover 因此這部分需要你幫我仔細一步一步分析，由於未來都是主要以 "第二版本" 為主，因此如果當前將 "第一版本" 的功能導入進入 "第二版本" 沒有相對應的介接端點，那就請幫我先放置 placeholder。

> 若第二版本目前缺少對應介接端點或後端能力：先放置 **placeholder（stub + TODO）**，不得硬猜 API，不得編造不存在的 endpoints。

針對上面提到的當前的 "第一版本" 當中的 Porject Configuration's AI Models (bottom) 的部分，由於目前針對 Porject Configuration's AI Models (bottom) 可能只有 Retrain 或是 Pretrain 功能按鈕，而我們最終希望有這些按鈕 (bottom: Pretrain, Preview, Enable, Retrain, Update, delete)因此我需要你幫我設計最棒的前端 UI 設計；而針對介接的部分，如果沒有相對應的介接端點，那就請幫我先放置 placeholder。

由於未來都是主要以 "第二版本" 為主，因此也請務必對齊 "第二版本" 的實務脈絡，因此需要你幫我看看 "第二版本"（包含程式碼的寫作習慣和風格、程式碼寫作邏輯、開發套件管理的方式、開發檔案結構的習慣）來進行實作。

# 權威文件（必讀，逐字理解）
先完整閱讀並遵循 @new/ 內的工程規範文件：
- @專案軟體工程.md
- @過早抽象錯誤.md
若兩份文件的規範與我這份指令衝突，以上述 .md 為準（但仍需回報衝突點與你的取捨理由）。

# 工作流程（必須照順序）
你必須採用「先探索 → 再規劃 → 再動手 → 小步提交」的方式工作：
A) Explore（只讀，不改碼）
   - 盤點 @legacy/ 與 @new/：列出關鍵檔案清單（含路徑），標註每一塊功能的進入點（routes/pages/components/services）。
   - 為三個目標區塊（login / AI Models actions / performance）各寫一段「現況摘要」：
     * @legacy/ 怎麼做、優點是什麼
     * @new/ 目前怎麼做、缺口是什麼
     * 可移植/不可移植的原因
   - 任何不確定之處：用 ripgrep / 專案內搜尋 / 讀碼確認，不可臆測。


B) Plan（先寫計畫，再寫 code）
   - 產出一份「修復/重構計畫」(Markdown)：
     1. 里程碑切分為多個小任務（Small CLs）：每個任務只做一件事、可獨立驗證、保持 build 綠燈。
     2. 每個任務都要有：目的、修改檔案、測試策略、驗收條件、回滾方式。
     3. 明確列出 placeholder 的位置與 TODO 內容（包含預期資料契約/介面，但不可假造實際 URL/端點）。
   - 明確標註：如何避免「過度生成」與「過早抽象」（例如：先在現有結構內完成最小可行改動；避免新增通用框架/過度抽象層；沒有重複使用點就不要抽介面）。

C) Implement（TDD + Boy Scout + Debug by logs）
   - 全程遵守：
     - TDD：優先寫測試（或測試用驗收機制）→ 確認會 fail → 再寫最少量實作讓它 pass → 必要時才 refactor。
     - Boy Scout：每次改動順手清理「同檔案內」的一個小問題（命名/小重複/小可讀性），但不得把重構擴散成大改。
     - Debug：遇到 bug 只能用 log / stack trace / 最小重現步驟逐步定位，不可猜。
   - 針對「Project Configuration → AI Models（bottom actions）」：
     - 最終 UI actions 必須包含：Pretrain, Preview, Enable, Retrain, Update, Delete
     - 設計原則：
       1) 視覺/元件風格必須對齊 @new/ 現有設計系統與寫法（先找出 @new/ 的 UI 元件庫/樣式策略/狀態管理方式再做）。
       2) Actions 需有明確狀態：idle / running / success / error（至少）。
       3) Delete 必須有二次確認（confirm）。
       4) 若無後端端點：按鈕先接到 placeholder handler（顯示「尚未接上」+ 記錄 TODO），不可靜默無反應。
     - 測試：至少要覆蓋
       * 按鈕可用/不可用狀態（disabled 條件）
       * 點擊後狀態轉移（loading → success/error 的 UI 反應；placeholder 也算）
       * Delete confirm 流程

D) Commit（僅允許本地提交；嚴禁 push）
   - 嚴格 Small CLs：一次提交只做一個小任務、可獨立驗證、不要混雜多件事。
   - 每個 commit 前必做：
     1) 跑對應測試/檢查（依 @new/ 的規範）
     2) 自我 code review：快速掃 diff，確認沒有多餘改動
   - commit message 規範：
     - TL;DR 第一行摘要 + 必要細節（保留重要資訊）
     - 不可使用 emoji
   - 無論任何階段：都不可以 push。

# 產出物（每完成一階段就更新）
1) 一份 docs/ 或 notes/ 下的分析報告（Explore 結果 + 檔案導覽 + 三大區塊差異）
2) 一份可執行的實作計畫（Plan）
3) 依計畫逐步完成實作與測試（Implement），並保持每一步都可驗證

# 其他硬性規範
- 程式碼命名要一致、自然、可讀（不要在不同檔案做出多個同功能函式）。
- 註解使用「台灣繁體中文口語邏輯」，且註解總量不得大於程式碼本身。
- 不要引入炫技語法或不必要的新框架/新工具；除非 @new/ 現況已在用。
- 不可在輸出或程式碼中出現任何與「Claude / Anthropic」相關的文字或提示。

## 實作風格
針對前面的實作設計" 我需要你幫我規劃修復計畫，針對修復計畫，請務必整合 "TDD Rule" 和 "Boy Scout Rule" 或是 "Small CLs"（不清楚就請上網查詢這些軟體開發的觀念和原則）。同時，請特別註記不可以出現生成 AI 常見的低級錯誤 "過度生成"、"過早抽象"，另外，也不可以出現任何與 claude 和 anthropic 有關的內容或是訊息。

進行實作時，計畫當中設計的 TDD 原則請你務必都要進行實作（所有的任務都要實作），不能有任何的任務被 SKIPED，通通都要 implementation。同時，程式碼的檔案的變量和變數命名，不要像是 AI 生成的異常完美，要像是人類撰寫的，實作時要確保有清晰的邏輯，同時請務必保持程式碼自然，不要讓人看出是 AI 生成，也請務必遵循 Code Readability，記住代碼是寫給人看的，所以要有自然的代碼流程（無論在任何階段通通不可以 push）。同時註解要用台灣的繁體中文口語邏輯還進行撰寫，程式碼的註解不得比程式碼本身還長。請注意決定不行在不需要的地方強行使用最新的炫技語法，同時不要一直嘗試 Refactor ，要保持專案程式碼的命名一致性，不要在不同檔案定義了五（數個）一樣功能的函數。同時，當遇到　BUG 時間，解決 BUG 的方式應該是一步一步的分析 Log 或 Stack Trace。

commit 內容遵循 TLDR 但要保留重要資訊，同時不可以有 emoji。

---

# 當前實作狀態 (2026-01-13 更新)

## 已完成功能

### 1. Login UI (100%)
- 檔案：`new/new-frontend/pages/login.vue`
- 完整的登入流程：帳號/密碼輸入、表單驗證、錯誤處理、成功跳轉
- E2E 測試：`new/new-frontend/tests/e2e/login.spec.ts` (4 個測試)

### 2. AI Models 頁面 (前端 100%，後端 API 部分完成)
- 檔案：`new/new-frontend/pages/ai-models.vue`
- 6 個按鈕實作狀態：

| 按鈕 | 前端 UI | 後端 API | 狀態 |
|------|---------|----------|------|
| Pretrain | ✅ | ❌ | Placeholder (含結果模態視窗) |
| Preview | ✅ | ❌ | Placeholder (含預覽模態視窗) |
| Enable/Disable | ✅ | ❌ | Placeholder |
| Retrain | ✅ | ❌ | Placeholder (有完整對話框) |
| Update | ✅ | ✅ | 完成 |
| Delete | ✅ | ✅ | 完成 (有二次確認) |

- 版本選擇器：可選擇不同模型版本
- 按鈕狀態優化：根據模型狀態動態顯示/禁用
- E2E 測試：`new/new-frontend/tests/e2e/ai-models.spec.ts` (32 個測試)

### 3. Performance 頁面 (100%)
- NES：`new/new-frontend/pages/projects/[projectId]/performance/nes.vue`
- MRO：`new/new-frontend/pages/projects/[projectId]/performance/mro.vue`
- AI Model：`new/new-frontend/pages/projects/[projectId]/performance/ai-model.vue`
- Ran Slice：`new/new-frontend/pages/projects/[projectId]/performance/ran-slice.vue`
- Grafana URL 已環境變數化
- E2E 測試：`new/new-frontend/tests/e2e/performance.spec.ts` (10 個測試)

### 4. Profile 頁面 (100%)
- 檔案：`new/new-frontend/pages/profile.vue`
- 顯示用戶資訊：帳號、電子郵件、角色、建立日期
- 修改密碼功能：含驗證（密碼長度、密碼一致性）
- E2E 測試：`new/new-frontend/tests/e2e/profile.spec.ts` (9 個測試)

### 5. 導航選單對齊 (100%)
- 檔案：`new/new-frontend/layouts/default.vue`
- Performance 子選單新增：AI Model Performance、RAN Slice Performance
- E2E 測試：`new/new-frontend/tests/e2e/navigation.spec.ts` (9 個測試)
- 設計規範：`new_design/wisdON-figma-node3-407-export/docs/navigation_spec.md`

## PR 狀態
- PR #1：已合併 (Phase 1 AI Models 增強)
- PR #2：已合併 (Phase 3 Profile 頁面)
- PR #3：待審核 (Phase 4 導航選單) - https://github.com/thc1006/new_frontendv3/pull/3

## 待後端實作的 API

```
PATCH /primitive_ai_models/{id}/enable    → 啟用/停用模型
GET   /primitive_ai_models/{id}/preview   → 預覽模型
POST  /primitive_ai_models/{id}/pretrain  → 預訓練
POST  /primitive_ai_models/{id}/retrain   → 重新訓練 (需 round, epochs 參數)
```

---

# 快速部署指南

## 前置需求
- Docker & Docker Compose
- 確保 port 80 可用

## 部署步驟

```bash
# 1. 進入專案目錄
cd new/

# 2. 建立前端 Docker image
docker compose build frontend

# 3. 啟動所有服務
docker compose up -d

# 4. 驗證部署 (可選)
cd new-frontend && npx playwright test
```

## 環境變數 (new/new-frontend/.env)

```bash
# API 設定
NUXT_PUBLIC_API_BASE=/api

# Logo 樣式 (WiSDON | TFN)
NUXT_PUBLIC_LOGO_STYLE=WiSDON

# Grafana Dashboard URLs
NUXT_PUBLIC_GRAFANA_NES_URL=http://140.113.144.121:2982/d/adkys2aoyeqkgf/nes
NUXT_PUBLIC_GRAFANA_MRO_URL=http://140.113.144.121:2982/d/bdl9s0tm6mebkf/mro

# 地圖服務 (離線模式用)
NUXT_PUBLIC_IS_ONLINE=true
NUXT_PUBLIC_NOMINATIM_API_URL=http://nominatim:8080/search
NUXT_PUBLIC_OFFLINE_MAPBOX_GL_JS_URL=http://127.0.0.1/tiles/styles/basic-preview/style.json
```

## 測試帳號
- 帳號：`admin1`
- 密碼：`admin1`

---

# 關鍵檔案導覽

```
new/new-frontend/
├── pages/
│   ├── login.vue .................. 登入頁面
│   ├── index.vue .................. 首頁 (專案列表)
│   ├── profile.vue ................ 個人資料頁面
│   ├── ai-models.vue .............. AI 模型管理
│   └── projects/[projectId]/
│       ├── performance/
│       │   ├── nes.vue ............ NES Grafana
│       │   ├── mro.vue ............ MRO Grafana
│       │   ├── ai-model.vue ....... AI 模型效能 Grafana
│       │   └── ran-slice.vue ...... Ran Slice 效能 Grafana
│       └── config/
│           └── evaluations.vue .... 評估設定
├── layouts/
│   └── default.vue ................ 主佈局 (含導航選單)
├── apis/
│   └── Api.ts ..................... 自動生成的 API 客戶端
├── stores/
│   └── user.ts .................... 使用者狀態管理
├── tests/e2e/
│   ├── login.spec.ts .............. 登入測試 (4)
│   ├── ai-models.spec.ts .......... AI 模型測試 (32)
│   ├── performance.spec.ts ........ 效能頁面測試 (10)
│   ├── profile.spec.ts ............ 個人資料測試 (9)
│   └── navigation.spec.ts ......... 導航選單測試 (9)
├── nuxt.config.ts ................. Nuxt 設定 (含環境變數)
└── .env ........................... 環境變數
```

# 設計規範文件

```
new_design/
├── wisdON-figma-node3-407-export/
│   └── docs/
│       ├── navigation_spec.md ..... 導航/選單規範
│       ├── workflow.md ............ 工作流程規範
│       └── route_map.md ........... 路由對應
└── wisdON-nuxt-admin-pages/
    └── pages/admin/
        ├── pretrain.vue ........... Pretrain 結果模態設計
        ├── preview.vue ............ Preview 模態設計
        └── menu-*.vue ............. 選單設計
```