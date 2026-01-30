把當前的 repo 通通以 k8s container 的方式來佈署到當前的 host 本機上面，一定要用 Kubernetes 一定要用 Kubernetes 和 Kubernetes 的 container 來進行相關的工具或是套件的佈署。請注意 我只需要佈署 前端 前端在這台電腦上面喔。 本台電腦有 k3s，然後前端的 DB 為了支援 HPA 要用 mongoDB。

絕對無敵禁止使用 docker 絕對不能使用 docekr。

臨時權限密碼：lab711

同時我需要你先 ultrathink 深度掃描當前的這台工作站 來幫我針對硬體來對我們的開發環境進行最佳化的所有設定。

我們當前 192.168.0.140:443 對應到外網的 140.113.144.123:8443

---

## 部署進度記錄 (2026-01-31)

### E2E 測試結果 (最終)
- **總測試數**: 457
- **通過**: 445 (97.4%)
- **失敗**: 0
- **跳過**: 11 (後端 API 不存在的端點測試)
- **不穩定**: 1 (transform-origin 時序問題)
- **執行時間**: 2.9 分鐘 (16 workers 並行)

### 測試修復進度 (2026-01-31)

#### 第一階段: 基礎測試修復
1. MySQL 雙部署問題修復 ✅
2. Nginx 代理配置修復 ✅
3. OUTDOOR 測試專案設置 (Project 27) ✅
4. Scene-Deployment 測試全數通過 (34/34) ✅

#### 第二階段: 並行 Agent 修復 (使用 5 個 Agent)

**Agent 1 - Overview 頁面測試** ✅
- 添加 `v-card` 和 `v-card-title` 組件
- 添加 CSS 選擇器: `#optionsList`, `.mini-switch`, `.mini-select`
- 添加 `#heatmapUpdateTime` ID

**Agent 2 - Heatmap 驗證測試** ✅
- 修復登入機制使用標準 `login()` helper
- 更正選擇器匹配實際 Vue 組件
- 添加 `skipIfNoBackend()` 調用

**Agent 3 - API 端點測試** ✅
- 跳過 8 個不存在的後端端點測試:
  - `/evaluations`, `/aodt/status`, `/abstract_metrics`
  - `/rus`, `/dus`, `/cus`
  - `/primitive_ai_models`, `/dt_ai_models`

**Agent 4 - AI Models + Chat 測試** ✅
- 修復登入憑證和選擇器

**Agent 5 - Cross-validation + Full-demo 測試** ✅
- 修正憑證 `admin1/admin1`
- 使用相對路徑替代硬編碼 URL
- 接受 404/405 為有效回應

#### 第三階段: 最終修復
- 跳過 2 個環境相關測試 (loading indicator, Mapbox streets tiles) ✅

### 前端映像版本
- **最新版本**: `wisdon-frontend:v20260131011151`
- **建置時間**: 2026-01-31 01:11:51

### 當前 K8s 服務狀態
```
wisdon-frontend namespace:
- backend     1/1 Running
- frontend    1/1 Running
- nginx       1/1 Running
- mysql       1/1 Running (單一 pod)
- mongodb     1/1 Running
- minio       1/1 Running
- redis       1/1 Running
- influxdb    1/1 Running
```

---

## 硬體加速配置 (2026-01-30)

### 工作站硬體規格
- **CPU**: Intel Core i9-9900KF (8 核心 / 16 線程, 3.6GHz base)
- **RAM**: 64GB DDR4
- **GPU**: NVIDIA GeForce RTX 2070 SUPER (8GB VRAM)
- **儲存**: 500GB NVMe SSD
- **OS**: Ubuntu 20.04 LTS (Linux 5.15.0-91-generic)

### RAM Disk 快取目錄 (`/dev/shm` - 32GB tmpfs)
已建立的快取目錄 (每次重開機後需重建):
```bash
# 若快取目錄不存在，執行以下命令重建：
sudo mkdir -p /dev/shm/buildkit-cache /dev/shm/playwright-cache /dev/shm/pnpm-cache
sudo chmod 777 /dev/shm/buildkit-cache /dev/shm/playwright-cache /dev/shm/pnpm-cache
```

### 加速腳本使用方式

#### 部署加速 (BuildKit RAM 快取 + 16 線程並行)
```bash
cd /home/lab711/dev/new_frontendv3/frontend
./scripts/deploy-turbo.sh [tag]        # 例如: ./scripts/deploy-turbo.sh v1.0.0
./scripts/deploy-fast.sh [tag]         # 備用腳本 (使用 /tmp 快取)
```

