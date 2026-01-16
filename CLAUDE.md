# WiSDON Frontend 待辦事項清單
# 權威文件（必讀，逐字理解）
先完整閱讀並遵循 @new/ 內的工程規範文件：
- @專案軟體工程.md
- @過早抽象錯誤.md


### outdoor
- https://www.figma.com/design/P7bPVphHwCiPDTQGRVcAK3/WiSDON-AI-Platform-GUI-AODT--Copy-?node-id=17-156&m=dev
- https://www.figma.com/design/P7bPVphHwCiPDTQGRVcAK3/WiSDON-AI-Platform-GUI-AODT--Copy-?node-id=186-633&m=dev
- https://www.figma.com/design/P7bPVphHwCiPDTQGRVcAK3/WiSDON-AI-Platform-GUI-AODT--Copy-?node-id=3-2027&m=dev

### indoor
- https://www.figma.com/design/P7bPVphHwCiPDTQGRVcAK3/WiSDON-AI-Platform-GUI-AODT--Copy-?node-id=17-429&m=dev
- https://www.figma.com/design/P7bPVphHwCiPDTQGRVcAK3/WiSDON-AI-Platform-GUI-AODT--Copy-?node-id=17-318&m=dev
- https://www.figma.com/design/P7bPVphHwCiPDTQGRVcAK3/WiSDON-AI-Platform-GUI-AODT--Copy-?node-id=195-3404&m=dev
- https://www.figma.com/design/P7bPVphHwCiPDTQGRVcAK3/WiSDON-AI-Platform-GUI-AODT--Copy-?node-id=17-370&m=dev
- https://www.figma.com/design/P7bPVphHwCiPDTQGRVcAK3/WiSDON-AI-Platform-GUI-AODT--Copy-?node-id=195-3415&m=dev
- https://www.figma.com/design/P7bPVphHwCiPDTQGRVcAK3/WiSDON-AI-Platform-GUI-AODT--Copy-?node-id=195-3445&m=dev
- https://www.figma.com/design/P7bPVphHwCiPDTQGRVcAK3/WiSDON-AI-Platform-GUI-AODT--Copy-?node-id=195-3471&m=dev

若目前缺少對應介接端點或後端能力：先放置 **placeholder（stub + TODO）**，不得硬猜 API，不得編造不存在的 endpoints。

## 實作風格
遵循 TDD Rule、Boy Scout Rule、Small CLs 原則。避免過度生成、過早抽象。
commit 內容遵循 TLDR 但要保留重要資訊，不可有 emoji。

---

# Figma Layer 277:2 (expert) 待實作頁面

## 優先級說明
- P0: 核心功能，必須實作
- P1: 重要功能，應盡快實作
- P2: 次要功能，可延後

## NES Model 系列 (P1)

| 頁面名稱 | Node ID | 狀態 | 說明 |
|---------|---------|------|------|
| NES model Pre-train Running | 277:383 | ✅ 完成 | 訓練進行中 |
| NES model Pre-train Finish | 277:342 | ✅ 完成 | 訓練完成 |
| NES model Review | 277:1286, 277:296 | ✅ 完成 | Review 模式 (場景選擇) |
| NES model Finetune Running | 277:1326 | ✅ 完成 | 微調流程 |
| NES model Finetune Finish | 277:1366 | ✅ 完成 | 微調完成 |
| NES model Upload Dialog | 277:510, 277:1405 | ✅ 完成 | 上傳訓練資料 |
| NES model Enable Mode | 277:1190 | ✅ 完成 | 啟用模式 |
| NES model select init (post-sim) | 277:1472 | 🔴 待實作 | 模擬後選擇 |

## Positioning Model 系列 (P1)

| 頁面名稱 | Node ID | 狀態 | 說明 |
|---------|---------|------|------|
| Positioning model Select | 277:907 | ✅ 完成 | 初始選擇頁面 |
| Positioning model Pre-train Running | 277:824 | ✅ 完成 | 訓練進行中 |
| Positioning model Pre-train Finish | 277:783 | ✅ 完成 | 訓練完成 |
| Positioning model Review | 277:702, 277:599, 277:652 | ✅ 完成 | Review 模式 |
| Positioning model Finetune Running | 277:993 | ✅ 完成 | 微調流程 |
| Positioning model Finetune Finish | 277:1032 | ✅ 完成 | 微調完成 |
| Positioning model Upload Dialog | 277:1070 | ✅ 完成 | 上傳訓練資料 |
| Positioning model Enable Mode | 277:1190 | ✅ 完成 | 啟用模式 |

