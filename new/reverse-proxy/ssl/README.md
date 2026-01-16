# SSL 憑證設定

請將 Cloudflare Origin Certificate 放置於此目錄：

## 必要檔案

1. `origin.pem` - Origin Certificate (PEM 格式)
2. `origin.key` - Private Key

## 取得方式

1. 登入 Cloudflare Dashboard
2. 選擇你的網域 (thc1006.cc)
3. 前往 SSL/TLS → Origin Server
4. 點擊 "Create Certificate"
5. 設定：
   - Key type: RSA (2048)
   - Hostnames: `wisdon.thc1006.cc`, `*.thc1006.cc`
   - Validity: 15 years
6. 複製 Origin Certificate 內容 → 存為 `origin.pem`
7. 複製 Private Key 內容 → 存為 `origin.key`

## 完成後重建容器

```bash
cd /home/ubuntu/dev/new_frontendv3/new
docker compose build reverse-proxy
docker compose up -d reverse-proxy
```