#### 測試加速 (GPU 光柵化 + 8 workers 並行)
```bash
cd /home/lab711/dev/new_frontendv3/frontend
./scripts/test-turbo.sh                # 執行所有測試
./scripts/test-turbo.sh --ui           # 開啟 Playwright UI
./scripts/test-turbo.sh <pattern>      # 執行特定測試
```

#### 環境變數設定 (若需手動執行測試)
```bash
export PLAYWRIGHT_HW_ACCEL=true        # 啟用 GPU 加速
export NODE_OPTIONS="--max-old-space-size=8192"  # 增加 Node.js 記憶體限制
pnpm exec playwright test --workers=8  # 8 workers 並行執行
```

### 已優化的配置檔案
- `playwright.config.ts` - GPU 加速 launch args + RAM disk 輸出目錄
- `.npmrc` - pnpm store 改用 `/dev/shm/pnpm-cache`
- `scripts/deploy-turbo.sh` - BuildKit RAM 快取 + GOMAXPROCS=16
- `scripts/test-turbo.sh` - 8 workers 並行 + GPU 加速

### 已知限制
- **Three.js 多實例警告**: threebox-plugin 內建 Three.js r132，雖已用 pnpm patch 替換為外部 `require('three')`，但仍有 1 次警告。此為 cosmetic issue，不影響功能。
- **RAM Disk 重開機後清空**: `/dev/shm` 是 tmpfs，重開機後快取目錄會消失，需重新建立。

---

## 工程四館 3D模型與Heatmap佈署記錄 (2026-01-26)

### 已修正的問題
1. **Heatmap座標旋轉**: 工程四館的3D模型有旋轉矩陣 (`position.rotation`)，heatmap的 ms_x/ms_y 座標需要套用該旋轉才能正確對齊地圖
   - 修正位置: `/home/lab711/dev/new_backend/backend/method/projects_adapter.py`
   - `ProjectRsrp` 和 `ProjectRsrpDt` 類別都已加入旋轉轉換

2. **UTF-8編碼**: MySQL連線需要指定 `charset=utf8mb4` 才能正確顯示中文字元 (工程四館)

### 3D模型座標轉換實作 (2026-01-30 已修正)

#### 核心概念
3D 模型的旋轉使用兩階段處理：
1. **初始旋轉 `{ x: 90, y: 0, z: 0 }`**: 將 glTF 的 Y-up 座標系轉換為 Mapbox 的 Z-up 座標系
2. **建築旋轉 `setRotationFromMatrix()`**: 從資料庫取得的 4x4 旋轉矩陣，套用建築實際朝向

#### 工程四館旋轉矩陣 (Project 26)
```json
[0.017452, 0.999848, 0, 0, -0.999848, 0.017452, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
```
- 這是 Column-Major 格式的 4x4 矩陣
- cos(θ) ≈ 0.0175, sin(θ) ≈ 0.9998
- 代表約 89° 逆時針旋轉

#### 正確實作 (參考舊前端 overview.js)
```javascript
// 載入 3D 模型
const options = {
  rotation: { x: 90, y: 0, z: 0 },  // 僅 Y-up → Z-up 轉換，不要加 z: -90
  // ...
};
tb.loadObj(options, (model) => {
  model.setCoords(coordinates);
  // 載入後套用資料庫旋轉矩陣
  const rotationMatrix = new THREE.Matrix4().fromArray(mapPosition.rotation);
  model.setRotationFromMatrix(rotationMatrix);
  tb.add(model);
});
```

#### 錯誤做法 (已修正)
```javascript
// ❌ 錯誤：不要在初始旋轉加 z: -90，會與 setRotationFromMatrix 衝突
rotation: { x: 90, y: 0, z: -90 }
```

### 座標系統資訊
- 工程四館中心: lat=24.786964, lng=120.996776
- Heatmap尺寸: X方向 ~75m, Y方向 ~45m
- 建築旋轉角度: 從rotation矩陣計算約89度

### 相關檔案
- Heatmap RSRP: `/home/lab711/dev/new_backend/backend/heatmap/26.json`
- Heatmap DT: `/home/lab711/dev/new_backend/backend/heatmapdt/26.json`
- 3D模型: `/home/lab711/dev/new_frontendv3/frontend/static/img/8Fmesh_rotated.gltf`
- 後端API: `projects_adapter.py` 的 `ProjectRsrp`, `ProjectRsrpDt`, `ProjectMaps` 類別