## POS Model 系列 (P1)

> 注意：POS Model 實際上是 Positioning 模型的不同狀態視圖，已在上方實作完成。

| 頁面名稱 | Node ID | 狀態 | 說明 |
|---------|---------|------|------|
| POS model finetuning | 277:993 | ✅ 完成 | = Positioning Finetune Running |
| POS model finetuning finish | 277:1032 | ✅ 完成 | = Positioning Finetune Finish |
| POS model upload dataset | 277:1070 | ✅ 完成 | = Positioning Upload Dialog |
| POS model Inference | 277:1190 | ✅ 完成 | = Positioning Enable Mode |

## AI-RAN Model 系列 (P2)

| 頁面名稱 | Node ID | 狀態 | 說明 |
|---------|---------|------|------|
| AI-RAN Model menu | 277:1256 | 🔴 待實作 | 主選單 |
| AI-RAN 相關頁面 | 277:1481+ | 🔴 待實作 | 多個子頁面 |

---

# 快速部署指南

## 部署步驟

```bash
cd new/
docker compose build frontend
docker compose up -d
```

## 測試帳號
- 帳號：`admin1`
- 密碼：`admin1`

---

# 關鍵檔案導覽

```
new/new-frontend/
├── pages/
│   ├── login.vue .................. 登入頁面 ✅
│   ├── index.vue .................. 首頁 (專案列表) ✅
│   ├── ai-models.vue .............. AI 模型管理 ✅
│   └── projects/[projectId]/
│       ├── ai-simulator.vue ....... AI 模擬器 ✅
│       ├── scene-deployment.vue ... 場景部署 ✅
│       ├── overviews.vue .......... 總覽 ✅
│       └── ai-model-evaluation.vue  AI 模型評估 ✅
├── tests/e2e/ ..................... E2E 測試 (114+ 個測試)
└── apis/Api.ts .................... 自動生成的 API 客戶端
```

## 測試統計
- 總計：114+ 個 E2E 測試

---

# 待後端實作的 API

```
PATCH /primitive_ai_models/{id}/enable    → 啟用/停用模型
GET   /primitive_ai_models/{id}/preview   → 預覽模型
POST  /primitive_ai_models/{id}/pretrain  → 預訓練
POST  /primitive_ai_models/{id}/retrain   → 重新訓練
GET   /projects/{projectId}/ai-model-evaluation/inference → AI 模型推斷
POST  /ai-simulator/nes/inference         → NES 推斷 (待實作)
POST  /ai-simulator/positioning/inference → Positioning 推斷 (待實作)
POST  /ai-simulator/pos/inference         → POS 推斷 (待實作)
```

---

# 文件歸檔決策記錄

> 最後更新: 2026-01-16

## 已加入版本控制的文件

| 文件 | 說明 | 決策原因 |
|------|------|---------|
| `.gitignore` | Git 忽略規則 | 專案配置，團隊共用 |
| `logo.png` | WiSDON Logo (9KB) | 品牌資產，專案必需 |
| `pages/simulation.vue` | Simulation 頁面 | 有價值的功能代碼 |
| `public/favicon*.png` | 網站圖標 | 專案資產 |
| `tests/e2e/*.spec.ts` | E2E 測試 | 品質保證代碼 |
| `reverse-proxy/ssl/README.md` | SSL 設定說明 | 部署文檔 |

## 已加入 .gitignore 的文件

| 文件/目錄 | 說明 | 決策原因 |
|----------|------|---------|
| `.claude/settings.json` | Claude Code 設定 | 開發工具個人偏好 |
| `reverse-proxy/ssl/*.key` | SSL 私鑰 | **敏感資訊，絕不可提交** |
| `reverse-proxy/ssl/*.pem` | SSL 憑證 | **敏感資訊，絕不可提交** |
| `test-results/` | Playwright 測試結果 | 構建產物，可重新生成 |
| `new_design/` | Figma 導出檔案 (476KB) | 可從 Figma 重新獲取 |

## .gitignore 分類說明

```
# 敏感資訊 - 絕對不可提交
*.key, *.pem, .env

# 構建產物 - 可重新生成
node_modules/, .nuxt/, .output/, test-results/

# 開發工具 - 個人偏好
.claude/settings.json, .idea/, .vscode/

# 設計資源 - 可從源頭重新獲取
new_design/
```
