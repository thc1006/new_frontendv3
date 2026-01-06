# 5G-ORAN

## 開發環境

### Backend
首先先去後端把`.env.example`複製一份成`.env`，然後修改裡面的設定。
目前開發環境的後端還需要連線至上線的InfluxDB，設定請問@Otmeal。之後要改成連線至本地的InfluxDB。
```
DB_HOST=mysql # docker-compose.dev.yml裡定義的MySQL的hostname
DB_DATABASE=devdb # docker-compose.dev.yml裡定義的MySQL的資料庫名稱
DB_USER=root # 後端登入MySQL的使用者名稱
DB_PASSWORD=password # 後端登入MySQL的使用者密碼

# 目前需要設定InfluxDB的連線，請視情況修改。
INFLUXDB_HOST= # InfluxDB的主機位址
INFLUXDB_PORT= # InfluxDB的port
INFLUXDB_USER= # InfluxDB的使用者名稱
INFLUXDB_USER_PASSWORD= # InfluxDB的使用者密碼
```

### Frontend
前端也要做一樣的事情，把`.env.example`複製一份成`.env`，然後修改裡面的設定。

```
# 前端的設定，請視情況修改
BACKEND_HOST=backend # 後端位置，這裡打backend是docker-compose.dev.yml裡定義的backend的hostname
BACKEND_PORT=8000 # 後端的Port
```

Note: 目前前端有直接連線InfluxDB，那部分共用了上面的後端IP和Port，所以可能會爛。

### Docker Compose 

啟動前後端＋DB：
```
docker compose -f docker-compose.dev.yml up --build --watch
```

下掉containers:
```
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml down -v # 帶著volumes一起下去，會把DB的資料重置。
```

前端在：`127.0.0.1:3000`
後端在：`127.0.0.1:8000`
Swagger在：`127.0.0.1:8000/apidocs`

### Note

- Simulator目前在121的內網，所以本地開發的時候會是爛的。
- 有一些projects的map還在server上，本地開發案到沒有地圖的project後端會500。
