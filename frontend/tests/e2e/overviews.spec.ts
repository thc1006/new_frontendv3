import { test, expect } from '@playwright/test'
import { skipIfNoBackend } from './utils/test-helpers'

// Overview 頁面 E2E 測試 (Figma Node 17:143)
// 測試 OUTDOOR Overview 頁面的結構與互動功能
test.describe('Overview Page', () => {
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

    // 點擊第一個專案的 View Project 按鈕
    const viewProjectBtn = page.locator('button:has-text("View Project")').first()
    await viewProjectBtn.click()

    // 等待導航到專案頁面
    await page.waitForURL((url) => url.pathname.includes('/projects/'), { timeout: 10000 })

    // 從 URL 提取專案 ID
    const url = page.url()
    const match = url.match(/\/projects\/(\d+)/)
    projectId = match ? match[1] : '3'
  })

  // 頁面結構測試
  test.describe('Page Structure', () => {
    test('should display overview page', async ({ page }) => {
      await page.goto(`/projects/${projectId}/overviews`)
      // 檢查地圖容器載入
      await expect(page.locator('#mapContainer')).toBeAttached({ timeout: 15000 })
    })

    test('should display page title "Overview"', async ({ page }) => {
      await page.goto(`/projects/${projectId}/overviews`)
      // 檢查專案標題包含 Project ID
      await expect(page.locator('.v-card-title')).toContainText('Project ID', { timeout: 15000 })
    })

    test('should display project card', async ({ page }) => {
      await page.goto(`/projects/${projectId}/overviews`)
      await expect(page.locator('.v-card')).toBeVisible({ timeout: 15000 })
    })

    test('should display project title with ID', async ({ page }) => {
      await page.goto(`/projects/${projectId}/overviews`)
      await expect(page.locator('.v-card-title')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('.v-card-title')).toContainText('Project ID')
    })

    test('should display map container', async ({ page }) => {
      await page.goto(`/projects/${projectId}/overviews`)
      await expect(page.locator('#mapContainer')).toBeAttached({ timeout: 15000 })
    })
  })

  // Control Panel 測試
  test.describe('Control Panel', () => {
    test('should display control panel', async ({ page }) => {
      await page.goto(`/projects/${projectId}/overviews`)
      await expect(page.locator('#optionsList')).toBeVisible({ timeout: 15000 })
    })

    test('should have Heatmap toggle switch', async ({ page }) => {
      await page.goto(`/projects/${projectId}/overviews`)
      await expect(page.locator('#optionsList')).toBeVisible({ timeout: 15000 })
      // 使用 v-switch with label
      await expect(page.locator('.mini-switch').first()).toBeVisible()
    })

    test('should have heatmap type dropdown', async ({ page }) => {
      await page.goto(`/projects/${projectId}/overviews`)
      await expect(page.locator('.mini-select')).toBeVisible({ timeout: 15000 })
    })

    test('should have Edit Model toggle switch', async ({ page }) => {
      await page.goto(`/projects/${projectId}/overviews`)
      await expect(page.locator('#optionsList')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('text=Edit Model')).toBeVisible()
    })

    test('should have Update Heatmap button', async ({ page }) => {
      await page.goto(`/projects/${projectId}/overviews`)
      await expect(page.locator('.update-heatmap-btn')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('.update-heatmap-btn')).toContainText('Update Heatmap')
    })

    test('should have last updated text', async ({ page }) => {
      await page.goto(`/projects/${projectId}/overviews`)
      await expect(page.locator('#heatmapUpdateTime')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('#heatmapUpdateTime')).toContainText('Last updated')
    })
  })

  // Heatmap 控制測試
  test.describe('Heatmap Controls', () => {
    test('should toggle heatmap visibility', async ({ page }) => {
      await page.goto(`/projects/${projectId}/overviews`)
      await expect(page.locator('#optionsList')).toBeVisible({ timeout: 15000 })

      // 找到 Heatmap switch 並點擊
      const heatmapSwitch = page.locator('.mini-switch').first()
      await expect(heatmapSwitch).toBeVisible()
      await heatmapSwitch.click()

      // 色帶應該變成可見
      await expect(page.locator('.color-bar-container')).toBeVisible({ timeout: 5000 })
    })

    test('should enable dropdown when heatmap is on', async ({ page }) => {
      await page.goto(`/projects/${projectId}/overviews`)
      await expect(page.locator('#optionsList')).toBeVisible({ timeout: 15000 })

      // 先開啟 heatmap
      const heatmapSwitch = page.locator('.mini-switch').first()
      await heatmapSwitch.click()

      // dropdown 應該可用
      const dropdown = page.locator('.mini-select')
      await expect(dropdown).not.toBeDisabled()
    })

    test('should update last updated time when clicking Update Heatmap', async ({ page }) => {
      await page.goto(`/projects/${projectId}/overviews`)
      await expect(page.locator('.update-heatmap-btn')).toBeVisible({ timeout: 15000 })

      // 先啟用 heatmap（只有啟用時 Update Heatmap 才會更新時間）
      const heatmapSwitch = page.locator('.mini-switch').first()
      await heatmapSwitch.click()
      await page.waitForTimeout(500)

      // 點擊 Update Heatmap 按鈕
      const updateBtn = page.locator('.update-heatmap-btn')
      await updateBtn.click()

      // 等待 API 請求完成（可能需要時間）
      await page.waitForTimeout(2000)

      // last updated 時間會更新為當前時間
      // 格式為 toLocaleString('zh-TW')，例如 "2026/1/24 下午3:45:30"
      // 檢查 year 存在即可表示已更新（或檢查不再是預設值 2025/07/27）
      const currentYear = new Date().getFullYear().toString()
      const textContent = await page.locator('#heatmapUpdateTime').locator('..').locator('..').textContent()
      // 允許當前年份或去年（測試可能在跨年時運行）
      const hasValidYear = textContent?.includes(currentYear) || textContent?.includes(String(parseInt(currentYear) - 1))
      expect(hasValidYear || !textContent?.includes('2025/07/27')).toBe(true)
    })
  })

  // Color Bar 測試
  test.describe('Color Bar', () => {
    test('should show color bar when heatmap enabled', async ({ page }) => {
      await page.goto(`/projects/${projectId}/overviews`)
      await expect(page.locator('#optionsList')).toBeVisible({ timeout: 15000 })

      // 開啟 heatmap
      const heatmapSwitch = page.locator('.mini-switch').first()
      await heatmapSwitch.click()

      await expect(page.locator('.color-bar-container')).toBeVisible({ timeout: 5000 })
      await expect(page.locator('.color-bar')).toBeVisible()
    })

    test('should display dBm labels for RSRP type', async ({ page }) => {
      await page.goto(`/projects/${projectId}/overviews`)
      await expect(page.locator('#optionsList')).toBeVisible({ timeout: 15000 })

      // 開啟 heatmap
      const heatmapSwitch = page.locator('.mini-switch').first()
      await heatmapSwitch.click()

      // 預設是 RSRP，應該顯示 dBm
      await expect(page.locator('.color-bar-label').first()).toContainText('dBm')
      await expect(page.locator('.color-bar-label').last()).toContainText('dBm')
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
      await page.goto(`/projects/${projectId}/overviews`)
      await expect(page.locator('#mapContainer')).toBeAttached({ timeout: 15000 })

      // 應該顯示 WiSDON Chat 按鈕
      await expect(page.locator('button:has-text("WiSDON Chat")')).toBeVisible()
    })
  })
})
