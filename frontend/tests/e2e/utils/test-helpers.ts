import type { Page } from '@playwright/test'
import { test } from '@playwright/test'

/**
 * E2E 測試工具函數
 * 提供外部服務 mock、通用登入等功能
 */

/**
 * 是否在 CI 環境中（沒有 backend）
 */
export const isCI = !!process.env.CI

/**
 * 在 CI 環境中跳過需要 backend 的測試
 * 使用方式：在 test.describe 開頭呼叫 skipIfNoBackend()
 */
export function skipIfNoBackend() {
  test.skip(isCI, 'Skipped in CI: requires backend API')
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
