把當前的 repo 通通以 k8s container 的方式來佈署到當前的 host 本機上面，一定要用 Kubernetes 一定要用 Kubernetes 和 Kubernetes 的 container 來進行相關的工具或是套件的佈署。請注意 我只需要佈署 前端 前端在這台電腦上面喔   。

絕對無敵禁止使用 docker 絕對不能使用 docekr

臨時權限密碼：mbwcl711

同時我需要你先 ultrathink 深度掃描當前的這台工作站 來幫我針對硬體來對我們的開發環境進行最佳化的所有設定。

我們當前 192.168.0.229:443 對應到外網的 140.113.144.123:8881
我們當前 192.168.0.229:22 對應到外網的 140.113.144.123:8880


HPA 要 mongoDB

---

## 待處理任務 (Pending Tasks)

### ⏳ 資料夾重整 (Folder Restructuring) - 未完成

**目標：** 依照軟體工程最佳實踐重新命名資料夾並歸納檔案

**待執行項目：**
- [ ] 評估 `new/new-frontend` 是否應該重命名為 `frontend` 或扁平化結構
- [ ] 檢查所有 import 路徑的相依性
- [ ] 確保 K8s 部署配置中的路徑正確
- [ ] 更新所有相關的 CI/CD 配置
- [ ] 驗證所有功能在重整後正常運作

**注意事項：**
- 移動檔案前必須確保相依性問題已解決
- 確保路徑不受影響，所有 function 仍可正常呼叫
- 需要全面測試以確認無破壞性變更

---

## 後端 API 端點文檔

### K8s 網路配置

| 服務 | ClusterIP Port | 說明 |
|------|----------------|------|
| frontend-service | 80 | 前端 Nuxt3 服務 |
| backend | 8000 | 後端 Flask API |
| nginx | 80, 443 | 反向代理與 SSL 終止 |

**Nginx 路由規則:**
- `/api/*` → `http://backend:8000` (去除 `/api` 前綴)
- `/*` → `http://frontend-service:80`

### 認證 API (Authentication)

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/auth/register` | 用戶註冊 |
| POST | `/auth/login` | 用戶登入 |
| POST | `/auth/logout` | 用戶登出 |

### 用戶 API (Users)

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/users` | 取得所有用戶列表 |
| GET | `/users/me` | 取得當前登入用戶資訊 |
| GET | `/users/<user_id>` | 取得特定用戶 |
| PUT | `/users/<user_id>` | 更新用戶資訊 |
| DELETE | `/users/<user_id>` | 刪除用戶 |
| GET | `/projects/<project_id>/users` | 取得專案中的用戶 |

### 專案 API (Projects)

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/projects` | 取得所有專案 |
| POST | `/projects` | 建立新專案 |
| GET | `/projects/<project_id>` | 取得特定專案 |
| PUT | `/projects/<project_id>` | 更新專案 |
| DELETE | `/projects/<project_id>` | 刪除專案 |
| GET | `/projects/me` | 取得當前用戶的專案 |
| GET | `/users/<user_id>/projects` | 取得特定用戶的專案 |
| GET | `/projects/<project_id>/status` | 取得專案狀態 |
| PUT | `/projects/<project_id>/status/rsrp` | 更新 RSRP 狀態 |
| PUT | `/projects/<project_id>/status/throughput` | 更新 Throughput 狀態 |
| PUT | `/projects/<project_id>/status/rsrp_dt` | 更新 RSRP DT 狀態 |
| PUT | `/projects/<project_id>/status/throughput_dt` | 更新 Throughput DT 狀態 |
| GET | `/projects/<project_id>/rsrp` | 取得 RSRP 熱力圖資料 |
| POST | `/projects/<project_id>/rsrp` | 上傳 RSRP 資料 |
| GET | `/projects/<project_id>/throughput` | 取得 Throughput 資料 |
| POST | `/projects/<project_id>/throughput` | 上傳 Throughput 資料 |
| GET | `/projects/<project_id>/rsrp_dt` | 取得 RSRP DT 資料 |
| POST | `/projects/<project_id>/rsrp_dt` | 上傳 RSRP DT 資料 |
| GET | `/projects/<project_id>/throughput_dt` | 取得 Throughput DT 資料 |
| POST | `/projects/<project_id>/throughput_dt` | 上傳 Throughput DT 資料 |
| PUT | `/projects/<project_id>/map_correction` | 地圖校正 |
| GET | `/projects/<project_id>/deploy/<evaluation_id>` | 部署評估 |

### 用戶專案關聯 API (UserProject)

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/user_projects/<user_id>/<project_id>` | 取得用戶專案關聯 |
| GET | `/user_projects/<project_id>/role` | 取得用戶在專案中的角色 |

