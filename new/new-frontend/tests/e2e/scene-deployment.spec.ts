import { test, expect } from '@playwright/test'

// Scene Deployment 頁面 E2E 測試 (Figma Node 17:156, 17:370)
// 測試 OUTDOOR/INDOOR Scene Deployment 頁面結構與功能
// 注意：目前使用 project_id 奇偶數模擬分類（奇數=OUTDOOR，偶數=INDOOR）
test.describe('Scene Deployment Page', () => {
  test.beforeEach(async ({ page }) => {
    // 先登入
    await page.goto('/login')
    await page.locator('input[type="text"]').first().fill('admin1')
    await page.locator('input[type="password"]').first().fill('admin1')
    await page.locator('button:has-text("Login")').click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  })

  // 頁面結構測試 (使用 OUTDOOR project ID 3)
  test.describe('Page Structure', () => {
    test('should display Scene Deployment page', async ({ page }) => {
      await page.goto('/projects/3/scene-deployment')
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
    })

    test('should display page title "Scene Deployment"', async ({ page }) => {
      await page.goto('/projects/3/scene-deployment')
      await expect(page.locator('.page-title')).toContainText('Scene Deployment', { timeout: 15000 })
    })

    test('should display project title', async ({ page }) => {
      await page.goto('/projects/3/scene-deployment')
      await expect(page.locator('.v-card-title')).toContainText('Project ID', { timeout: 15000 })
    })
  })

  // OUTDOOR 頂部按鈕測試 (使用 project ID 3 = 奇數 = OUTDOOR)
  test.describe('OUTDOOR Top Buttons', () => {
    test('should display ADD RU button', async ({ page }) => {
      await page.goto('/projects/3/scene-deployment')
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('button:has-text("ADD RU")')).toBeVisible()
    })

    test('should display UES SETTINGS button for OUTDOOR', async ({ page }) => {
      await page.goto('/projects/3/scene-deployment')
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('button:has-text("UES SETTINGS")')).toBeVisible()
    })

    test('should display SIMULATION CONFIG button for OUTDOOR', async ({ page }) => {
      await page.goto('/projects/3/scene-deployment')
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('button:has-text("SIMULATION CONFIG")')).toBeVisible()
    })

    test('should display RU POSITION button for OUTDOOR', async ({ page }) => {
      await page.goto('/projects/3/scene-deployment')
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('button:has-text("RU POSITION")')).toBeVisible()
    })
  })

  // INDOOR 頂部按鈕測試 (使用 project ID 2 = 偶數 = INDOOR)
  test.describe('INDOOR Top Buttons', () => {
    test('should display only ADD RU button for INDOOR', async ({ page }) => {
      await page.goto('/projects/2/scene-deployment')
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('button:has-text("ADD RU")')).toBeVisible()
    })

    test('should hide UES SETTINGS button for INDOOR', async ({ page }) => {
      await page.goto('/projects/2/scene-deployment')
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      // 等待頁面載入完成
      await expect(page.locator('.v-card-title')).not.toContainText('Loading', { timeout: 10000 })
      // INDOOR 不顯示 UES SETTINGS
      await expect(page.locator('button:has-text("UES SETTINGS")')).toHaveCount(0)
    })

    test('should hide SIMULATION CONFIG button for INDOOR', async ({ page }) => {
      await page.goto('/projects/2/scene-deployment')
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('.v-card-title')).not.toContainText('Loading', { timeout: 10000 })
      await expect(page.locator('button:has-text("SIMULATION CONFIG")')).toHaveCount(0)
    })

    test('should hide RU POSITION button for INDOOR', async ({ page }) => {
      await page.goto('/projects/2/scene-deployment')
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('.v-card-title')).not.toContainText('Loading', { timeout: 10000 })
      await expect(page.locator('button:has-text("RU POSITION")')).toHaveCount(0)
    })
  })

  // 底部控制列測試
  test.describe('Bottom Control Row', () => {
    test('should display EVALUATE button', async ({ page }) => {
      await page.goto('/projects/3/scene-deployment')
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('button:has-text("EVALUATE")')).toBeVisible()
    })

    test('should display APPLY CONFIG button', async ({ page }) => {
      await page.goto('/projects/3/scene-deployment')
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('button:has-text("APPLY CONFIG")')).toBeVisible()
    })

    test('should display RSRP heatmap type selector', async ({ page }) => {
      await page.goto('/projects/3/scene-deployment')
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('.heatmap-select')).toBeVisible()
    })

    test('should display Show heatmap switch', async ({ page }) => {
      await page.goto('/projects/3/scene-deployment')
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('.heatmap-switch')).toBeVisible()
    })

    test('should have correct heatmap type options', async ({ page }) => {
      await page.goto('/projects/3/scene-deployment')
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })

      // 點擊下拉選單
      await page.locator('.heatmap-select').click()

      // 確認有正確的選項
      await expect(page.locator('.v-list-item:has-text("RSRP (success)")')).toBeVisible({ timeout: 3000 })
      await expect(page.locator('.v-list-item:has-text("Throughput (waiting)")')).toBeVisible()
    })
  })

  // RU 互動提示測試
  test.describe('RU Interaction Tips', () => {
    test('should display RU Interaction Tips section', async ({ page }) => {
      await page.goto('/projects/3/scene-deployment')
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('.ru-tips')).toBeVisible()
    })

    test('should display single click tip', async ({ page }) => {
      await page.goto('/projects/3/scene-deployment')
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('.ru-tips')).toContainText('Single click RU: Select RU')
    })

    test('should display double click tip', async ({ page }) => {
      await page.goto('/projects/3/scene-deployment')
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('.ru-tips')).toContainText('Double click RU: Open RU configuration dialog')
    })

    test('should display keyboard shortcut tip', async ({ page }) => {
      await page.goto('/projects/3/scene-deployment')
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('.ru-tips')).toContainText('Keyboard Q/W: Rotate RU')
    })
  })

  // 地圖區域測試
  test.describe('Map Area', () => {
    test('should display map container', async ({ page }) => {
      await page.goto('/projects/3/scene-deployment')
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })

      // 檢查地圖容器存在（目前是 placeholder 或實際地圖）
      const mapContainer = page.locator('.map-container, .map-placeholder')
      await expect(mapContainer).toBeVisible()
    })
  })

  // 按鈕互動測試
  test.describe('Button Interactions', () => {
    test('should show feedback when clicking ADD RU', async ({ page }) => {
      await page.goto('/projects/3/scene-deployment')
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })

      await page.locator('button:has-text("ADD RU")').click()

      // 應該顯示某種回饋（snackbar 或對話框）
      await expect(page.locator('.v-snackbar, .v-dialog')).toBeVisible({ timeout: 3000 })
    })

    test('should show feedback when clicking EVALUATE', async ({ page }) => {
      await page.goto('/projects/3/scene-deployment')
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })

      await page.locator('button:has-text("EVALUATE")').click()

      // 應該顯示某種回饋
      await expect(page.locator('.v-snackbar, .v-dialog')).toBeVisible({ timeout: 3000 })
    })
  })
})
