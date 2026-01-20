# syntax=docker/dockerfile:1.7

########## 1) Build stage ##########
FROM node:20-alpine AS builder
WORKDIR /app

# Install OS deps only if你需要原生模組（例如 sharp）
# RUN apk add --no-cache python3 make g++ libc6-compat

# 先只複製依賴檔，利用快取
COPY package*.json ./
# 使用 ci 保證可重現安裝；要 dev 依賴來進行 build
RUN npm ci

# 再複製原始碼並進行編譯
COPY . .
# 關掉 Nuxt 遠端遙測
ENV NUXT_TELEMETRY_DISABLED=1
# 正式編譯輸出到 .output（Nitro）
RUN npm run build

# 如果你的 Nitro 設定有 external deps（少數情況），在這裡移除 dev 依賴
# RUN npm prune --omit=dev


########## 2) Runtime stage ##########
FROM node:20-alpine AS runner
WORKDIR /app

# 最小化環境
ENV NODE_ENV=production
ENV NUXT_TELEMETRY_DISABLED=1
# Nuxt/Nitro 會讀 PORT/HOST
ENV HOST=0.0.0.0
ENV PORT=3000

# 只帶入建置成果；.output 已包含 public 資源與 server
COPY --from=builder /app/.output /app/.output

# 若你的 Nitro 有 external modules（例如你故意 external 某些套件），再解開下面一行：
# COPY --from=builder /app/node_modules /app/node_modules

# 使用非 root
USER node

EXPOSE 3000
# Nitro（Node preset）啟動指令
CMD ["node", ".output/server/index.mjs"]