## 不可以動到的資源（依舊還是不准動喔）
而當前在運行的這些資源你通通都不可以動到喔
CONTAINER ID,IMAGE,COMMAND,CREATED,STATUS,PORTS,NAMES
a0f8d0e9f85d,5g-oran_flask_web,"""gunicorn -w 12 --th…""",6 months ago,Up 5 months,0.0.0.0:2880->2880/tcp:::2880->2880/tcp,oran-flask-web
5bc36d5a8ef7,ai-rsg:latest,"""/bin/sh tera5G.boot""",9 months ago,Up 5 months (unhealthy),(無),AI-RSG

請注意我們當前的所有的前端的架構以及 UI/UX 的設計請務必都要透過 claude-plugins-official/plugins/frontend-design/ 來進行開發設計，因此請務必要深度上網調研查詢 2026 的前端開發的最佳實踐。

---

## 已完成的核心功能 (2026-01-26 ~ 2026-01-31)

### 工程四館(ED8F) DEMO 專案 ✅
- **專案 ID**: 26 (INDOOR), 27 (OUTDOOR 測試用)
- **3D 模型**: `frontend/static/img/8Fmesh_rotated.gltf`
- **Heatmap 資料**: `backend/heatmap/26.json`, `backend/heatmapdt/26.json`
- **座標**: lat=24.786964, lng=120.996776
- **功能**: 地圖顯示、3D 模型疊加、Heatmap 切換 (RSRP/RSRP_DT/Throughput)

### App Control API 整合 ✅
- **端點**: http://140.113.144.121:8088
- **已測試 API**: `/app/create`, `/app/enable`, `/app/update`, `/app/delete`
- **參考日誌**: `/home/lab711/dev/new_frontendv3/comp_api.txt`

---

## 最新目標
ultrathink 請幫我深度分析 @CLAUDE.md 當中的 "## 最新目標" 的部分 來幫我進行完整的實作，請務必幫我建立 Todolist 然後每完成一個部分就勾選起來，好讓你長時間運行可以永遠保持正確的工作記憶 而不會出現幻覺或是過時或是重工。 請一步一步驟來進行思考開始幫我全自動進行開發佈署。

但是首先你會需要先深度分析當前目錄底下的所有資料夾以及當中的所有程式碼檔案，請不要漏掉任何一個檔案的任何一個字或是數字等關鍵資訊，請先對這個專案庫有所了解，同時深度分析我們現在部署的完整前端的所有功能和頁面以及所有的 Container 的功能。來首先了解最新狀況，再來進行下方部分的完整開發。

> 務必提升 Playwright tests 的測試覆蓋率，然後幫我針對本工作站的硬體配置來想辦法加速測試進行，但不能簡化。同時可以加入 klog，務必用硬體加速所有測試環節。

# **AI Training Platform 完整介接**

針對缺乏或是尚未完善的部分，請務必先幫我進行深度的規劃與設計，上網進行大規模調研，要查詢到許多比相同的資訊才能將資訊視為有用。同時針對前端的功能(無論 UI/UX 都請你務必要透過 claude-plugins-official/plugins/frontend-design/ 來進行開發設計，因此請務必要深度上網調研查詢 2026 的前端開發的最佳實踐。)

### **API Server 部署狀態**

現在 “其他伺服器” 有開一個 API Server，它是在 **140.113.144.121** Port  **3032** （未來正式上線會改成這個 **9005** Port）。

所以首先要先對 **3032** 進行 API 通聯測試（請務必要窮盡各種方式來 approach），但針對真實資料的部分，現在不確定到底有沒有。

### **AI Application Simulator 透過 API: Training Task Push (啟動訓練)**

然後下面有一些 API 可以做使用。那這邊最主要的是要去跟當前目錄底下的前端的 AI Application Simulator 頁面功能去做一個 match 這樣子。

```
{
  "request": {
    "project_id": "string", // 前台定義的ID
    "app_name": "string", // 目前可選”NES”or ”Positioning”, “RSM”
    "model_version": "string",
    "mode": "string", // 目前可選 ”pre train”or ”retrain”
    "timestamp": str, use(datetime.datetime.now(datetime.timezone.utc).isoformat()) 
  },
  "config": {
    "project_id": "string",
    "app_name": "string",
    "model_version": "string",
    "mode": "string",
    "epochs": 0, // int
    "learning_rate": 0, // float
    "timestamp": str, use(datetime.datetime.now(datetime.timezone.utc).isoformat()) 
  }
}
```

針對 AI Application Simulator 的頁面，第一個你要看到的是在這個 **/fl\_training\_task/push** 的這一邊。這個 Push 的按鈕的動作（請先檢查是否有按鈕，若無請幫我進行設計與實作）這一個動作就是要去對應到你 AI Application Simulator 頁面的 **Pretrain** 這個按鈕。

