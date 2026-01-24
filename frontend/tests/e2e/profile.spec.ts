import { test, expect } from '@playwright/test'
import { skipIfNoBackend } from './utils/test-helpers'

// Profile page E2E tests
// 測試個人資料頁面的顯示和密碼修改功能
test.describe('Profile Page', () => {
  skipIfNoBackend()

  test.beforeEach(async ({ page }) => {
    // 先登入
    await page.goto('/login')
    await page.locator('input[type="text"]').first().fill('admin1')
    await page.locator('input[type="password"]').first().fill('admin1')
    await page.locator('button:has-text("Login")').click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  })

  // 頁面結構測試
  test('should navigate to Profile page', async ({ page }) => {
    await page.goto('/profile')
    await expect(page.locator('.profile-container')).toBeVisible({ timeout: 10000 })
  })

  test('should display Profile title', async ({ page }) => {
    await page.goto('/profile')
    await expect(page.locator('.profile-header h2')).toContainText('個人資料')
  })

  test('should display Account info card', async ({ page }) => {
    await page.goto('/profile')
    await expect(page.locator('.profile-container')).toBeVisible({ timeout: 10000 })

    // 檢查帳號資訊卡片存在
    await expect(page.locator('.info-card')).toBeVisible()
    // 檢查帳號標籤存在
    await expect(page.locator('.info-label:has-text("帳號")')).toBeVisible()
    // 檢查帳號值存在
    await expect(page.locator('.info-value').first()).toBeVisible()
  })

  test('should display Security settings card with change password button', async ({ page }) => {
    await page.goto('/profile')
    await expect(page.locator('.profile-container')).toBeVisible({ timeout: 10000 })

    // 檢查安全性設定卡片存在
    await expect(page.locator('.security-card')).toBeVisible()
    // 檢查密碼標籤存在
    await expect(page.locator('.security-label:has-text("密碼")')).toBeVisible()
    // 檢查修改密碼按鈕存在
    await expect(page.locator('button:has-text("修改密碼")')).toBeVisible()
  })

  test('should have Profile link in sidebar menu', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.v-navigation-drawer', { timeout: 10000 })

    const profileLink = page.locator('.v-navigation-drawer .v-list-item:has-text("Profile")')
    await expect(profileLink).toBeVisible()
  })

  // 密碼修改測試
  test('should open change password dialog', async ({ page }) => {
    await page.goto('/profile')
    await expect(page.locator('.profile-container')).toBeVisible({ timeout: 10000 })

    // 點擊修改密碼按鈕
    await page.locator('button:has-text("修改密碼")').click()

    // 檢查對話框開啟
    const dialog = page.locator('.v-dialog:has-text("修改密碼")')
    await expect(dialog).toBeVisible({ timeout: 3000 })
  })

  test('should have password fields in change password dialog', async ({ page }) => {
    await page.goto('/profile')
    await expect(page.locator('.profile-container')).toBeVisible({ timeout: 10000 })

    await page.locator('button:has-text("修改密碼")').click()

    const dialog = page.locator('.v-dialog:has-text("修改密碼")')
    await expect(dialog).toBeVisible({ timeout: 3000 })

    // 檢查有兩個密碼輸入框
    await expect(dialog.locator('input[type="password"]')).toHaveCount(2)
  })

  test('should close change password dialog with cancel button', async ({ page }) => {
    await page.goto('/profile')
    await expect(page.locator('.profile-container')).toBeVisible({ timeout: 10000 })

    await page.locator('button:has-text("修改密碼")').click()

    const dialog = page.locator('.v-dialog:has-text("修改密碼")')
    await expect(dialog).toBeVisible({ timeout: 3000 })

    // 點擊取消
    await dialog.locator('button:has-text("取消")').click()

    // 檢查對話框關閉
    await expect(dialog).not.toBeVisible()
  })

  test('should show validation error when passwords do not match', async ({ page }) => {
    await page.goto('/profile')
    await expect(page.locator('.profile-container')).toBeVisible({ timeout: 10000 })

    await page.locator('button:has-text("修改密碼")').click()

    const dialog = page.locator('.v-dialog:has-text("修改密碼")')
    await expect(dialog).toBeVisible({ timeout: 3000 })

    // 輸入不同的密碼
    const passwordInputs = dialog.locator('input[type="password"]')
    await passwordInputs.nth(0).fill('newpassword123')
    await passwordInputs.nth(1).fill('differentpassword')

    // 點擊確認
    await dialog.locator('button:has-text("確認")').click()

    // 檢查錯誤訊息
    await expect(page.locator('.v-snackbar:has-text("密碼不一致")')).toBeVisible({ timeout: 3000 })
  })

  test('should show validation error when password is too short', async ({ page }) => {
    await page.goto('/profile')
    await expect(page.locator('.profile-container')).toBeVisible({ timeout: 10000 })

    await page.locator('button:has-text("修改密碼")').click()

    const dialog = page.locator('.v-dialog:has-text("修改密碼")')
    await expect(dialog).toBeVisible({ timeout: 3000 })

    // 輸入太短的密碼
    const passwordInputs = dialog.locator('input[type="password"]')
    await passwordInputs.nth(0).fill('12345')
    await passwordInputs.nth(1).fill('12345')

    // 點擊確認
    await dialog.locator('button:has-text("確認")').click()

    // 檢查錯誤訊息
    await expect(page.locator('.v-snackbar:has-text("密碼至少 6 個字元")')).toBeVisible({ timeout: 3000 })
  })
})
