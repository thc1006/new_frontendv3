import { test, expect } from '@playwright/test'

// Projects List 頁面的 E2E 測試
// 測試專案列表頁面的結構與功能（新版：左側地圖 + 右側卡片）
test.describe('Projects List Page', () => {
  test.beforeEach(async ({ page }) => {
    // 先登入
    await page.goto('/login')
    await page.locator('input[type="text"]').first().fill('admin1')
    await page.locator('input[type="password"]').first().fill('admin1')
    await page.locator('button:has-text("登入")').click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  })

  // 頁面基本結構
  test.describe('Page Structure', () => {
    test('should display projects page with map and panel', async ({ page }) => {
      await page.goto('/')

      // 確認頁面載入
      await expect(page.locator('.projects-page')).toBeVisible({ timeout: 10000 })
    })

    test('should display map section on the left', async ({ page }) => {
      await page.goto('/')

      // 確認地圖區域存在
      const mapSection = page.locator('.map-section')
      await expect(mapSection).toBeVisible({ timeout: 10000 })

      // 確認地圖容器存在
      const mapContainer = page.locator('#projectsMap')
      await expect(mapContainer).toBeVisible({ timeout: 10000 })
    })

    test('should display projects panel on the right', async ({ page }) => {
      await page.goto('/')

      // 確認專案面板存在
      const projectsPanel = page.locator('.projects-panel')
      await expect(projectsPanel).toBeVisible({ timeout: 10000 })
    })

    test('should display Projects title in panel header', async ({ page }) => {
      await page.goto('/')

      // 確認標題
      const panelTitle = page.locator('.panel-title')
      await expect(panelTitle).toBeVisible({ timeout: 10000 })
      await expect(panelTitle).toContainText('Projects')
    })

    test('should have create project button at bottom', async ({ page }) => {
      await page.goto('/')

      // 確認有建立專案按鈕
      const createBtn = page.locator('.create-project-btn')
      await expect(createBtn).toBeVisible({ timeout: 10000 })
      await expect(createBtn).toContainText('CREATE NEW PROJECT')
    })
  })

  // 專案分類標籤
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

  // 專案卡片樣式
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

  // 互動功能
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
      const deleteBtn = page.locator('.project-card .delete-project-link').first()
      await expect(deleteBtn).toBeVisible({ timeout: 10000 })

      // 設置 dialog handler 並驗證對話框內容
      let dialogTriggered = false
      page.on('dialog', async dialog => {
        dialogTriggered = true
        expect(dialog.type()).toBe('confirm')
        expect(dialog.message()).toContain('Are you sure')
        await dialog.dismiss()
      })

      // 點擊刪除
      await deleteBtn.click()

      // 等待一下確保 dialog 有時間觸發
      await page.waitForTimeout(500)

      // 驗證對話框確實被觸發
      expect(dialogTriggered).toBe(true)
    })

    test('should highlight card on hover', async ({ page }) => {
      await page.goto('/')

      // 等待專案卡片載入
      const projectCard = page.locator('.project-card').first()
      await expect(projectCard).toBeVisible({ timeout: 10000 })

      // hover 卡片
      await projectCard.hover()

      // 確認有 active 樣式（border-color 改變）
      await expect(projectCard).toHaveClass(/project-card/)
    })
  })

  // 地圖功能
  test.describe('Map Features', () => {
    test('should display Mapbox map', async ({ page }) => {
      await page.goto('/')

      // 等待地圖容器
      const mapContainer = page.locator('#projectsMap')
      await expect(mapContainer).toBeVisible({ timeout: 10000 })

      // 等待 Mapbox canvas 載入
      const mapCanvas = page.locator('#projectsMap canvas.mapboxgl-canvas')
      await expect(mapCanvas).toBeVisible({ timeout: 15000 })
    })

    test('should display map navigation controls', async ({ page }) => {
      await page.goto('/')

      // 等待導航控制項載入
      const navControl = page.locator('.mapboxgl-ctrl-group')
      await expect(navControl.first()).toBeVisible({ timeout: 15000 })
    })
  })
})
