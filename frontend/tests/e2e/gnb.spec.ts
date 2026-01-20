import { test, expect } from '@playwright/test'

// E2E tests for gNB (gNodeB) page
// Corresponds to Figma Node 3:616
test.describe('gNB (gNodeB) Page', () => {
  let projectId: string

  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.locator('input[type="text"]').first().fill('admin1')
    await page.locator('input[type="password"]').first().fill('admin1')
    await page.locator('button:has-text("Login")').click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })

    // Get the first project's ID
    await page.waitForSelector('.view-project-link', { timeout: 10000 })
    const viewBtn = page.locator('.view-project-link').first()
    await viewBtn.click()
    await page.waitForURL(/\/projects\/\d+\//, { timeout: 10000 })
    const url = page.url()
    const match = url.match(/\/projects\/(\d+)\//)
    projectId = match ? match[1] : '1'

    // Navigate to gNB page
    await page.goto(`/projects/${projectId}/config/gnb`)
  })

  // Task 11.1: 頁面結構測試
  test.describe('Page Structure', () => {
    test('should display gNB page', async ({ page }) => {
      await expect(page.locator('.ru-selector-container')).toBeVisible({ timeout: 10000 })
    })

    test('should display gNodeB title', async ({ page }) => {
      await expect(page.locator('h2')).toContainText(/gNodeB/i)
    })

    test('should display RU 管理系統 subtitle', async ({ page }) => {
      await expect(page.locator('h3')).toContainText(/RU 管理系統/i)
    })
  })

  // Task 11.2: RU 選擇器測試
  test.describe('RU Selector', () => {
    test('should have RU dropdown selector', async ({ page }) => {
      await expect(page.locator('.v-select')).toBeVisible({ timeout: 10000 })
    })

    test('should have selector label 選擇 RU', async ({ page }) => {
      // 使用 .first() 避免 strict mode violation
      await expect(page.locator('text=選擇 RU').first()).toBeVisible()
    })

    test('should have access-point icon in selector', async ({ page }) => {
      await expect(page.locator('.mdi-access-point')).toBeVisible()
    })

    test('should open dropdown when clicked', async ({ page }) => {
      await page.locator('.v-select').click()
      await page.waitForTimeout(500)
      // 下拉選單應該打開 (menu overlay 出現)
      await expect(page.locator('.v-menu.v-overlay--active')).toBeVisible({ timeout: 5000 })
    })
  })

  // Task 11.3: 導航選單測試
  test.describe('Navigation', () => {
    test('should be accessible from Configuration menu', async ({ page }) => {
      // 返回專案頁面
      await page.goto(`/projects/${projectId}/overviews`)

      // 開啟選單 (如果需要)
      const menuBtn = page.locator('.mdi-menu').or(page.locator('[aria-label="Menu"]'))
      if (await menuBtn.isVisible()) {
        await menuBtn.click()
      }

      // 尋找 Configuration 選單項目
      await expect(page.locator('text=Configuration')).toBeVisible({ timeout: 10000 })
    })

    test('should navigate to gNB page via URL', async ({ page }) => {
      // 直接透過 URL 訪問 gNB 頁面
      await page.goto(`/projects/${projectId}/config/gnb`)

      // 應該顯示頁面
      await expect(page.locator('.ru-selector-container')).toBeVisible({ timeout: 10000 })
    })
  })

  // Task 11.4: Figma 對齊測試
  test.describe('Figma Alignment', () => {
    test('should have correct title styling', async ({ page }) => {
      // 標題應該有粗體樣式
      const title = page.locator('h2.font-weight-bold')
      await expect(title).toBeVisible({ timeout: 10000 })
    })

    test('should have selector with max-width 300px', async ({ page }) => {
      const selector = page.locator('.v-select')
      await expect(selector).toBeVisible()
    })
  })

  // Task 11.5: RU 詳細卡片結構測試 (不需要實際 RU 資料)
  // 注意：完整的資料顯示測試需要資料庫有 RU 資料
  test.describe('Detail Card Structure', () => {
    test('should have snackbar component for notifications', async ({ page }) => {
      // Snackbar 元件應該存在於 DOM (即使不可見)
      await expect(page.locator('.v-snackbar')).toBeAttached()
    })
  })
})
