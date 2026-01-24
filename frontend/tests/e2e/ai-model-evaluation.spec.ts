import { test, expect } from '@playwright/test'
import { skipIfNoBackend } from './utils/test-helpers'

// AI Model Evaluation 頁面的 E2E 測試
// 測試模型評估頁面的基本結構與互動功能
test.describe('AI Model Evaluation Page', () => {
  skipIfNoBackend()

  let projectId: string

  test.beforeEach(async ({ page }) => {
    // 先登入
    await page.goto('/login')
    await page.locator('input[type="text"]').first().fill('admin1')
    await page.locator('input[type="password"]').first().fill('admin1')
    await page.locator('button:has-text("Login")').click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })

    // 等待首頁載入並獲取第一個專案的 ID
    await page.waitForSelector('.project-card', { timeout: 15000 })
    const viewProjectBtn = page.locator('button:has-text("View Project")').first()
    await viewProjectBtn.click()
    await page.waitForURL((url) => url.pathname.includes('/projects/'), { timeout: 10000 })

    // 從 URL 提取專案 ID
    const url = page.url()
    const match = url.match(/\/projects\/(\d+)/)
    projectId = match ? match[1] : '3'
  })

  // Task 5.1: 頁面基本載入測試
  test.describe('Page Structure', () => {
    test('should navigate to AI Model Evaluation page', async ({ page }) => {
      await page.goto(`/projects/${projectId}/ai-model-evaluation`)

      // 確認頁面載入成功（不是 404）
      await expect(page.locator('.ai-model-evaluation-container')).toBeVisible({ timeout: 10000 })
    })

    test('should display page title', async ({ page }) => {
      await page.goto(`/projects/${projectId}/ai-model-evaluation`)

      // 確認頁面標題（使用 h2 標籤定位，避免與選單項目衝突）
      await expect(page.locator('.page-header h2')).toContainText('AI Model Evaluation')
    })
  })

  // Task 5.2: Model list 側邊欄測試
  test.describe('Model List Panel', () => {
    test('should display Model list panel', async ({ page }) => {
      await page.goto(`/projects/${projectId}/ai-model-evaluation`)

      // 確認有 Model list 面板
      await expect(page.locator('.model-list-panel')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('text=Model list')).toBeVisible()
    })

    test('should have NES toggle switch', async ({ page }) => {
      await page.goto(`/projects/${projectId}/ai-model-evaluation`)

      // 確認有 NES 切換開關
      const nesSwitch = page.locator('.model-list-panel .v-switch').filter({ hasText: 'NES' })
      await expect(nesSwitch).toBeVisible({ timeout: 10000 })
    })

    test('should have Positioning toggle switch', async ({ page }) => {
      await page.goto(`/projects/${projectId}/ai-model-evaluation`)

      // 確認有 Positioning 切換開關
      const posSwitch = page.locator('.model-list-panel .v-switch').filter({ hasText: 'Positioning' })
      await expect(posSwitch).toBeVisible({ timeout: 10000 })
    })

    test('should toggle NES switch on/off', async ({ page }) => {
      await page.goto(`/projects/${projectId}/ai-model-evaluation`)

      const nesSwitch = page.locator('.model-list-panel .v-switch').filter({ hasText: 'NES' })
      await expect(nesSwitch).toBeVisible({ timeout: 10000 })

      // 點擊切換
      await nesSwitch.locator('input').click()

      // 確認有反應（snackbar 或狀態變化）
      // placeholder 情況下會顯示提示訊息
      await expect(page.locator('.v-snackbar')).toBeVisible({ timeout: 3000 })
    })

    test('should toggle Positioning switch on/off', async ({ page }) => {
      await page.goto(`/projects/${projectId}/ai-model-evaluation`)

      const posSwitch = page.locator('.model-list-panel .v-switch').filter({ hasText: 'Positioning' })
      await expect(posSwitch).toBeVisible({ timeout: 10000 })

      // 點擊切換
      await posSwitch.locator('input').click()

      // 確認有反應
      await expect(page.locator('.v-snackbar')).toBeVisible({ timeout: 3000 })
    })
  })

  // Task 5.3: Model Inference 面板測試
  test.describe('Model Inference Panel', () => {
    test('should display Model Inference panel', async ({ page }) => {
      await page.goto(`/projects/${projectId}/ai-model-evaluation`)

      // 確認有 Model Inference 面板
      await expect(page.locator('.model-inference-panel')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('text=Model Inference')).toBeVisible()
    })

    test('should show visualization area', async ({ page }) => {
      await page.goto(`/projects/${projectId}/ai-model-evaluation`)

      // 確認有視覺化區域
      await expect(page.locator('.inference-visualization')).toBeVisible({ timeout: 10000 })
    })
  })

  // Task 5.4: 導航選單測試
  test.describe('Navigation Menu', () => {
    test('should have AI Model Evaluation link in menu', async ({ page }) => {
      await page.goto(`/projects/${projectId}/overviews`)

      // 點開選單
      await page.locator('.v-app-bar-nav-icon').click()
      await page.waitForSelector('.v-navigation-drawer.v-navigation-drawer--active', { timeout: 5000 })

      // 確認有 AI Model Evaluation 連結
      const evalLink = page.locator('.v-navigation-drawer .v-list-item').filter({ hasText: /^AI Model Evaluation$/ })
      await expect(evalLink).toBeVisible({ timeout: 3000 })
    })

    test('should navigate to AI Model Evaluation page from menu', async ({ page }) => {
      await page.goto(`/projects/${projectId}/overviews`)

      // 點開選單
      await page.locator('.v-app-bar-nav-icon').click()
      await page.waitForSelector('.v-navigation-drawer.v-navigation-drawer--active', { timeout: 5000 })

      // 點擊 AI Model Evaluation
      await page.locator('.v-navigation-drawer .v-list-item').filter({ hasText: /^AI Model Evaluation$/ }).click()

      // 確認導航成功
      await expect(page).toHaveURL(`/projects/${projectId}/ai-model-evaluation`)
    })
  })
})
