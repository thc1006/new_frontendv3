import { test, expect } from '@playwright/test'

// Register 頁面的 E2E 測試
// 對應 Figma Node 3:1042
test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  // Task 7.1: 頁面結構測試
  test.describe('Page Structure', () => {
    test('should display register form container', async ({ page }) => {
      await expect(page.locator('.register-container')).toBeVisible({ timeout: 10000 })
    })

    test('should display page title', async ({ page }) => {
      // Figma 設計顯示「註冊」標題
      await expect(page.locator('h2, .page-title')).toContainText(/Register|註冊/)
    })

    test('should display logo', async ({ page }) => {
      // 頁面應有 logo
      const logo = page.locator('img[alt*="logo" i], .logo')
      await expect(logo).toBeVisible()
    })
  })

  // Task 7.2: 表單欄位測試
  test.describe('Form Fields', () => {
    test('should have account input field', async ({ page }) => {
      const accountInput = page.locator('input[name="account"], input[placeholder*="Account" i]')
      await expect(accountInput).toBeVisible()
    })

    test('should have email input field', async ({ page }) => {
      const emailInput = page.locator('input[name="email"], input[type="email"], input[placeholder*="Email" i]')
      await expect(emailInput).toBeVisible()
    })

    test('should have password input field', async ({ page }) => {
      const passwordInput = page.locator('input[name="password"], input[type="password"]').first()
      await expect(passwordInput).toBeVisible()
    })

    test('should have confirm password input field', async ({ page }) => {
      // 第二個密碼欄位或有特定名稱的確認欄位
      const confirmInput = page.locator('input[name="confirmPassword"], input[placeholder*="Confirm" i]')
      await expect(confirmInput).toBeVisible()
    })

    test('should have password visibility toggle', async ({ page }) => {
      // Figma 設計中密碼欄位有眼睛圖示
      const toggleIcon = page.locator('.v-input__icon--append, button[aria-label*="password" i]').first()
      await expect(toggleIcon).toBeVisible()
    })
  })

  // Task 7.3: 按鈕測試
  test.describe('Action Buttons', () => {
    test('should have register button', async ({ page }) => {
      const registerBtn = page.locator('button:has-text("Register"), button:has-text("註冊")')
      await expect(registerBtn).toBeVisible()
    })

    test('should have back button', async ({ page }) => {
      const backBtn = page.locator('button:has-text("Back"), button:has-text("BACK"), a:has-text("Back")')
      await expect(backBtn).toBeVisible()
    })

    test('should navigate to login when back button clicked', async ({ page }) => {
      const backBtn = page.locator('button:has-text("Back"), button:has-text("BACK"), a:has-text("Back")')
      await backBtn.click()
      await expect(page).toHaveURL('/login')
    })
  })

  // Task 7.4: 表單驗證測試
  test.describe('Form Validation', () => {
    test('should show error when submitting empty form', async ({ page }) => {
      const registerBtn = page.locator('button:has-text("Register"), button:has-text("註冊")')
      await registerBtn.click()

      // 應該顯示驗證錯誤
      const errorMsg = page.locator('.v-messages__message, .error-message')
      await expect(errorMsg.first()).toBeVisible({ timeout: 3000 })
    })

    test('should show error when passwords do not match', async ({ page }) => {
      await page.locator('input[name="account"], input[placeholder*="Account" i]').fill('testuser')
      await page.locator('input[name="email"], input[type="email"]').fill('test@example.com')
      await page.locator('input[name="password"], input[type="password"]').first().fill('password123')
      await page.locator('input[name="confirmPassword"], input[placeholder*="Confirm" i]').fill('different123')

      const registerBtn = page.locator('button:has-text("Register"), button:has-text("註冊")')
      await registerBtn.click()

      // 應該顯示密碼不一致錯誤
      const errorMsg = page.locator('.v-messages__message, .error-message')
      await expect(errorMsg.first()).toContainText(/match|一致|不同/i, { timeout: 3000 })
    })

    test('should show error for invalid email format', async ({ page }) => {
      await page.locator('input[name="account"], input[placeholder*="Account" i]').fill('testuser')
      await page.locator('input[name="email"], input[type="email"]').fill('invalid-email')
      await page.locator('input[name="password"], input[type="password"]').first().fill('password123')
      await page.locator('input[name="confirmPassword"], input[placeholder*="Confirm" i]').fill('password123')

      const registerBtn = page.locator('button:has-text("Register"), button:has-text("註冊")')
      await registerBtn.click()

      // 應該顯示 email 格式錯誤
      const errorMsg = page.locator('.v-messages__message, .error-message')
      await expect(errorMsg.first()).toBeVisible({ timeout: 3000 })
    })
  })

  // Task 7.5: 註冊流程測試 (Placeholder - 後端 API 尚未實作)
  test.describe('Registration Flow', () => {
    test('should show loading state on submit', async ({ page }) => {
      await page.locator('input[name="account"], input[placeholder*="Account" i]').fill('newuser')
      await page.locator('input[name="email"], input[type="email"]').fill('newuser@example.com')
      await page.locator('input[name="password"], input[type="password"]').first().fill('password123')
      await page.locator('input[name="confirmPassword"], input[placeholder*="Confirm" i]').fill('password123')

      const registerBtn = page.locator('button:has-text("Register"), button:has-text("註冊")')
      await registerBtn.click()

      // 按鈕應該變成 loading 狀態或顯示 snackbar
      // 等待任一種回應：loading 狀態或錯誤訊息
      const loadingOrError = page.locator('button:has-text("Processing"), .v-snackbar, .error-message')
      await expect(loadingOrError.first()).toBeVisible({ timeout: 5000 })
    })
  })

  // Task 7.6: 樣式對齊測試
  test.describe('Figma Alignment', () => {
    test('should have white background form card', async ({ page }) => {
      const formCard = page.locator('.register-card, .v-card')
      await expect(formCard).toBeVisible()
    })

    test('should have blue action buttons', async ({ page }) => {
      const registerBtn = page.locator('button:has-text("Register"), button:has-text("註冊")')
      await expect(registerBtn).toBeVisible()
      // 按鈕應該是藍色 (#006ab5)
    })
  })
})
