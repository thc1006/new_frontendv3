import { test, expect } from '@playwright/test'

// 登入功能的 E2E 測試
test.describe('Login Page', () => {
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
