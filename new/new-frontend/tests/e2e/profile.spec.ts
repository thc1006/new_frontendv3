import { test, expect } from '@playwright/test'

// Profile 頁面的 E2E 測試
// 測試用戶資料顯示和修改密碼功能
test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    // 先登入
    await page.goto('/login')
    await page.locator('input[type="text"]').first().fill('admin1')
    await page.locator('input[type="password"]').first().fill('admin1')
    await page.locator('button:has-text("登入")').click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  })

  // Phase 3.1: Profile 頁面測試
  test('should navigate to Profile page', async ({ page }) => {
    await page.goto('/profile')

    // 確認頁面載入
    await expect(page.locator('.profile-container')).toBeVisible({ timeout: 10000 })
  })

  test('should display user information', async ({ page }) => {
    await page.goto('/profile')

    await expect(page.locator('.profile-container')).toBeVisible({ timeout: 10000 })

    // 確認有用戶資訊區塊
    await expect(page.locator('.user-info-section')).toBeVisible()

    // 確認顯示帳號標籤
    await expect(page.locator('.info-label:has-text("帳號")')).toBeVisible()

    // 確認顯示電子郵件標籤
    await expect(page.locator('.info-label:has-text("電子郵件")')).toBeVisible()
  })

  test('should display user role', async ({ page }) => {
    await page.goto('/profile')

    await expect(page.locator('.profile-container')).toBeVisible({ timeout: 10000 })

    // 確認顯示角色
    await expect(page.locator('text=角色')).toBeVisible()
  })

  test('should have Profile link in sidebar menu', async ({ page }) => {
    // 進入首頁
    await page.goto('/')
    await page.waitForSelector('.v-navigation-drawer', { timeout: 10000 })

    // 確認 Profile 選單項目存在（使用 v-list-item 定位）
    const profileLink = page.locator('.v-navigation-drawer .v-list-item:has-text("Profile")')
    await expect(profileLink).toBeVisible()
  })

  // Phase 3.2: 修改密碼測試
  test('should have change password button', async ({ page }) => {
    await page.goto('/profile')

    await expect(page.locator('.profile-container')).toBeVisible({ timeout: 10000 })

    // 確認有修改密碼按鈕
    await expect(page.locator('button:has-text("修改密碼")')).toBeVisible()
  })

  test('should open change password dialog', async ({ page }) => {
    await page.goto('/profile')

    await expect(page.locator('.profile-container')).toBeVisible({ timeout: 10000 })

    // 點擊修改密碼按鈕
    await page.locator('button:has-text("修改密碼")').click()

    // 確認對話框開啟
    const dialog = page.locator('.v-dialog:has-text("修改密碼")')
    await expect(dialog).toBeVisible({ timeout: 3000 })
  })

  test('should have password fields in change password dialog', async ({ page }) => {
    await page.goto('/profile')

    await expect(page.locator('.profile-container')).toBeVisible({ timeout: 10000 })

    // 點擊修改密碼按鈕
    await page.locator('button:has-text("修改密碼")').click()

    // 確認對話框開啟
    const dialog = page.locator('.v-dialog:has-text("修改密碼")')
    await expect(dialog).toBeVisible({ timeout: 3000 })

    // 確認有新密碼和確認密碼輸入欄
    await expect(dialog.locator('input[type="password"]')).toHaveCount(2)
  })

  test('should close change password dialog with cancel button', async ({ page }) => {
    await page.goto('/profile')

    await expect(page.locator('.profile-container')).toBeVisible({ timeout: 10000 })

    // 點擊修改密碼按鈕
    await page.locator('button:has-text("修改密碼")').click()

    // 確認對話框開啟
    const dialog = page.locator('.v-dialog:has-text("修改密碼")')
    await expect(dialog).toBeVisible({ timeout: 3000 })

    // 點擊取消
    await dialog.locator('button:has-text("取消")').click()

    // 確認對話框關閉
    await expect(dialog).not.toBeVisible()
  })

  test('should show validation error when passwords do not match', async ({ page }) => {
    await page.goto('/profile')

    await expect(page.locator('.profile-container')).toBeVisible({ timeout: 10000 })

    // 點擊修改密碼按鈕
    await page.locator('button:has-text("修改密碼")').click()

    // 確認對話框開啟
    const dialog = page.locator('.v-dialog:has-text("修改密碼")')
    await expect(dialog).toBeVisible({ timeout: 3000 })

    // 輸入不同的密碼
    const passwordInputs = dialog.locator('input[type="password"]')
    await passwordInputs.nth(0).fill('newpassword123')
    await passwordInputs.nth(1).fill('differentpassword')

    // 點擊確認
    await dialog.locator('button:has-text("確認")').click()

    // 確認顯示 snackbar 錯誤訊息
    await expect(page.locator('.v-snackbar:has-text("密碼不一致")')).toBeVisible({ timeout: 3000 })
  })

  test('should show validation error when password is too short', async ({ page }) => {
    await page.goto('/profile')

    await expect(page.locator('.profile-container')).toBeVisible({ timeout: 10000 })

    // 點擊修改密碼按鈕
    await page.locator('button:has-text("修改密碼")').click()

    // 確認對話框開啟
    const dialog = page.locator('.v-dialog:has-text("修改密碼")')
    await expect(dialog).toBeVisible({ timeout: 3000 })

    // 輸入過短的密碼
    const passwordInputs = dialog.locator('input[type="password"]')
    await passwordInputs.nth(0).fill('12345')
    await passwordInputs.nth(1).fill('12345')

    // 點擊確認
    await dialog.locator('button:has-text("確認")').click()

    // 確認顯示 snackbar 錯誤訊息
    await expect(page.locator('.v-snackbar:has-text("密碼至少 6 個字元")')).toBeVisible({ timeout: 3000 })
  })
})