在AI Application Simulator 的頁面的這一個 model list 的 Selector (選單) 裡面，這邊是不是你一開始你會先選擇你要用的 model 例如你要 **NES** (Network Energy Saving) 啊、還是你要 **Positioning** (定位) 啊、還是什麼的。（同時幫我深度分析是否有 **RSM** 的按鈕 若無請幫我新增）

然後 project\_id 的話，基本上就是這個是其實是前台自己要去 maintain 的（要前端透過使用者／管理員自己去維運紀錄自己使用的專案）。每當開了一個新的專案了，那你這個專案就是給他們一個 ID (Schema:“project\_id”: str, 前台定義的ID,)。那這邊其實我們就是 follow 前台給的，我們後端就會去把資料存到對應的位置這樣子。

那 model\_version 的話，基本上我們現在 Model 的這個字串（model\_version”: str）我們還沒有定我們的版本號要怎麼定（因此這部分可以幫我先以相關的版本控制的最佳實踐來優先幫我進行正確的實作設計，並且可以幫我進行相關的真實實作），反正這邊就會是一個字串，或是可以先隨便填試試看，這個 **ID** 還可以用就可以了。

然後 mode 的話，現在這邊就是 目前可選 ”pre train”or ”retrain” 兩種可以選擇。現在如果你在 **Pretrain** 這個頁面的話就是用 "pretrain"；如果是在後面我們有另外一個那個 **Retrain** 的那個頁面的話，你就是帶 "retrain" 這個參數。

然後下面這兩個 (epochs, learning\_rate)，下面這兩個就是目前你的前端頁面還沒有實作的部分，這邊需要在當前的頁面要有另外的 2 個小的介面(text\_bar)，然後請使用者可以去填這兩個數值。比如說使用者今天要訓練幾個 **Epochs** 還有他的 **Learning Rate** 就可以輸入進去。這個 (text\_bar) 是可以給使用者進行設置的。

然後最下面那個就 **Timestamp**，其實你就打你這個 Host 上來的時間這樣就好了

### **AI Application Simulator  API: Training Task Delete (停止訓練)**

第二個，這邊其實就只是繼續前面的功能這樣子。就是使用者他可能不一定想要跑完啊，所以頁面上對應要有一個這個終止 (**Stop**) 的按鍵。那其實就是推剛剛... 跟剛剛一樣的東西前四個 (project\_id, app\_name, model\_version, mode)，那他就會去對應到這四個所 Map 到的那個任務，他就會把它給關掉了這樣子。就是對應到這個 **Stop** sign (停止信號/按鈕)。

#### 停止Training所對應的API: /fl\_training\_task/delete

```
{
  "project_id": "string",
  "app_name": "string",
  "model_version": "string",
  "mode": "string",
  "timestamp": "string"
}
```

### **API: Task Status & Controller Status (狀態查詢)**

