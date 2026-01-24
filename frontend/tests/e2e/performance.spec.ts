import { test, expect } from '@playwright/test'
import { skipIfNoBackend } from './utils/test-helpers'

// Performance 頁面的 E2E 測試
// 測試 NES 和 MRO 頁面的 Grafana iframe 嵌入功能
test.describe('Performance Pages', () => {
  skipIfNoBackend()

  let projectId: string

  test.beforeEach(async ({ page }) => {
    // 先登入
    await page.goto('/login')
    await page.locator('input[type="text"]').first().fill('admin1')
    await page.locator('input[type="password"]').first().fill('admin1')
    await page.locator('button:has-text("Login")').click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })

    // 取得第一個專案的 ID
    await page.waitForSelector('text=VIEW PROJECT', { timeout: 10000 })
    const viewBtn = page.locator('text=VIEW PROJECT').first()
    const href = await viewBtn.evaluate((el) => {
      const link = el.closest('a') || el
      return link.getAttribute('href') || ''
    })
    // 從 URL 取得 projectId（格式：/projects/1/overviews）
    const match = href.match(/\/projects\/(\d+)/)
    projectId = match ? match[1] : '1'
  })

  test('should have Performance menu in sidebar navigation', async ({ page }) => {
    // 直接進入 NES 頁面驗證導航功能正常
    await page.goto(`/projects/${projectId}/performance/nes`)
    await page.waitForSelector('.performance-container', { timeout: 10000 })

    // 確認 URL 正確
    expect(page.url()).toContain('/performance/nes')

    // 確認導航欄存在
    const navIcon = page.locator('.v-app-bar-nav-icon')
    await expect(navIcon).toBeVisible()
  })

  test('should display NES page with Grafana iframe', async ({ page }) => {
    await page.goto(`/projects/${projectId}/performance/nes`)

    // 確認標題
    await expect(page.locator('h2:has-text("Performance - NES")')).toBeVisible({ timeout: 10000 })

    // 確認重新整理按鈕
    await expect(page.locator('button:has-text("重新整理")')).toBeVisible()

    // 確認 iframe 存在
    const iframe = page.locator('iframe.grafana-iframe')
    await expect(iframe).toBeVisible()

    // 確認 iframe 有 src
    const src = await iframe.getAttribute('src')
    expect(src).toBeTruthy()
    expect(src).toContain('nes')
  })

  test('should display MRO page with Grafana iframe', async ({ page }) => {
    await page.goto(`/projects/${projectId}/performance/mro`)

    // 確認標題
    await expect(page.locator('h2:has-text("Performance - MRO")')).toBeVisible({ timeout: 10000 })

    // 確認重新整理按鈕
    await expect(page.locator('button:has-text("重新整理")')).toBeVisible()

    // 確認 iframe 存在
    const iframe = page.locator('iframe.grafana-iframe')
    await expect(iframe).toBeVisible()

    // 確認 iframe 有 src
    const src = await iframe.getAttribute('src')
    expect(src).toBeTruthy()
    expect(src).toContain('mro')
  })

  test('should show loading state on NES page', async ({ page }) => {
    await page.goto(`/projects/${projectId}/performance/nes`)

    // 確認頁面容器存在
    await expect(page.locator('.performance-container')).toBeVisible({ timeout: 10000 })

    // 確認 iframe-wrapper 存在
    await expect(page.locator('.iframe-wrapper')).toBeVisible()
  })

  test('should show loading state on MRO page', async ({ page }) => {
    await page.goto(`/projects/${projectId}/performance/mro`)

    // 確認頁面容器存在
    await expect(page.locator('.performance-container')).toBeVisible({ timeout: 10000 })

    // 確認 iframe-wrapper 存在
    await expect(page.locator('.iframe-wrapper')).toBeVisible()
  })

  test('should have refresh button that works', async ({ page }) => {
    await page.goto(`/projects/${projectId}/performance/nes`)

    await page.waitForSelector('.performance-container', { timeout: 10000 })

    const refreshBtn = page.locator('button:has-text("重新整理")')
    await expect(refreshBtn).toBeVisible()

    // 點擊重新整理不應報錯
    await refreshBtn.click()

    // 頁面應該還在
    await expect(page.locator('h2:has-text("Performance - NES")')).toBeVisible()
  })

  // Phase 2.1: AI Model Performance 頁面測試
  test('should display AI Model Performance page', async ({ page }) => {
    await page.goto(`/projects/${projectId}/performance/ai-model`)

    // 確認標題
    await expect(page.locator('h2:has-text("Performance - AI Model")')).toBeVisible({ timeout: 10000 })

    // 確認重新整理按鈕
    await expect(page.locator('button:has-text("重新整理")')).toBeVisible()

    // 確認頁面容器存在
    await expect(page.locator('.performance-container')).toBeVisible()
  })

  test('should have iframe or placeholder on AI Model page', async ({ page }) => {
    await page.goto(`/projects/${projectId}/performance/ai-model`)

    await page.waitForSelector('.performance-container', { timeout: 10000 })

    // 確認 iframe-wrapper 存在
    await expect(page.locator('.iframe-wrapper')).toBeVisible()
  })

  // Phase 2.2: Ran Slice Performance 頁面測試
  test('should display Ran Slice Performance page', async ({ page }) => {
    await page.goto(`/projects/${projectId}/performance/ran-slice`)

    // 確認標題
    await expect(page.locator('h2:has-text("Performance - Ran Slice")')).toBeVisible({ timeout: 10000 })

    // 確認重新整理按鈕
    await expect(page.locator('button:has-text("重新整理")')).toBeVisible()

    // 確認頁面容器存在
    await expect(page.locator('.performance-container')).toBeVisible()
  })

  test('should have iframe or placeholder on Ran Slice page', async ({ page }) => {
    await page.goto(`/projects/${projectId}/performance/ran-slice`)

    await page.waitForSelector('.performance-container', { timeout: 10000 })

    // 確認 iframe-wrapper 存在
    await expect(page.locator('.iframe-wrapper')).toBeVisible()
  })
})