### 評估 API (Evaluations)

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/evaluations` | 取得所有評估 |
| POST | `/evaluations` | 建立評估 |
| GET | `/evaluations/<evaluation_id>` | 取得特定評估 |
| PUT | `/evaluations/<evaluation_id>` | 更新評估 |
| DELETE | `/evaluations/<evaluation_id>` | 刪除評估 |
| POST | `/evaluations/reset-status` | 重置狀態 |
| GET | `/projects/<project_id>/evaluations` | 取得專案的評估列表 |
| GET | `/evaluations/<evaluation_id>/rsrp` | 取得評估 RSRP |
| GET | `/evaluations/<evaluation_id>/throughput` | 取得評估 Throughput |
| GET | `/evaluations/<evaluation_id>/rsrp_dt` | 取得評估 RSRP DT |
| GET | `/evaluations/<evaluation_id>/throughput_dt` | 取得評估 Throughput DT |
| POST | `/evaluations/rsrp` | 上傳 RSRP |
| POST | `/evaluations/throughput` | 上傳 Throughput |
| POST | `/evaluations/rsrp_dt` | 上傳 RSRP DT |
| POST | `/evaluations/throughput_dt` | 上傳 Throughput DT |
| PUT | `/evaluations/<evaluation_id>/status/rsrp` | 更新 RSRP 狀態 |
| PUT | `/evaluations/<evaluation_id>/status/throughput` | 更新 Throughput 狀態 |
| PUT | `/evaluations/<evaluation_id>/status/rsrp_dt` | 更新 RSRP DT 狀態 |
| PUT | `/evaluations/<evaluation_id>/status/throughputDT` | 更新 Throughput DT 狀態 |
| POST | `/evaluations/rsrp/failed` | RSRP 失敗回報 |
| POST | `/evaluations/throughput/failed` | Throughput 失敗回報 |
| POST | `/evaluations/rsrp_dt/failed` | RSRP DT 失敗回報 |
| POST | `/evaluations/throughput_dt/failed` | Throughput DT 失敗回報 |
| POST | `/evaluations/<evaluation_id>/discard` | 丟棄評估 |

### RU API (Radio Unit)

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/rus` | 取得所有 RU |
| POST | `/rus` | 建立 RU |
| GET | `/rus/<RU_id>` | 取得特定 RU |
| PUT | `/rus/<RU_id>` | 更新 RU |
| DELETE | `/rus/<RU_id>` | 刪除 RU |
| GET | `/projects/<project_id>/rus` | 取得專案中的 RU |
| PUT | `/rus/<ruid>/location` | 更新 RU 位置 |

### DU API (Distributed Unit)

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/dus` | 取得所有 DU |
| POST | `/dus` | 建立 DU |
| GET | `/dus/<DU_id>` | 取得特定 DU |
| PUT | `/dus/<DU_id>` | 更新 DU |
| DELETE | `/dus/<DU_id>` | 刪除 DU |
| GET | `/projects/<project_id>/dus` | 取得專案中的 DU |

### CU API (Central Unit)

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/cus` | 取得所有 CU |
| POST | `/cus` | 建立 CU |
| GET | `/cus/<CU_id>` | 取得特定 CU |
| PUT | `/cus/<CU_id>` | 更新 CU |
| DELETE | `/cus/<CU_id>` | 刪除 CU |
| GET | `/projects/<project_id>/cus` | 取得專案中的 CU |

### RU Cache API

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/rucaches` | 取得所有 RU Cache |
| GET | `/rucaches/<RU_id>` | 取得特定 RU Cache |
| GET | `/evaluations/<evaluation_id>/ru_cache` | 取得評估的 RU Cache |
| PUT | `/ru_cache/<RU_id>/location` | 更新 RU Cache 位置 |

### AI Model API

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/ai_models` | 取得所有 AI 模型 |
| POST | `/ai_models` | 建立 AI 模型 |
| GET | `/ai_models/<AI_model_id>` | 取得特定 AI 模型 |
| PUT | `/ai_models/<AI_model_id>` | 更新 AI 模型 |
| DELETE | `/ai_models/<AI_model_id>` | 刪除 AI 模型 |
| GET | `/projects/<project_id>/ai_models` | 取得專案的 AI 模型 |
| POST | `/ai_models/<AI_model_id>/activate` | 啟用模型 |
| POST | `/ai_models/<AI_model_id>/deactivate` | 停用模型 |
| POST | `/ai_models/<AI_model_id>/start-training` | 開始訓練 |
| POST | `/ai_models/<AI_model_id>/stop-training` | 停止訓練 |
| POST | `/ai_models/<AI_model_id>/enable-update` | 啟用更新 |
| POST | `/ai_models/<AI_model_id>/disable-update` | 停用更新 |

### DT AI Model API

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/dt_ai_models` | 取得所有 DT AI 模型 |
| GET | `/dt_ai_models/<model_ID_for_DT>` | 取得特定 DT AI 模型 |

### Primitive AI Model API

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/primitive_ai_models` | 取得所有 Primitive AI 模型 |
| POST | `/primitive_ai_models` | 建立模型 |
| GET | `/primitive_ai_models/<model_id>` | 取得特定模型 |
| PUT | `/primitive_ai_models/<model_id>` | 更新模型 |
| DELETE | `/primitive_ai_models/<model_id>` | 刪除模型 |