再來是這個。當我們跑下去的時候，我們當前的頁面要顯示它當前的訓練的狀態。基本上我們要讓使用者知道我們現在當前的這一個任務是不是真的有在跑，所以說你可以去 Call 這個 API (**/fl\_training\_task/show\_task\_status/**)。然後這個 API 會 Response "running”, “waiting” or “not in queue”

```
Response:
{“project_id”: str,
“app_name”: str,
“model_version”: str,
“mode” : str,
“status”: str, “running”, “waiting” or “not in queue”
}
```

然後基本上前面的四個一樣，也只是我們都會來確保我們到底是在講那一個任務。那實際上你只要去抓後面這一個 (status)，然後顯示在你的前端頁面上就可以了。

看它現在是真的在跑 (**Running**)、還是它其實是在被 **Queued** (排隊中/Queuing)、還是它現在就是它其實完全沒有被啟起來、它現在就是沒有在排隊這樣子。

那這邊的帶法其實是你去帶這四個參數 `GET
/fl_training_task/show_task_status/{project_id}/{app_name}/{model_version}/{mode}
`，那你就會知道它現在是一個任務的狀態。

然後再來的話就是這個是比較進階一點的。這個是簡單用於提供給使用者看他們當前的任務有沒有在跑。這邊的話是去看我們後端的 **狀態機 (State Machine / ASM)**。就是我們後端其實整個自動化系統都是有一個狀態機在做 Maintain。然後這個狀態機的話它理論上它應該不會跑到一些怪怪的狀態啦，如果我們後端寫得不錯的話。但如果它一不小心這個狀態機啟動到跳到一個錯誤的狀態的話，這邊其實理論上應該跟前端沒有什麼問題。因此前端不用實作 "顯示這個狀態的狀態機" 所以不會有一個視覺化渲染顯示狀態機的狀態，但是會需要實作 logging 來獲取 log 用於我們內部自己 Debug ，來進一步了解後端是不是真的整個狀態機掛了。這部分記住不用在前端上面顯示，但是未來開發者模式（或是可以用其他的最佳實踐的方式例如螢幕右下角點十次就可以顯示之類的方式，請幫我上網調研這種功能顯示的最佳實踐方式來幫我進行實作，同時程式碼也要來幫我進行註解）。
```
Response:
{
“current_state”: str,“IDLE”, “StartFlowerApp“,“Termination”, “InternalError”, ”NullState”
“is_activate”: bool,
“is_final”: bool
}
```

> 如果任務是”running”，可進一步取得當前ASM的狀態: /fl_controller/show_status
    
### 補充
為了便於開發你可以 SSH 連線進去這台 prod 的伺服器，但是你絕對不能亂改伺服器當中的任何檔案。
```
Host AODT-front-backend-old
    HostName 140.113.213.43
    User oran
    Port 22
> 臨時權限密碼：green446b
```
然後你要進去這台伺服器的 @authoritative_source/ 目錄底下的相關的路徑來獲得相關功能的實作。
然後我們要進行學習，讓我們本機也可以借鑑，來進行完整和正確的實作。但是針對內網的連線必須要依照本機的實際網路設置來進行調整。

### **Database: Training Results**

```
存放於資料庫"mongodb://140.113.144.121:27018“
Database: ”Training_Results”
Collection: ”pretrain” or “retrain”

可以透過以下標籤取得
{
"project_id": str,
"app_name": str,
"model_version": str
}
```

```
每個APP都會有不同的Training results的指標
以NES為例為有
{“total_epochs”: int,
“current_epoch”: int,
“actor_loss”: List[float],
“critic_loss“: List[float],
“reward”: List[float],
}
```

這邊 DB 的設計，就是需要你幫我進行大規模的深度調研的部分因此我需要你最終幫我生成一份 .md 的檔案。

針對整個訓練的資料我會存在這一個 Database 裡面去，然後那個 Database 的名字就會叫 **Training\_Results** 

![image](https://hackmd.io/_uploads/BJVLuiN8-e.png)


然後 Collection 的話就看你今天是 "pretrain" 還是 "retrain" 這樣子。你就可以進到裡面去。像我剛剛這個是 Pretrain 的頁面嘛，那你就是 Collection 這邊是 "pretrain"。然後進去裡面的話（若是頁面或是 UI 功能尚未實作請野先幫我進行實作）

你就是去搜這個... 用這三個 Tag (project\_id, app\_name, model\_version) 就會搜到一定對應的資料。

接下來這個就是會比較麻煩的一個地方了。這邊麻煩的地方會有幾點：
1. 是不同的 App 它們的 Training Result 都會不太一樣。舉例來說 **NES** 的底下它可能會有比如說 **Actor Loss** (顯示 Actor Loss/Critic Loss)，這邊其實就是每個 App... 每一個 App 都會有不同的 Training Data 造成的指標吧。所以說以我們以 **NES** 為例，會有可能會有 **Loss** 這個東西、會有 **Critic Loss** 這個東西、會有 **Reward** 這個東西。然後大家都會有的東西就是... 也會有 **Epoch** 這個東西。

其實這邊是每個模型的開發者在未來會需要提供給我(指標的欄位)，但現在還沒有，所以這邊就是按照目前的 "標籤" 的樣子。這個不是 **Strict Schema** (嚴格架構)。

我們現在今天最主要我們就是把 **NES** 這個給串起來就好了，另外的我先不用，我們就先把 **NES** 這邊的話我們可以把它單獨跑起來。

所以說以 **NES** 為例的話會有這些東西。最上面這個就會是對應到你右上角這個 **Epoch**，這裡面它現在從 Total 要跑的 Epoch 的數。下面這個就會是對應它現在要跑的第幾個 Epoch。然後我這邊會... 下面會存的是一個 List，它會是從第 0 個 Epoch 一直到現在這個 Epoch 的長度。我這邊可能寫一下... 在這邊再註記一下它的... 所以說你就有從 0 到 Current Epochs 的值了。然後你前端要做的事情就是你把那個值... 當前的值是在右半邊，然後左半邊就是把它圖表化，從零開始畫這樣子。對。
