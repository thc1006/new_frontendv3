# syntax=docker/dockerfile:1.7

########## 1) Build stage ##########
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm (pinned to specific version for reproducible builds)
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

# Install OS deps only if you need native modules (e.g., sharp)
# RUN apk add --no-cache python3 make g++ libc6-compat

# Copy dependency files first for better caching
# Include patches directory for pnpm patch feature (threebox-plugin patch)
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
# Install with prefer-frozen-lockfile to allow patch hash recalculation while keeping deps locked
RUN pnpm install --prefer-frozen-lockfile

# Copy source code and build
COPY . .
# Disable Nuxt telemetry
ENV NUXT_TELEMETRY_DISABLED=1
# Build for production
RUN pnpm run build


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
