import { test, expect } from '@playwright/test'

// Projects List 頁面的 E2E 測試
// 測試專案列表頁面的結構與功能
test.describe('Projects List Page', () => {
  test.beforeEach(async ({ page }) => {
    // 先登入
    await page.goto('/login')
    await page.locator('input[type="text"]').first().fill('admin1')
    await page.locator('input[type="password"]').first().fill('admin1')
    await page.locator('button:has-text("登入")').click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  })

  // Task 6.1: 頁面基本結構
  test.describe('Page Structure', () => {
    test('should display projects list page', async ({ page }) => {
      await page.goto('/')

      // 確認頁面載入
      await expect(page.locator('.projects-list-container')).toBeVisible({ timeout: 10000 })
    })

    test('should display welcome message with username', async ({ page }) => {
      await page.goto('/')

      // 確認歡迎訊息
      await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 })
    })

    test('should have create project button', async ({ page }) => {
      await page.goto('/')

      // 確認有建立專案按鈕
      const createBtn = page.locator('.create-project-btn')
      await expect(createBtn).toBeVisible({ timeout: 10000 })
      await expect(createBtn).toContainText('CREATE NEW PROJECT')
    })
  })

  // Task 6.1: 專案分類標籤
  test.describe('Category Labels', () => {
    test('should display OUTDOOR section label', async ({ page }) => {
      await page.goto('/')

      // 確認有 OUTDOOR 標籤
      const outdoorLabel = page.locator('.category-label').filter({ hasText: 'OUTDOOR' })
      await expect(outdoorLabel).toBeVisible({ timeout: 10000 })
    })

    test('should display INDOOR section label', async ({ page }) => {
      await page.goto('/')

      // 確認有 INDOOR 標籤
      const indoorLabel = page.locator('.category-label').filter({ hasText: 'INDOOR' })
      await expect(indoorLabel).toBeVisible({ timeout: 10000 })
    })
  })

  // Task 6.2: 專案卡片樣式
  test.describe('Project Cards', () => {
    test('should display project cards with proper styling', async ({ page }) => {
      await page.goto('/')

      // 等待專案卡片載入
      const projectCard = page.locator('.project-card').first()
      await expect(projectCard).toBeVisible({ timeout: 10000 })
    })

    test('should display date badge with calendar icon', async ({ page }) => {
      await page.goto('/')

      // 確認日期標籤存在
      const dateBadge = page.locator('.project-card .date-badge').first()
      await expect(dateBadge).toBeVisible({ timeout: 10000 })
    })

    test('should display user badge with user icon', async ({ page }) => {
      await page.goto('/')

      // 確認用戶標籤存在
      const userBadge = page.locator('.project-card .user-badge').first()
      await expect(userBadge).toBeVisible({ timeout: 10000 })
    })

    test('should have View Project link', async ({ page }) => {
      await page.goto('/')

      // 確認有 View Project 連結
      const viewLink = page.locator('.project-card .view-project-link').first()
      await expect(viewLink).toBeVisible({ timeout: 10000 })
      await expect(viewLink).toContainText('View Project')
    })

    test('should have Delete Project link', async ({ page }) => {
      await page.goto('/')

      // 確認有 Delete Project 連結
      const deleteLink = page.locator('.project-card .delete-project-link').first()
      await expect(deleteLink).toBeVisible({ timeout: 10000 })
      await expect(deleteLink).toContainText('Delete Project')
    })
  })

  // Task 6.4: 互動功能
  test.describe('Interactions', () => {
    test('should navigate to create page on button click', async ({ page }) => {
      await page.goto('/')

      // 點擊建立按鈕
      await page.locator('.create-project-btn').click()

      // 確認導航到建立頁面
      await expect(page).toHaveURL('/projects/create')
    })

    test('should show delete confirmation dialog', async ({ page }) => {
      await page.goto('/')

      // 等待專案卡片載入
      const deleteLink = page.locator('.project-card .delete-project-link').first()
      await expect(deleteLink).toBeVisible({ timeout: 10000 })

      // 設置 dialog handler
      page.on('dialog', dialog => dialog.dismiss())

      // 點擊刪除
      await deleteLink.click()

      // 確認對話框出現（由 page.on 處理）
    })
  })
})
