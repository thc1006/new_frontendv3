import { defineConfig, devices } from '@playwright/test'

// 環境變數配置，支援本地開發 (HTTP) 和 K8s 環境 (HTTPS)
// CI 環境使用 preview server (http://localhost:3000)，除非有設定 PLAYWRIGHT_BASE_URL
const isCI = !!process.env.CI
const hasExternalBaseURL = !!process.env.PLAYWRIGHT_BASE_URL
const baseURL = process.env.PLAYWRIGHT_BASE_URL || (isCI ? 'http://localhost:3000' : 'https://localhost')
const ignoreHTTPSErrors = process.env.PLAYWRIGHT_IGNORE_HTTPS_ERRORS !== 'false'

// 硬體加速配置 (Intel i9-9900KF + RTX 2070 SUPER)
// 使用 RAM disk 作為快取目錄，並啟用 GPU 加速
const useHardwareAcceleration = process.env.PLAYWRIGHT_HW_ACCEL !== 'false'
const playwrightCacheDir = useHardwareAcceleration ? '/dev/shm/playwright-cache' : undefined

// 只在 CI 環境且沒有外部 URL 時啟動 webServer
const shouldStartWebServer = isCI && !hasExternalBaseURL

export default defineConfig({
  testDir: './tests/e2e',

  // 全域測試超時設定（CI 較短以加速失敗檢測）
  timeout: isCI ? 30000 : 60000,

  // 預期超時設定
  expect: {
    timeout: isCI ? 10000 : 15000,
  },

  // 重試失敗的測試
  retries: 1,

  // 並行執行
  fullyParallel: true,

  // CI 環境使用更多 workers 加速執行
  workers: isCI ? 4 : undefined,

  // 太多失敗時提前停止（CI 優化）
  maxFailures: isCI ? 10 : undefined,

  // 禁止只執行部分測試的提交
  forbidOnly: !!process.env.CI,

  // 報告器
  reporter: isCI ? 'github' : 'html',

  use: {
    baseURL,
    // K8s 環境使用 HTTPS（自簽憑證），nginx 會將 HTTP 重導向至 HTTPS
    // 本地開發可設定 PLAYWRIGHT_BASE_URL=http://localhost:3000
    ignoreHTTPSErrors,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    // 導航超時設定（CI 較短）
    navigationTimeout: isCI ? 20000 : 30000,
    // 動作超時設定（CI 較短）
    actionTimeout: isCI ? 10000 : 15000,
    // 視窗大小
    viewport: { width: 1280, height: 720 },
  },

  // CI 環境自動啟動 Nuxt preview server（除非有設定外部 PLAYWRIGHT_BASE_URL）
  webServer: shouldStartWebServer
    ? {
      command: 'pnpm run build && pnpm run preview',
      url: 'http://localhost:3000',
      reuseExistingServer: false,
      timeout: 180000, // 3 分鐘給 build + preview 啟動
      stdout: 'pipe',
      stderr: 'pipe',
    }
    : undefined,

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // 硬體加速配置 - RTX 2070 SUPER GPU 加速
        launchOptions: useHardwareAcceleration ? {
          args: [
            '--enable-gpu-rasterization',
            '--enable-zero-copy',
            '--enable-features=VaapiVideoDecoder',
            '--disable-software-rasterizer',
            '--enable-accelerated-2d-canvas',
            '--enable-accelerated-video-decode',
            '--ignore-gpu-blocklist',
          ],
        } : undefined,
      },
    },
  ],

  // 輸出目錄配置 - 使用 RAM disk 加速
  outputDir: useHardwareAcceleration ? '/dev/shm/playwright-cache/test-results' : 'test-results',
})
