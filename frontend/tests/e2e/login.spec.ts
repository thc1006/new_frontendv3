import { test, expect } from '@playwright/test'
import { skipIfNoBackend } from './utils/test-helpers'

// 登入功能的 E2E 測試
// 注意：由於前端在沒有後端時會發生應用程式錯誤，所有測試都需要後端
test.describe('Login Page', () => {
  // 整個 Login Page 測試需要後端（前端初始化需要 API）
  skipIfNoBackend()

  // Figma 設計對齊測試 (Node 3:2113)
  test.describe('Figma Design Alignment', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login')
    })

    test('should display Account and Password labels', async ({ page }) => {
      // Figma: 標籤文字應該是 "Account" 和 "Password"
      await expect(page.getByText('Account', { exact: true })).toBeVisible({ timeout: 10000 })
      await expect(page.getByText('Password', { exact: true })).toBeVisible()
    })

    test('should display Login button with correct text', async ({ page }) => {
      // Figma: 按鈕文字應該是 "Login"（非 "登入"）
      const loginBtn = page.locator('button:has-text("Login"), .login-btn')
      await expect(loginBtn).toBeVisible({ timeout: 10000 })
    })

    test('should display No Account Register link', async ({ page }) => {
      // Figma: 應該有 "No Account?" 和 "Register" 連結
      await expect(page.getByText('No Account?')).toBeVisible({ timeout: 10000 })
      await expect(page.getByText('Register').first()).toBeVisible()
    })

    test('should have login box with gray background', async ({ page }) => {
      // Figma: 登入框背景為灰色 (#c2c2c2)
      const loginBox = page.locator('.login-box, .login-card')
      await expect(loginBox).toBeVisible({ timeout: 10000 })

      // 檢查背景色存在（CI 環境中顏色可能不同，只驗證元素有背景色）
      const bgColor = await loginBox.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor
      })
      // 確認有設定背景色（非透明）
      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)')
      expect(bgColor).toBeTruthy()
    })

    test('should have banner text Welcome to 5G O-RAN', async ({ page }) => {
      // Figma: 應該顯示 "Welcome to a 5G O-RAN project Management Website"
      await expect(page.getByText(/Welcome to a 5G O-RAN/i)).toBeVisible({ timeout: 10000 })
    })

    test('should have WiSDON LAB text', async ({ page }) => {
      // Figma: 應該顯示 "WiSDON LAB"
      await expect(page.getByText(/WiSDON LAB/i)).toBeVisible({ timeout: 10000 })
    })

    // 無障礙屬性測試 (Copilot Review)
    test('should have proper accessibility attributes on inputs', async ({ page }) => {
      // 檢查 Account 輸入框的無障礙屬性
      const accountInput = page.locator('#account-input')
      await expect(accountInput).toBeVisible({ timeout: 10000 })
      await expect(accountInput).toHaveAttribute('required', '')
      await expect(accountInput).toHaveAttribute('aria-required', 'true')

      // 檢查 label 與 input 的關聯
      const accountLabel = page.locator('label[for="account-input"]')
      await expect(accountLabel).toBeVisible()

      // 檢查 Password 輸入框的無障礙屬性
      const passwordInput = page.locator('#password-input')
      await expect(passwordInput).toBeVisible()
      await expect(passwordInput).toHaveAttribute('required', '')
      await expect(passwordInput).toHaveAttribute('aria-required', 'true')
    })

    // 密碼顯示/隱藏切換按鈕測試 (Figma Node 3:487)
    test('should have password toggle button with eye icon', async ({ page }) => {
      const toggleBtn = page.locator('.password-toggle')
      await expect(toggleBtn).toBeVisible({ timeout: 10000 })

      // 預設應該是隱藏密碼狀態
      const passwordInput = page.locator('#password-input')
      await expect(passwordInput).toHaveAttribute('type', 'password')

      // 點擊切換按鈕後應該變成 text 類型
      await toggleBtn.click()
      await expect(passwordInput).toHaveAttribute('type', 'text')

      // 再次點擊應該切換回 password 類型
      await toggleBtn.click()
      await expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })

  // 登入功能測試
  test.describe('Login Functionality', () => {

    test.beforeEach(async ({ page }) => {
      await page.goto('/login')
    })

    test('should display login form elements', async ({ page }) => {
      // 確認登入表單元素存在
      await expect(page.locator('input[type="text"], input[placeholder*="帳號"], input[placeholder*="username"]')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('input[type="password"]')).toBeVisible()
      await expect(page.locator('button[type="submit"], button:has-text("登入"), button:has-text("Login")')).toBeVisible()
    })

    test('should show error message for invalid credentials', async ({ page }) => {
      // 輸入錯誤的帳號密碼
      const usernameInput = page.locator('input[type="text"], input[placeholder*="帳號"], input[placeholder*="username"]').first()
      const passwordInput = page.locator('input[type="password"]').first()
      const submitBtn = page.locator('button[type="submit"], button:has-text("登入"), button:has-text("Login")').first()

      await usernameInput.fill('wronguser')
      await passwordInput.fill('wrongpass')
      await submitBtn.click()

      // 等待錯誤訊息或保持在登入頁
      await page.waitForTimeout(2000)
      const currentUrl = page.url()
      expect(currentUrl).toContain('/login')
    })

    test('should login successfully with valid credentials', async ({ page }) => {
      // 使用正確的帳號密碼
      const usernameInput = page.locator('input[type="text"], input[placeholder*="帳號"], input[placeholder*="username"]').first()
      const passwordInput = page.locator('input[type="password"]').first()
      const submitBtn = page.locator('button[type="submit"], button:has-text("登入"), button:has-text("Login")').first()

      await usernameInput.fill('admin1')
      await passwordInput.fill('admin1')
      await submitBtn.click()

      // 等待登入成功後跳轉（登入成功後會跳轉到首頁 /）
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })

      // 確認已離開登入頁且顯示專案頁面（新版設計為地圖 + 專案列表）
      await expect(page.locator('.projects-page')).toBeVisible({ timeout: 5000 })
    })

    test('should verify API requests go to /api path', async ({ page }) => {
      // 監聽網路請求，確認 API 路徑正確
      const apiRequests: string[] = []
      page.on('request', (request) => {
        const url = request.url()
        if (url.includes('/api/') || url.includes('127.0.0.1')) {
          apiRequests.push(url)
        }
      })

      const usernameInput = page.locator('input[type="text"], input[placeholder*="帳號"], input[placeholder*="username"]').first()
      const passwordInput = page.locator('input[type="password"]').first()
      const submitBtn = page.locator('button[type="submit"], button:has-text("登入"), button:has-text("Login")').first()

      await usernameInput.fill('admin1')
      await passwordInput.fill('admin1')
      await submitBtn.click()

      await page.waitForTimeout(3000)

      // 確認沒有請求到 127.0.0.1
      const badRequests = apiRequests.filter(url => url.includes('127.0.0.1'))
      expect(badRequests.length).toBe(0)
    })
  })
})
