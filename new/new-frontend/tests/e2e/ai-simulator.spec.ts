import { test, expect } from '@playwright/test'

// AI Application Simulator 頁面 E2E 測試 (Figma Node 277:952)
// 測試 Model List、NES Model 控制面板、訓練流程
test.describe('AI Application Simulator Page', () => {
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
    test('should display AI Application Simulator page', async ({ page }) => {
      await page.goto('/projects/3/ai-simulator')
      await expect(page.locator('.ai-simulator-page')).toBeVisible({ timeout: 15000 })
    })

    test('should display page title', async ({ page }) => {
      await page.goto('/projects/3/ai-simulator')
      await expect(page.locator('.page-title')).toContainText('AI Application Simulator', { timeout: 15000 })
    })

    test('should display warning banner', async ({ page }) => {
      await page.goto('/projects/3/ai-simulator')
      await expect(page.locator('.warning-banner')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('.warning-banner')).toContainText('Note')
    })
  })

  // Model List 測試
  test.describe('Model List', () => {
    test('should display Model list panel header', async ({ page }) => {
      await page.goto('/projects/3/ai-simulator')
      await expect(page.locator('.left-panel .panel-header')).toContainText('Model list', { timeout: 15000 })
    })

    test('should display 6 model buttons', async ({ page }) => {
      await page.goto('/projects/3/ai-simulator')
      await expect(page.locator('.ai-simulator-page')).toBeVisible({ timeout: 15000 })

      // 檢查 6 個模型按鈕
      await expect(page.locator('.model-btn:has-text("NES")')).toBeVisible()
      await expect(page.locator('.model-btn:has-text("Positioning")')).toBeVisible()
      await expect(page.locator('.model-btn:has-text("IM")')).toBeVisible()
      await expect(page.locator('.model-btn:has-text("MRO")')).toBeVisible()
      await expect(page.locator('.model-btn:has-text("RS")')).toBeVisible()
      await expect(page.locator('.model-btn:has-text("BC")')).toBeVisible()
    })

    test('should navigate to NES model when clicking NES button', async ({ page }) => {
      await page.goto('/projects/3/ai-simulator')
      await expect(page.locator('.ai-simulator-page')).toBeVisible({ timeout: 15000 })

      await page.locator('.model-btn:has-text("NES")').click()

      // 應該顯示 NES 控制面板
      await expect(page.locator('.left-panel .panel-header')).toContainText('NES')
    })
  })

  // NES Model 控制面板測試
  test.describe('NES Model Controls', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/projects/3/ai-simulator')
      await expect(page.locator('.ai-simulator-page')).toBeVisible({ timeout: 15000 })
      await page.locator('.model-btn:has-text("NES")').click()
      await expect(page.locator('.left-panel .panel-header')).toContainText('NES')
    })

    test('should display Model Select dropdown', async ({ page }) => {
      await expect(page.locator('.model-select')).toBeVisible()
    })

    test('should display Pre-train button', async ({ page }) => {
      await expect(page.locator('.control-btn:has-text("Pre-train")')).toBeVisible()
    })

    test('should display Preview button', async ({ page }) => {
      await expect(page.locator('.control-btn:has-text("Preview")')).toBeVisible()
    })

    test('should display BACK button', async ({ page }) => {
      await expect(page.locator('.action-btn:has-text("BACK")')).toBeVisible()
    })

    test('should display START button initially', async ({ page }) => {
      await expect(page.locator('.action-btn:has-text("START")')).toBeVisible()
    })

    test('should return to Model list when clicking BACK', async ({ page }) => {
      await page.locator('.action-btn:has-text("BACK")').click()

      // 應該回到 Model list
      await expect(page.locator('.left-panel .panel-header')).toContainText('Model list')
    })

    test('should have disabled Pre-train button when no model selected', async ({ page }) => {
      const pretrainBtn = page.locator('.control-btn:has-text("Pre-train")')
      await expect(pretrainBtn).toBeDisabled()
    })

    test('should enable Pre-train button after selecting model', async ({ page }) => {
      // 選擇模型
      await page.locator('.model-select').click()
      await page.locator('.v-list-item:has-text("Model 1")').click()

      // Pre-train 按鈕應該啟用
      const pretrainBtn = page.locator('.control-btn:has-text("Pre-train")')
      await expect(pretrainBtn).toBeEnabled()
    })
  })

  // 訓練流程測試
  test.describe('Training Process', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/projects/3/ai-simulator')
      await expect(page.locator('.ai-simulator-page')).toBeVisible({ timeout: 15000 })
      await page.locator('.model-btn:has-text("NES")').click()
      await page.locator('.model-select').click()
      await page.locator('.v-list-item:has-text("Model 1")').click()
    })

    test('should start training when clicking START', async ({ page }) => {
      await page.locator('.action-btn:has-text("START")').click()

      // 應該顯示訓練狀態
      await expect(page.locator('.training-status.running')).toBeVisible({ timeout: 3000 })
      await expect(page.locator('.right-panel .panel-header')).toContainText('Pre-Train Process')
    })

    test('should show STOP button during training', async ({ page }) => {
      await page.locator('.action-btn:has-text("START")').click()
      await expect(page.locator('.action-btn:has-text("STOP")')).toBeVisible({ timeout: 3000 })
    })

    test('should display training charts section', async ({ page }) => {
      await page.locator('.action-btn:has-text("START")').click()
      await expect(page.locator('.charts-section')).toBeVisible({ timeout: 3000 })
    })

    test('should display training info section', async ({ page }) => {
      await page.locator('.action-btn:has-text("START")').click()
      await expect(page.locator('.training-info')).toBeVisible({ timeout: 3000 })
      await expect(page.locator('.info-item.highlight')).toContainText('Loss Function')
    })

    test('should stop training when clicking STOP', async ({ page }) => {
      await page.locator('.action-btn:has-text("START")').click()
      await expect(page.locator('.action-btn:has-text("STOP")')).toBeVisible({ timeout: 3000 })

      await page.locator('.action-btn:has-text("STOP")').click()

      // 應該顯示 snackbar 訊息
      await expect(page.locator('.v-snackbar')).toBeVisible({ timeout: 3000 })
    })
  })

  // Scene 視圖測試
  test.describe('Scene View', () => {
    test('should display Scene panel header', async ({ page }) => {
      await page.goto('/projects/3/ai-simulator')
      await expect(page.locator('.ai-simulator-page')).toBeVisible({ timeout: 15000 })

      // 右側面板應該顯示 Scene
      await expect(page.locator('.right-panel .panel-header')).toContainText('Scene')
    })

    test('should display map container', async ({ page }) => {
      await page.goto('/projects/3/ai-simulator')
      await expect(page.locator('.ai-simulator-page')).toBeVisible({ timeout: 15000 })

      await expect(page.locator('.map-container')).toBeVisible()
      await expect(page.locator('#aiSimulatorMap')).toBeVisible()
    })

    test('should display heatmap control', async ({ page }) => {
      await page.goto('/projects/3/ai-simulator')
      await expect(page.locator('.ai-simulator-page')).toBeVisible({ timeout: 15000 })

      await expect(page.locator('.heatmap-control')).toBeVisible()
      await expect(page.locator('.heatmap-switch')).toBeVisible()
    })
  })

  // 其他模型 placeholder 測試
  test.describe('Other Models Placeholder', () => {
    test('should show placeholder for Positioning model', async ({ page }) => {
      await page.goto('/projects/3/ai-simulator')
      await expect(page.locator('.ai-simulator-page')).toBeVisible({ timeout: 15000 })

      await page.locator('.model-btn:has-text("Positioning")').click()

      await expect(page.locator('.left-panel .panel-header')).toContainText('POSITIONING')
      await expect(page.locator('.placeholder-content')).toBeVisible()
    })

    test('should show placeholder for IM model', async ({ page }) => {
      await page.goto('/projects/3/ai-simulator')
      await expect(page.locator('.ai-simulator-page')).toBeVisible({ timeout: 15000 })

      await page.locator('.model-btn:has-text("IM")').click()

      await expect(page.locator('.left-panel .panel-header')).toContainText('IM')
      await expect(page.locator('.placeholder-content')).toBeVisible()
    })
  })
})
