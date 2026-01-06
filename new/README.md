# 5G-ORAN

請詳盡閱讀後再嘗試進行服務的部屬。

## 環境設定

遇到開發問題請先檢查前後端的module有沒有更新到最新以及.env檔案有沒有更動，資料庫則需要確定有沒有migrate到最新。

### Backend
為了要讓Intelisense可以動，請確保本地環境有`backend/requirements.txt`裡面的套件。
建議可以使用miniconda弄個虛擬環境，然後安裝套件。
```
cd ./backend
pip install -r requirements.txt
```

首先先去後端把`.env.example`複製一份成`.env`，然後修改裡面的設定。

如果openapi有更新，要在`/backend`底下執行以下指令，更新前端使用的api function：
```bash
# 你最好檢查一下你的改動在`/new-frontend/apis/Api.ts`底面看起來是不是正常的，如果function的名字有動，幫前端換一下，如果行為有改要通知前端幫忙修。
npx swagger-typescript-api generate -p ./openapi.yml -o ../new-frontend/apis --axios --module-name-first-tag
```

### OSS-fetcher

把oss-fetcher資料夾裡面的`.env.example`複製一份成`.env`，然後修改裡面的設定。

### Frontend (Nuxt.js)

讓Intelisense可以動，請先安裝VSCode的Vue的插件，含後進入`/new-frontend`資料夾，然後執行以下指令：

```bash
npm install
```

把`.env.example`複製一份成`.env`，然後修改裡面的設定。

```bash
# 前端的設定，請視情況修改
NUXT_PUBLIC_API_BASE=http://127.0.0.1/api # 使用openapi生成的TS來呼叫後端API，這個是後端的API base URL。在production你需要輸入實際server的IP:port。
NUXT_PUBLIC_NOMINATIM_API_URL=https://nominatim.openstreetmap.org/search
```

### linting

linting可以統一大家的格式，避免在git compare的時候因為格式問題多出干擾的行數。

在commit之前請確保跑過了下面的指令：
Frontend:
```
npm run lint # 在 /new-frontend 資料夾下
```

Backend:
```
prospector . # 在 /backend 資料夾下
```

GitHub上使用的是一個更寬鬆的prospector，如果你只是想要過workflow的話，可以使用下面的指令：
```
prospector --without-tool pylint
```

Note: 
 - 目前前端沒有東西，開始call APIs以後要接入環境參數（`.env`）。

### Grafana

本地的Grafana需要複製`grafana.ini.example`成`grafana.ini`。然後compose up就會跟著起來了。

### Docker Compose 

開發前要先把seeder所需要的資料解壓縮。
```bash
cd backend/seeds/map_seed_files/
tar -xJvf map_seed_files.tar.xz
```
壓縮的指令是這個：
```bash
tar -cJvf map_seed_files.tar.xz *.gltf *.usd
```

Docker compose 也有自己的`.env`需要設定，與先前相同，把`.env.example`複製成`.env`，然後修改裡面的設定。

```bash
NGROK_AUTHTOKEN= # Change to your own token. 可以自己上ngrok官網註冊一個帳號，這是用來開發時候讓計算實體有個返回資料的(IP:port)可以用。
COMPOSE_PROFILES= # optional，填入"no-internet"可以讓服務在沒有網路的環境下運作，會在本地建立起原來需要網路服務的本地服務，例如Nominatim。
```

啟動前後端＋DB：
```bash
docker compose -f docker-compose.new.dev.yml up --build --watch
```

下掉containers:
```bash
docker compose -f docker-compose.new.dev.yml down
docker compose -f docker-compose.new.dev.yml down -v # 帶著volumes一起下去，會把DB的資料重置。
```

清空volumes並重啟MySQL、Grafana、MinIO：
```bash
docker-compose -f docker-compose.new.dev.yml down -v mysql grafana minio minio-init && docker-compose -f docker-compose.new.dev.yml up -d mysql grafana minio minio-init
```

#### reverse-proxy

有個reverse-proxy的container會把`127.0.0.1`自動轉發到前端、`127.0.0.1/api/*`轉發到後端並把`/api`去除，所以前面的nuxt設定才要填`127.0.0.1/api`。

前端開發請連：`127.0.0.1`
後端在：`127.0.0.1:8000`
當然你後端想打`127.0.0.1/api/*`也是可以的。
Swagger在：`127.0.0.1:8000/apidocs`
當然你後端想打`127.0.0.1/api/apidocs`也是可以的，openapi.yml的server url要改。


### Production Docker Compose

再進行部屬時個個服務的帳好密碼以及加密用的密鑰或種子這種screte都不能用開發時的簡單設定，這裡有一個腳本可以自動生成高強度的scretes。
每次執行這個腳本都會把設定洗掉，所以務必將每次生成以後真的有部屬的scretes記錄下來。不然你可能會進不去你的資料庫。

```bash
./scripts/init_secrets.sh
```

生成完以後你還需要去設定個個服務的`.env`裡面關於連線的設定，這些在上方都有描述。

使用指令建立乾淨的production環境：
```bash
docker compose build --no-cache
```

```bash
docker compose up
```

重啟
```bash
docker compose restart
```

把所有的container都下掉並清空volumes：
```bash
docker compose down -v # !!!注意!!! 這會把所有的資料都清掉。
```

docker compose up 以後你還需要執行下一個段落的指令來建立資料庫的schema和注入初始資料。

### Migration

初始化MySQL schema
```
flask db upgrade # at /backend
```

重置MySQL
```
flask db downgrade base 
flask db upgrade
```

後端如果有更新model的話，要建立新的migration：
```
flask db migrate -m "your message" # at /backend
```

### Seeder

如果要seed測試用的資料，請執行：
```bash
docker exec -t 5g-oran-backend-1 flask seed run
```

### Note

- Nominatim的服務若由本地提供，第一次啟動會花很久的時間在下載資料，請耐心等候。

# 使用者登入紀錄

使用者登入的記錄位於/backend/logs/login_logger.log

# 記錄方式
紀錄的方式是使用python的logging套件
紀錄的程式在/backend/controllers/auth_api.py
如果想要更改紀錄的format，請進入auth_api.py

```auth_api.py
#修改這行
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
```
#相關的attribute: https://docs.python.org/3/library/logging.html#logrecord-attributes 


如果想要更改會被記錄的資料，一樣進入auth_api.py
```auth_api.py
#修改這行
login_logger.info(f"login successfully, user:{user.account} ,user_id:{user.user_id}, user_password_hash:{user.password}")
```

# 使用者登入紀錄查看

進入backend容器的shell

```bash
cat logs/login_logger.log
```

# 關於斷網服務

由於前端有使用到Nominatim的地理編碼服務以及mapbox的地圖服務，這些服務在沒有網路的環境下是無法使用的。所以我們需要這兩個服務的容器來讓整個系統可以在沒有網路的環境下運作。

記得為跟目錄下的`.env`檔案設定`COMPOSE_PROFILES=no-internet`，這樣在啟動docker compose的時候才會把這些服務一起啟動。

# 斷網地圖底圖
下載完放到tiles資料夾裡

地圖底圖: https://data.maptiler.com/download/WyJmYmFiZWMwZS02OWVmLTRjZGEtYTIyNi03NTNlOTNmMTJjMWEiLG51bGwsMTY5MjRd.aQlTDg.t77IYRi46QMaCSWGMPGuXcRII8M/maptiler-osm-2020-02-10-v3.11-asia_taiwan.mbtiles
