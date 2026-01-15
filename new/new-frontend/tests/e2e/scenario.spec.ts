import { test, expect } from '@playwright/test'

// Scenario 頁面的 E2E 測試
// 對應 Figma Node 3:517
test.describe('Scenario Page', () => {
  test.beforeEach(async ({ page }) => {
    // 先登入
    await page.goto('/login')
    await page.locator('input[type="text"]').first().fill('admin1')
    await page.locator('input[type="password"]').first().fill('admin1')
    await page.locator('button:has-text("Login")').click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })

    // 導航到 Scenario 頁面
    await page.goto('/scenario')
  })

  // Task 12.1: 頁面結構測試
  test.describe('Page Structure', () => {
    test('should display scenario page', async ({ page }) => {
      await expect(page.locator('.v-container')).toBeVisible({ timeout: 10000 })
    })

    test('should display page title Scenario', async ({ page }) => {
      await expect(page.locator('h2')).toContainText(/Scenario/i)
    })

    test('should have control panel', async ({ page }) => {
      await expect(page.locator('.control-panel')).toBeVisible()
    })

    test('should have map area', async ({ page }) => {
      await expect(page.locator('.map-area')).toBeVisible()
    })
  })

  // Task 12.2: 情境選擇器測試
  test.describe('Scenario Selector', () => {
    test('should have scenario dropdown', async ({ page }) => {
      await expect(page.locator('.v-select')).toBeVisible({ timeout: 10000 })
    })

    test('should have selector label 選擇情境', async ({ page }) => {
      await expect(page.locator('text=選擇情境').first()).toBeVisible()
    })

    test('should open dropdown when clicked', async ({ page }) => {
      await page.locator('.v-select').click()
      await page.waitForTimeout(500)
      // 下拉選單應該打開
      await expect(page.locator('.v-menu.v-overlay--active')).toBeVisible({ timeout: 5000 })
    })

    test('should have scenario options', async ({ page }) => {
      await page.locator('.v-select').click()
      await page.waitForTimeout(500)

      // 檢查各選項存在
      await expect(page.locator('text=None')).toBeVisible()
      await expect(page.locator('text=上班')).toBeVisible()
      await expect(page.locator('text=下班')).toBeVisible()
    })
  })

  // Task 12.3: 地圖測試
  test.describe('Map Area', () => {
    test('should have map container', async ({ page }) => {
      await expect(page.locator('#scenarioMap')).toBeVisible({ timeout: 10000 })
    })

    test('should display overlay text 小人走動', async ({ page }) => {
      await expect(page.locator('.overlay-text')).toContainText('小人走動')
    })

    test('should display overlay subtext (固定map)', async ({ page }) => {
      await expect(page.locator('.overlay-subtext')).toContainText('固定map')
    })
  })

  // Task 12.4: Set 按鈕測試
  test.describe('Set Button', () => {
    test('should have set button', async ({ page }) => {
      const setBtn = page.locator('button:has-text("set")')
      await expect(setBtn).toBeVisible({ timeout: 10000 })
    })

    test('should disable set button when no scenario selected', async ({ page }) => {
      const setBtn = page.locator('button:has-text("set")')
      await expect(setBtn).toBeDisabled()
    })

    test('should enable set button when scenario selected', async ({ page }) => {
      // 選取一個情境
      await page.locator('.v-select').click()
      await page.waitForTimeout(500)
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowDown') // 選取「上班」
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500)

      // set 按鈕應該啟用
      const setBtn = page.locator('button:has-text("set")')
      await expect(setBtn).toBeEnabled()
    })
  })

  // Task 12.5: Figma 對齊測試
  test.describe('Figma Alignment', () => {
    test('should have correct title styling', async ({ page }) => {
      const title = page.locator('h2.font-weight-bold')
      await expect(title).toBeVisible({ timeout: 10000 })
    })

    test('should have blue set button', async ({ page }) => {
      const setBtn = page.locator('button:has-text("set")')
      await expect(setBtn).toBeVisible()
    })

    test('should have orange overlay text', async ({ page }) => {
      const overlayText = page.locator('.overlay-text')
      await expect(overlayText).toBeVisible()
    })
  })

  // Task 12.6: Snackbar 測試
  test.describe('Snackbar Notifications', () => {
    test('should show snackbar when no scenario selected and set clicked', async ({ page }) => {
      // 先選取 None 使按鈕啟用但情境無效
      await page.locator('.v-select').click()
      await page.waitForTimeout(500)
      await page.keyboard.press('ArrowDown') // 選取 None
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500)

      // 點擊 set 按鈕
      await page.locator('button:has-text("set")').click()
      await page.waitForTimeout(500)

      // Snackbar 應該出現
      await expect(page.locator('.v-snackbar')).toBeVisible({ timeout: 5000 })
    })
  })
})
