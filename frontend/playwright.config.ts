import { defineConfig } from '@playwright/test'

// 環境變數配置，支援本地開發 (HTTP) 和 K8s 環境 (HTTPS)
// CI 環境使用 preview server (http://localhost:3000)
const isCI = !!process.env.CI
const baseURL = process.env.PLAYWRIGHT_BASE_URL || (isCI ? 'http://localhost:3000' : 'https://localhost')
const ignoreHTTPSErrors = process.env.PLAYWRIGHT_IGNORE_HTTPS_ERRORS !== 'false'

export default defineConfig({
  testDir: './tests/e2e',
  // 全域測試超時設定
  timeout: 60000,
  // 預期超時設定
  expect: {
    timeout: 15000,
  },
  // 重試失敗的測試
  retries: process.env.CI ? 2 : 1,
  // 並行執行
  fullyParallel: true,
  // 禁止只執行部分測試的提交
  forbidOnly: !!process.env.CI,
  // 報告器
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL,
    // K8s 環境使用 HTTPS（自簽憑證），nginx 會將 HTTP 重導向至 HTTPS
    // 本地開發可設定 PLAYWRIGHT_BASE_URL=http://localhost:3000
    ignoreHTTPSErrors,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    // 導航超時設定
    navigationTimeout: 30000,
    // 動作超時設定
    actionTimeout: 15000,
    // 視窗大小
    viewport: { width: 1280, height: 720 },
  },
  // CI 環境自動啟動 Nuxt preview server
  webServer: isCI
    ? {
      command: 'pnpm run build && pnpm run preview',
      url: 'http://localhost:3000',
      reuseExistingServer: false,
      timeout: 180000, // 3 分鐘給 build + preview 啟動
    }
    : undefined,
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
      },
    },
  ],
})
