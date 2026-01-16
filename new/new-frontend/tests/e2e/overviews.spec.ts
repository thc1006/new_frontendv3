import { test, expect } from '@playwright/test'

// Overview 頁面 E2E 測試 (Figma Node 17:143)
// 測試 OUTDOOR Overview 頁面的結構與互動功能
test.describe('Overview Page', () => {
  test.beforeEach(async ({ page }) => {
    // 先登入
    await page.goto('/login')
    await page.locator('input[type="text"]').first().fill('admin1')
    await page.locator('input[type="password"]').first().fill('admin1')
    await page.locator('button:has-text("Login")').click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  })

  // 頁面結構測試
  test.describe('Page Structure', () => {
    test('should display overview page', async ({ page }) => {
      await page.goto('/projects/2/overviews')
      await expect(page.locator('.overview-page')).toBeVisible({ timeout: 15000 })
    })

    test('should display page title "Overview"', async ({ page }) => {
      await page.goto('/projects/2/overviews')
      await expect(page.locator('.page-title')).toContainText('Overview', { timeout: 15000 })
    })

    test('should display evaluation card', async ({ page }) => {
      await page.goto('/projects/2/overviews')
      await expect(page.locator('.evaluation-card')).toBeVisible({ timeout: 15000 })
    })

    test('should display project title with ID', async ({ page }) => {
      await page.goto('/projects/2/overviews')
      await expect(page.locator('.project-title')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('.project-title')).toContainText('Project ID')
    })

    test('should display map container', async ({ page }) => {
      await page.goto('/projects/2/overviews')
      await expect(page.locator('#mapContainer')).toBeAttached({ timeout: 15000 })
    })
  })

  // Control Panel 測試
  test.describe('Control Panel', () => {
    test('should display control panel', async ({ page }) => {
      await page.goto('/projects/2/overviews')
      await expect(page.locator('.control-panel')).toBeVisible({ timeout: 15000 })
    })

    test('should have Heatmap toggle switch', async ({ page }) => {
      await page.goto('/projects/2/overviews')
      await expect(page.locator('.control-panel')).toBeVisible({ timeout: 15000 })
      // 使用 label 元素來避免與 Update Heatmap 按鈕混淆
      await expect(page.locator('.control-switch').first()).toBeVisible()
    })

    test('should have heatmap type dropdown', async ({ page }) => {
      await page.goto('/projects/2/overviews')
      await expect(page.locator('.heatmap-select')).toBeVisible({ timeout: 15000 })
    })

    test('should have Edit Model toggle switch', async ({ page }) => {
      await page.goto('/projects/2/overviews')
      await expect(page.locator('.control-panel')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('text=Edit Model')).toBeVisible()
    })

    test('should have Update Heatmap button', async ({ page }) => {
      await page.goto('/projects/2/overviews')
      await expect(page.locator('.update-btn')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('.update-btn')).toContainText('Update Heatmap')
    })

    test('should have last updated text', async ({ page }) => {
      await page.goto('/projects/2/overviews')
      await expect(page.locator('.last-updated')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('.last-updated')).toContainText('Last updated')
    })
  })

  // Heatmap 控制測試
  test.describe('Heatmap Controls', () => {
    test('should toggle heatmap visibility', async ({ page }) => {
      await page.goto('/projects/2/overviews')
      await expect(page.locator('.control-panel')).toBeVisible({ timeout: 15000 })

      // 找到 Heatmap switch 並點擊
      const heatmapSwitch = page.locator('.control-switch').first()
      await expect(heatmapSwitch).toBeVisible()
      await heatmapSwitch.click()

      // 色帶應該變成可見
      await expect(page.locator('.color-bar-container')).toBeVisible({ timeout: 5000 })
    })

    test('should enable dropdown when heatmap is on', async ({ page }) => {
      await page.goto('/projects/2/overviews')
      await expect(page.locator('.control-panel')).toBeVisible({ timeout: 15000 })

      // 先開啟 heatmap
      const heatmapSwitch = page.locator('.control-switch').first()
      await heatmapSwitch.click()

      // dropdown 應該可用
      const dropdown = page.locator('.heatmap-select')
      await expect(dropdown).not.toBeDisabled()
    })

    test('should update last updated time when clicking Update Heatmap', async ({ page }) => {
      await page.goto('/projects/2/overviews')
      await expect(page.locator('.update-btn')).toBeVisible({ timeout: 15000 })

      const updateBtn = page.locator('.update-btn')
      await updateBtn.click()

      // last updated 應該顯示今天日期
      const today = new Date().toISOString().slice(0, 10)
      await expect(page.locator('.last-updated')).toContainText(today)
    })
  })

  // Color Bar 測試
  test.describe('Color Bar', () => {
    test('should show color bar when heatmap enabled', async ({ page }) => {
      await page.goto('/projects/2/overviews')
      await expect(page.locator('.control-panel')).toBeVisible({ timeout: 15000 })

      // 開啟 heatmap
      const heatmapSwitch = page.locator('.control-switch').first()
      await heatmapSwitch.click()

      await expect(page.locator('.color-bar-container')).toBeVisible({ timeout: 5000 })
      await expect(page.locator('.color-bar')).toBeVisible()
    })

    test('should display dBm labels for RSRP type', async ({ page }) => {
      await page.goto('/projects/2/overviews')
      await expect(page.locator('.control-panel')).toBeVisible({ timeout: 15000 })

      // 開啟 heatmap
      const heatmapSwitch = page.locator('.control-switch').first()
      await heatmapSwitch.click()

      // 預設是 RSRP，應該顯示 dBm
      await expect(page.locator('.color-bar-label.top')).toContainText('dBm')
      await expect(page.locator('.color-bar-label.bottom')).toContainText('dBm')
    })
  })

  // Error Handling 測試
  test.describe('Error Handling', () => {
    test('should show error dialog for invalid project ID', async ({ page }) => {
      await page.goto('/projects/99999/overviews')

      // 應該顯示錯誤對話框
      await expect(page.locator('.v-dialog:has-text("Access Error")')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('.v-dialog')).toContainText('not found')
    })

    test('should return to projects list when clicking dialog button', async ({ page }) => {
      await page.goto('/projects/99999/overviews')

      await expect(page.locator('.v-dialog:has-text("Access Error")')).toBeVisible({ timeout: 15000 })

      // 點擊返回按鈕
      await page.locator('button:has-text("Return to Projects")').click()

      // 應該跳轉到專案列表
      await page.waitForURL('/', { timeout: 10000 })
    })
  })

  // Header WiSDON Chat 測試
  test.describe('Header WiSDON Chat', () => {
    test('should display WiSDON Chat button in project context', async ({ page }) => {
      await page.goto('/projects/2/overviews')
      await expect(page.locator('.overview-page')).toBeVisible({ timeout: 15000 })

      // 應該顯示 WiSDON Chat 按鈕
      await expect(page.locator('.wisdon-chat-btn')).toBeVisible()
      await expect(page.locator('.wisdon-chat-btn')).toContainText('WiSDON Chat')
    })
  })
})
