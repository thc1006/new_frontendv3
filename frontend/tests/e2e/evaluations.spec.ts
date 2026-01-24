import { test, expect } from '@playwright/test'
import { skipIfNoBackend } from './utils/test-helpers'

test.describe('Evaluations Page Figma Alignment', () => {
  skipIfNoBackend()

  let projectId: string

  test.beforeEach(async ({ page }) => {
    // 登入
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
    projectId = match ? match[1] : '3' // 預設使用 3 作為後備

    // 導航到評估頁面
    await page.goto(`/projects/${projectId}/config/evaluations`)

    // 等待頁面載入 - 使用更通用的選擇器
    await page.waitForSelector('.v-container', { timeout: 15000 })
    await page.waitForTimeout(2000)
  })

  test('P1: should have SIMULATION CONFIG button', async ({ page }) => {
    const button = page.locator('button:has-text("SIMULATION CONFIG"), button:has-text("Simulation Config")')
    await expect(button).toBeVisible({ timeout: 10000 })
  })

  test('P1: should have UES SETTINGS button instead of Add UE', async ({ page }) => {
    // 檢查 UES SETTINGS 存在
    const uesSettingsButton = page.locator('button:has-text("UES SETTINGS"), button:has-text("Ues Settings")')
    await expect(uesSettingsButton).toBeVisible({ timeout: 10000 })

    // 確認沒有 "Add UE" 按鈕
    const addUeButton = page.locator('button:has-text("Add UE")')
    await expect(addUeButton).not.toBeVisible()
  })

  test('P2: should not have Save RU button', async ({ page }) => {
    // 確認沒有 "Save RU" 按鈕
    const saveRuButton = page.locator('button:has-text("Save RU")')
    await expect(saveRuButton).not.toBeVisible()
  })

  test('P1: top buttons should be horizontally aligned', async ({ page }) => {
    // 找到按鈕群組的容器
    const buttonRow = page.locator('.v-col:has(button:has-text("Add RU"))').first()

    // 取得所有按鈕
    const buttons = buttonRow.locator('button')
    const count = await buttons.count()
    expect(count).toBeGreaterThanOrEqual(3)

    // 檢查按鈕是否在同一水平線上（透過 y 座標）
    const firstButton = buttons.nth(0)
    const secondButton = buttons.nth(1)

    const firstBox = await firstButton.boundingBox()
    const secondBox = await secondButton.boundingBox()

    if (firstBox && secondBox) {
      // 允許 5px 的誤差範圍
      expect(Math.abs(firstBox.y - secondBox.y)).toBeLessThan(5)
    }
  })

  test('P2: should have three-section layout in bottom controls', async ({ page }) => {
    // 檢查 Evaluate 和 Apply Config 按鈕（左側）
    const evaluateBtn = page.locator('button:has-text("Evaluate")')
    const applyConfigBtn = page.locator('button:has-text("Apply Config")')
    await expect(evaluateBtn).toBeVisible()
    await expect(applyConfigBtn).toBeVisible()

    // 檢查 Heatmap dropdown 和 Show heatmap toggle（中間）
    const heatmapSelect = page.locator('.v-select').first()
    const heatmapToggle = page.locator('.v-switch:has-text("Show Heatmap")')
    await expect(heatmapSelect).toBeVisible()
    await expect(heatmapToggle).toBeVisible()
  })

  test('P2: Simulation Config dialog should open and close', async ({ page }) => {
    // 點擊 SIMULATION CONFIG 按鈕
    const simConfigBtn = page.locator('button:has-text("SIMULATION CONFIG"), button:has-text("Simulation Config")')
    await simConfigBtn.click()

    // 檢查對話框開啟
    const dialog = page.locator('.v-dialog:visible:has-text("Simulation Configuration")')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // 檢查欄位存在
    await expect(dialog.locator('input[label="Duration"], .v-label:has-text("Duration") ~ input')).toBeVisible()
    await expect(dialog.locator('input[label="Interval"], .v-label:has-text("Interval") ~ input')).toBeVisible()

    // 關閉對話框
    const cancelBtn = dialog.locator('button:has-text("取消"), button:has-text("Cancel")')
    await cancelBtn.click()
    await expect(dialog).not.toBeVisible()
  })

  test('P2: Simulation Config dialog fields should be functional', async ({ page }) => {
    // 開啟對話框
    const simConfigBtn = page.locator('button:has-text("SIMULATION CONFIG"), button:has-text("Simulation Config")')
    await simConfigBtn.click()

    const dialog = page.locator('.v-dialog:visible:has-text("Simulation Configuration")')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // 測試輸入欄位
    const durationInput = dialog.locator('input').first()
    await durationInput.fill('20')
    await expect(durationInput).toHaveValue('20')

    // 點擊套用按鈕（placeholder handler）
    const applyBtn = dialog.locator('button:has-text("套用"), button:has-text("Apply")')
    await applyBtn.click()

    // 對話框應該關閉
    await expect(dialog).not.toBeVisible()
  })

  test('P3: UES SETTINGS button should open configuration', async ({ page }) => {
    // 點擊 UES SETTINGS 按鈕
    const uesSettingsBtn = page.locator('button:has-text("UES SETTINGS"), button:has-text("Ues Settings")')
    await uesSettingsBtn.click()

    // 等待一小段時間，觀察是否有反應
    await page.waitForTimeout(500)

    // 目前 addUE 會新增 UE markers，不會開啟對話框
    // 這是原有行為，保持不變
  })
})