### Primitive DT AI Model API

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/primitive_dt_ai_models` | 取得所有模型 |
| GET | `/primitive_dt_ai_models/<model_id>` | 取得特定模型 |

### Map API

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/maps` | 取得所有地圖 |
| POST | `/maps` | 建立地圖 |
| GET | `/maps/<map_id>` | 取得特定地圖 |
| PUT | `/maps/<map_id>` | 更新地圖 |
| DELETE | `/maps/<map_id>` | 刪除地圖 |
| GET | `/projects/<project_id>/maps_aodt` | 取得專案的 AODT 地圖 |
| GET | `/projects/<project_id>/maps_frontend` | 取得專案的前端地圖 |
| POST | `/projects/<project_id>/maps` | 建立專案地圖 |
| GET | `/Map_Position/<id>` | 取得地圖位置 |

### Brand API

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/brands` | 取得所有品牌 |
| POST | `/brands` | 建立品牌 |
| GET | `/brands/<brand_id>` | 取得特定品牌 |
| PUT | `/brands/<brand_id>` | 更新品牌 |
| DELETE | `/brands/<brand_id>` | 刪除品牌 |

### Brand Metrics API

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/brand_metrics/unique-names` | 取得唯一名稱列表 |

### Abstract Metrics API

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/abstract_metrics` | 取得所有抽象指標 |
| POST | `/abstract_metrics` | 建立抽象指標 |
| GET | `/abstract_metrics/<metrics_id>` | 取得特定指標 |
| PUT | `/abstract_metrics/<metrics_id>` | 更新指標 |
| DELETE | `/abstract_metrics/<metrics_id>` | 刪除指標 |

### AODT API (Autonomous O-RAN Digital Twin)

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/aodt/delete-file` | 刪除檔案 |
| POST | `/aodt/create-files` | 建立檔案 |
| POST | `/aodt/connect` | 連接 AODT |
| POST | `/aodt/open-stage` | 開啟階段 |
| POST | `/aodt/simulation-config` | 模擬配置 |
| POST | `/aodt/ru/create` | 建立 RU |
| POST | `/aodt/du/create` | 建立 DU |
| POST | `/aodt/ru/set-direction` | 設定 RU 方向 |
| DELETE | `/aodt/ru/delete-all` | 刪除所有 RU |
| DELETE | `/aodt/du/delete-all` | 刪除所有 DU |
| POST | `/aodt/du/auto-assign` | 自動分配 DU |
| GET | `/aodt/status` | 取得 AODT 狀態 |
| GET | `/aodt/test-api-endpoints` | 測試 API 端點 |
| POST | `/aodt/ru/create-batch` | 批量建立 RU |
| POST | `/aodt/du/create-batch` | 批量建立 DU |
| POST | `/aodt/ues/create-direct` | 直接建立 UE |
| GET | `/aodt/generate-ue-mobility` | 生成 UE 移動性 |
| POST | `/aodt/start-simulation` | 開始模擬 |
| GET | `/aodt/simulation_progress` | 取得模擬進度 |
| GET | `/aodt/workflow/is_sim_running` | 檢查模擬是否運行中 |
| POST | `/aodt/panel/create` | 建立面板 |
| POST | `/aodt/panel/create-batch` | 批量建立面板 |
| GET | `/aodt/panel/check-config` | 檢查面板配置 |
| GET | `/aodt/panel/count` | 取得面板數量 |
| POST | `/aodt/workflow/start` | 開始工作流程 |
| POST | `/aodt/workflow/throughput` | Throughput 工作流程 |
| GET | `/aodt/workflow/result/<task_id>` | 取得工作流程結果 |
| POST | `/aodt/restart` | 重啟 AODT |
| POST | `/aodt/ru/update-properties` | 更新 RU 屬性 |
| GET | `/aodt/ru/properties/<ru_path>` | 取得 RU 屬性 |

### Digital Twin API (DT)

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/netDT/<evaluation_id>` | 網路 DT |
| POST | `/ranDT/<evaluation_id>` | RAN DT |

### Chat Session API

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/projects/<project_id>/chat_sessions` | 建立聊天會話 |
| GET | `/projects/<project_id>/chat_sessions` | 取得專案的聊天會話 |
| PUT | `/chat_sessions/<session_id>` | 更新聊天會話 |
| DELETE | `/chat_sessions/<session_id>` | 刪除聊天會話 |
| POST | `/chat_sessions/<session_id>/messages` | 發送訊息 |
| GET | `/chat_sessions/<session_id>/messages` | 取得訊息歷史 |

### MinIO API

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/minio/ensure_bucket` | 確保 bucket 存在 |
| POST | `/minio/upload_json` | 上傳 JSON |
| POST | `/minio/get_json` | 取得 JSON |
| POST | `/minio/delete_object` | 刪除物件 |

### Geocode API

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/search` | 地址搜尋 (Nominatim) |

### gNB Status API

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/gnb_status` | 取得 gNB 狀態 |

---

**BaseURL (預設):** `http://127.0.0.1:8000`
**Swagger 文檔:** `/apidocs/`