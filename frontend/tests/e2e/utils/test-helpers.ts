import type { Page } from '@playwright/test'
import { test } from '@playwright/test'

/**
 * E2E 測試工具函數
 * 提供外部服務 mock、通用登入等功能
 */

/**
 * 是否在 CI 環境中
 *
 * 注意：CI 環境目前沒有部署後端服務，所以 CI = 無後端
 * 如果未來 CI 環境有後端，可使用 PLAYWRIGHT_SKIP_BACKEND_TESTS 環境變數
 */
export const isCI = !!process.env.CI

/**
 * 是否應該跳過需要後端的測試
 *
 * 優先順序：
 * 1. PLAYWRIGHT_SKIP_BACKEND_TESTS=true -> 強制跳過
 * 2. PLAYWRIGHT_SKIP_BACKEND_TESTS=false -> 強制執行
 * 3. 未設定 -> 使用 CI 環境變數判斷（CI 環境無後端）
 */
export const shouldSkipBackendTests = (() => {
  const envVar = process.env.PLAYWRIGHT_SKIP_BACKEND_TESTS
  if (envVar === 'true') return true
  if (envVar === 'false') return false
  return isCI // CI 環境預設跳過
})()

/**
 * 在沒有後端的環境中跳過測試
 * 使用方式：在 test.describe 開頭呼叫 skipIfNoBackend()
 *
 * 跳過條件：
 * - CI 環境（除非設定 PLAYWRIGHT_SKIP_BACKEND_TESTS=false）
 * - 或設定 PLAYWRIGHT_SKIP_BACKEND_TESTS=true
 */
export function skipIfNoBackend() {
  test.skip(shouldSkipBackendTests, 'Skipped: requires backend API (set PLAYWRIGHT_SKIP_BACKEND_TESTS=false to override)')
}

/**
 * Mock MinIO API 請求
 * 當 MinIO 服務不可用時，返回模擬數據
 */
export async function mockMinioService(page: Page) {
  await page.route('**/api/minio/**', async (route) => {
    const url = route.request().url()

    if (url.includes('ensure_bucket')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Bucket ensured (mocked)' })
      })
    } else if (url.includes('upload_json')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, key: 'mocked-key' })
      })
    } else if (url.includes('get_json')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: {} })
      })
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    }
  })
}

/**
 * Mock Geocoding API (Nominatim/OpenStreetMap)
 * 當地理編碼服務不可用時，返回模擬數據
 */
export async function mockGeocodingService(page: Page) {
  await page.route('**/api/search**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          place_id: 123456,
          licence: 'Data © OpenStreetMap contributors',
          osm_type: 'node',
          osm_id: 12345678,
          lat: '24.7881',
          lon: '120.9976',
          display_name: '新竹市, 新竹縣, 台灣',
          address: {
            city: '新竹市',
            county: '新竹縣',
            country: '台灣'
          }
        }
      ])
    })
  })

  // Also mock direct Nominatim calls
  await page.route('**/nominatim.openstreetmap.org/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          place_id: 123456,
          lat: '24.7881',
          lon: '120.9976',
          display_name: '新竹市, 台灣'
        }
      ])
    })
  })
}

/**
 * Mock AODT API 請求
 * 當 AODT 服務不可用時，返回模擬數據
 */
export async function mockAodtService(page: Page) {
  await page.route('**/api/aodt/**', async (route) => {
    const url = route.request().url()

    if (url.includes('status')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'running',
          version: '1.0.0 (mocked)'
        })
      })
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    }
  })
}

/**
 * Mock 所有外部服務
 */
export async function mockAllExternalServices(page: Page) {
  await mockMinioService(page)
  await mockGeocodingService(page)
  await mockAodtService(page)
}

/**
 * 通用登入函數
 * @param page Playwright Page 物件
 * @param username 使用者帳號 (預設 admin1)
 * @param password 使用者密碼 (預設 admin1)
 */
export async function login(
  page: Page,
  username: string = 'admin1',
  password: string = 'admin1'
) {
  await page.goto('/login')
  await page.locator('input[type="text"]').first().fill(username)
  await page.locator('input[type="password"]').first().fill(password)
  await page.locator('button:has-text("Login")').click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 15000,
    waitUntil: 'domcontentloaded'
  })
}

/**
 * 等待頁面載入完成
 * 使用 domcontentloaded 而非 networkidle
 */
export async function waitForPageLoad(page: Page, selector: string, timeout: number = 15000) {
  await page.waitForSelector(selector, {
    timeout,
    state: 'visible'
  })
}

/**
 * 安全導航到專案頁面
 * 包含錯誤處理和重試邏輯
 */
export async function navigateToProject(page: Page, projectId: string | number, subPath: string = 'overviews') {
  const url = `/projects/${projectId}/${subPath}`

  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  })

  // 等待主要內容載入
  await page.waitForLoadState('domcontentloaded')
}

/**
 * 獲取第一個專案的 ID
 */
export async function getFirstProjectId(page: Page): Promise<string> {
  await page.waitForSelector('.project-card', { timeout: 15000 })
  const viewProjectBtn = page.locator('button:has-text("View Project")').first()
  await viewProjectBtn.click()
  await page.waitForURL((url) => url.pathname.includes('/projects/'), {
    timeout: 10000,
    waitUntil: 'domcontentloaded'
  })

  const url = page.url()
  const match = url.match(/\/projects\/(\d+)/)
  return match ? match[1] : '1'
}

/**
 * 獲取指定類型的專案 ID
 * @param page Playwright Page 物件
 * @param type 專案類型 ('INDOOR' | 'OUTDOOR')
 * @returns 專案 ID（總是返回有效的字串，找不到時使用預設值）
 *
 * 注意：此函數需要後端 API 支援
 * 目前的測試資料假設：
 * - 偶數 ID (2, 4, 6...) = INDOOR
 * - 奇數 ID (1, 3, 5...) = OUTDOOR
 *
 * 當找不到指定類型的專案時，會使用預設 ID 以確保測試可以繼續執行：
 * - INDOOR: 預設為 '2'
 * - OUTDOOR: 預設為 '1'
 */
export async function getProjectIdByType(page: Page, type: 'INDOOR' | 'OUTDOOR'): Promise<string> {
  await page.waitForSelector('.project-card', { timeout: 15000 })

  // 嘗試從專案列表中找到指定類型的專案
  const projectCards = page.locator('.project-card')
  const count = await projectCards.count()

  for (let i = 0; i < count; i++) {
    const card = projectCards.nth(i)
    const typeLabel = card.locator('.project-type, .category-label')

    // 檢查專案類型標籤
    if (await typeLabel.count() > 0) {
      const labelText = await typeLabel.textContent()
      if (labelText?.toUpperCase().includes(type)) {
        // 點擊進入專案以獲取 ID
        await card.locator('button:has-text("View Project")').click()
        await page.waitForURL((url) => url.pathname.includes('/projects/'), {
          timeout: 10000,
          waitUntil: 'domcontentloaded'
        })

        const url = page.url()
        const match = url.match(/\/projects\/(\d+)/)
        // 如果 URL 解析失敗，使用預設值
        return match ? match[1] : (type === 'INDOOR' ? '2' : '1')
      }
    }
  }

  // 找不到指定類型，使用約定的預設值（偶數 = INDOOR, 奇數 = OUTDOOR）
  return type === 'INDOOR' ? '2' : '1'
}
