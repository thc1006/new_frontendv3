import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'https://localhost',
    // 本地 Docker 環境使用自簽憑證，nginx 強制 HTTP→HTTPS 重導向
    // 生產環境應使用正式憑證，此設定僅影響本地測試
    ignoreHTTPSErrors: true,
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
