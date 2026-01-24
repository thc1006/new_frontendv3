import { test, expect } from '@playwright/test'
import { login, getFirstProjectId, mockAllExternalServices, skipIfNoBackend } from './utils/test-helpers'

// Scene Deployment 頁面 E2E 測試 (Figma Node 17:156, 17:370)
// 測試 OUTDOOR/INDOOR Scene Deployment 頁面結構與功能
test.describe('Scene Deployment Page', () => {
  skipIfNoBackend()

  let projectId: string

  test.beforeEach(async ({ page }) => {
    // Mock 外部服務以避免依賴問題
    await mockAllExternalServices(page)

    // 登入
    await login(page)

    // 獲取第一個專案的 ID
    projectId = await getFirstProjectId(page)
  })

  // 頁面結構測試 (使用 OUTDOOR project ID 3)
  test.describe('Page Structure', () => {
    test('should display Scene Deployment page', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
    })

    test('should display page title "Scene Deployment"', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.page-title')).toContainText('Scene Deployment', { timeout: 15000 })
    })

    test('should display project title', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.v-card-title')).toContainText('Project ID', { timeout: 15000 })
    })
  })

  // OUTDOOR 頂部按鈕測試 (使用 project ID 3 = 奇數 = OUTDOOR)
  test.describe('OUTDOOR Top Buttons', () => {
    test('should display ADD RU button', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('button:has-text("ADD RU")')).toBeVisible()
    })

    test('should display UES SETTINGS button for OUTDOOR', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('button:has-text("UES SETTINGS")')).toBeVisible()
    })

    test('should display SIMULATION CONFIG button for OUTDOOR', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('button:has-text("SIMULATION CONFIG")')).toBeVisible()
    })

    test('should display RU POSITION button for OUTDOOR', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
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
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('button:has-text("EVALUATE")')).toBeVisible()
    })

    test('should display APPLY CONFIG button', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('button:has-text("APPLY CONFIG")')).toBeVisible()
    })

    test('should display RSRP heatmap type selector', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('.heatmap-select')).toBeVisible()
    })

    test('should display Show heatmap switch', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('.heatmap-switch')).toBeVisible()
    })

    test('should have correct heatmap type options', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })

      // 點擊下拉選單
      await page.locator('.heatmap-select').click()

      // 確認有正確的選項
      await expect(page.locator('.v-list-item:has-text("RSRP (success)")')).toBeVisible({ timeout: 3000 })
      await expect(page.locator('.v-list-item:has-text("Throughput (waiting)")')).toBeVisible()
    })

    test('should hide color bar when heatmap is disabled', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })

      // 色標預設應該隱藏
      await expect(page.locator('.color-bar-vertical')).toBeHidden()
    })

    test('should show color bar when heatmap is enabled', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })

      // 點擊 switch 啟用 heatmap
      await page.locator('.heatmap-switch input').click()

      // 色標應該顯示
      await expect(page.locator('.color-bar-vertical')).toBeVisible()
      await expect(page.locator('.color-bar-gradient')).toBeVisible()
    })

    test('should display RSRP units for RSRP heatmap type', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })

      // 啟用 heatmap
      await page.locator('.heatmap-switch input').click()

      // 預設為 RSRP，應顯示 dBm 單位
      await expect(page.locator('.color-bar-labels-vertical')).toContainText('dBm')
    })

    test('should display Throughput units when type changed', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })

      // 啟用 heatmap
      await page.locator('.heatmap-switch input').click()

      // 切換到 Throughput
      await page.locator('.heatmap-select').click()
      await page.locator('.v-list-item:has-text("Throughput (waiting)")').click()

      // 應顯示 Mbps 單位
      await expect(page.locator('.color-bar-labels-vertical')).toContainText('Mbps')
    })
  })

  // RU 互動提示測試
  test.describe('RU Interaction Tips', () => {
    test('should display RU Interaction Tips section', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('.ru-tips')).toBeVisible()
    })

    test('should display single click tip', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('.ru-tips')).toContainText('Single click RU: Select RU')
    })

    test('should display double click tip', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('.ru-tips')).toContainText('Double click RU: Open RU configuration dialog')
    })

    test('should display keyboard shortcut tip', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('.ru-tips')).toContainText('Keyboard Q/W: Rotate RU')
    })
  })

  // 地圖區域測試
  test.describe('Map Area', () => {
    test('should display map container', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })

      // 檢查地圖容器存在
      const mapContainer = page.locator('.map-container')
      await expect(mapContainer).toBeVisible()
    })

    test('should display mapbox map element', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })

      // 等待 Mapbox 地圖載入
      const mapView = page.locator('#sceneMapContainer')
      await expect(mapView).toBeVisible({ timeout: 10000 })

      // 確認 Mapbox canvas 已經載入
      await expect(page.locator('#sceneMapContainer canvas')).toBeVisible({ timeout: 15000 })
    })
  })

  // RU Configuration 對話框測試
  test.describe('RU Configuration Dialog', () => {
    test('should open RU config dialog when clicking ADD RU', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })

      await page.locator('button:has-text("ADD RU")').click()

      // 對話框應該出現
      await expect(page.locator('.v-dialog')).toBeVisible({ timeout: 3000 })
      await expect(page.locator('.ru-dialog-title')).toContainText('RU Configuration')
    })

    test('should display location settings in dialog', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })

      await page.locator('button:has-text("ADD RU")').click()
      await expect(page.locator('.v-dialog')).toBeVisible({ timeout: 3000 })

      // 確認位置設定欄位存在
      await expect(page.locator('.v-dialog input[type="number"]').first()).toBeVisible()
      await expect(page.locator('.v-dialog').getByText('位置設定')).toBeVisible()
    })

    test('should display technical specs in dialog', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })

      await page.locator('button:has-text("ADD RU")').click()
      await expect(page.locator('.v-dialog')).toBeVisible({ timeout: 3000 })

      // 確認技術規格區塊存在
      await expect(page.locator('.v-dialog').getByText('技術規格')).toBeVisible()
      // 確認有多個輸入欄位 (位置 3 個 + 技術規格 4 個 = 7 個)
      const inputs = page.locator('.v-dialog input[type="number"]')
      await expect(inputs).toHaveCount(7)
    })

    test('should close dialog when clicking cancel', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })

      await page.locator('button:has-text("ADD RU")').click()
      await expect(page.locator('.v-dialog')).toBeVisible({ timeout: 3000 })

      // 點擊取消按鈕
      await page.locator('.v-dialog button:has-text("取消")').click()

      // 對話框應該關閉
      await expect(page.locator('.v-dialog')).toBeHidden({ timeout: 3000 })
    })

    test('should show placeholder message when clicking save', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })

      await page.locator('button:has-text("ADD RU")').click()
      await expect(page.locator('.v-dialog')).toBeVisible({ timeout: 3000 })

      // 點擊儲存按鈕
      await page.locator('.v-dialog button:has-text("儲存設定")').click()

      // 應該顯示 placeholder 訊息
      await expect(page.locator('.v-snackbar')).toBeVisible({ timeout: 3000 })
      await expect(page.locator('.v-snackbar')).toContainText('尚未實作')
    })

    test('should close dialog with X button', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })

      await page.locator('button:has-text("ADD RU")').click()
      await expect(page.locator('.v-dialog')).toBeVisible({ timeout: 3000 })

      // 點擊 X 按鈕
      await page.locator('.ru-dialog-title button').click()

      // 對話框應該關閉
      await expect(page.locator('.v-dialog')).toBeHidden({ timeout: 3000 })
    })
  })

  // 按鈕互動測試
  test.describe('Button Interactions', () => {
    test('should open dialog when clicking ADD RU', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })

      await page.locator('button:has-text("ADD RU")').click()

      // 應該顯示 RU Configuration 對話框
      await expect(page.locator('.v-dialog')).toBeVisible({ timeout: 3000 })
    })

    test('should show feedback when clicking EVALUATE', async ({ page }) => {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await expect(page.locator('.scene-deployment-page')).toBeVisible({ timeout: 15000 })

      await page.locator('button:has-text("EVALUATE")').click()

      // 應該顯示某種回饋
      await expect(page.locator('.v-snackbar, .v-dialog')).toBeVisible({ timeout: 3000 })
    })
  })
})
