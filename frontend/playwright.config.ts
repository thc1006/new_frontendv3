import { defineConfig } from '@playwright/test'

// 環境變數配置，支援本地開發 (HTTP) 和 K8s 環境 (HTTPS)
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://localhost'
const ignoreHTTPSErrors = process.env.PLAYWRIGHT_IGNORE_HTTPS_ERRORS !== 'false'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL,
    // K8s 環境使用 HTTPS（自簽憑證），nginx 會將 HTTP 重導向至 HTTPS
    // 本地開發可設定 PLAYWRIGHT_BASE_URL=http://localhost:3000
    ignoreHTTPSErrors,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
      },
    },
  ],
})
