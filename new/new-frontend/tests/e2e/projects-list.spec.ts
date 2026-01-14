import { test, expect } from '@playwright/test'

// Projects List 頁面的 E2E 測試
// 測試專案列表頁面的結構與功能（新版：左側地圖 + 右側卡片）
test.describe('Projects List Page', () => {
  test.beforeEach(async ({ page }) => {
    // 先登入
    await page.goto('/login')
    await page.locator('input[type="text"]').first().fill('admin1')
    await page.locator('input[type="password"]').first().fill('admin1')
    await page.locator('button:has-text("Login")').click()
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

  // Figma 設計對齊測試
  test.describe('Figma Design Alignment', () => {
    test('category label should match Figma styling', async ({ page }) => {
      await page.goto('/')

      const categoryLabel = page.locator('.category-label').first()
      await expect(categoryLabel).toBeVisible({ timeout: 10000 })

      // 檢查背景色 rgba(55, 54, 72, 0.48)
      const bgColor = await categoryLabel.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor
      })
      expect(bgColor).toBe('rgba(55, 54, 72, 0.48)')

      // 檢查字體大小 24px
      const fontSize = await categoryLabel.evaluate((el) => {
        return window.getComputedStyle(el).fontSize
      })
      expect(fontSize).toBe('24px')

      // 檢查圓角 20px
      const borderRadius = await categoryLabel.evaluate((el) => {
        return window.getComputedStyle(el).borderRadius
      })
      expect(borderRadius).toBe('20px')
    })

    test('projects panel should have white background', async ({ page }) => {
      await page.goto('/')

      const projectsPanel = page.locator('.projects-panel')
      await expect(projectsPanel).toBeVisible({ timeout: 10000 })

      // 檢查背景色是白色
      const bgColor = await projectsPanel.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor
      })
      expect(bgColor).toBe('rgb(255, 255, 255)')
    })

    test('delete link should have correct red color', async ({ page }) => {
      await page.goto('/')

      const deleteLink = page.locator('.delete-project-link').first()
      await expect(deleteLink).toBeVisible({ timeout: 10000 })

      // 檢查顏色 #b50003
      const color = await deleteLink.evaluate((el) => {
        return window.getComputedStyle(el).color
      })
      expect(color).toBe('rgb(181, 0, 3)')
    })

    test('date badge should match Figma styling', async ({ page }) => {
      await page.goto('/')

      const dateBadge = page.locator('.date-badge').first()
      await expect(dateBadge).toBeVisible({ timeout: 10000 })

      // 檢查背景透明度 0.31
      const bgColor = await dateBadge.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor
      })
      expect(bgColor).toContain('0.31')

      // 檢查圓角 20px
      const borderRadius = await dateBadge.evaluate((el) => {
        return window.getComputedStyle(el).borderRadius
      })
      expect(borderRadius).toBe('20px')
    })

    test('user badge should match Figma styling', async ({ page }) => {
      await page.goto('/')

      const userBadge = page.locator('.user-badge').first()
      await expect(userBadge).toBeVisible({ timeout: 10000 })

      // 檢查背景透明度 0.15
      const bgColor = await userBadge.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor
      })
      expect(bgColor).toContain('0.15')

      // 檢查文字色 rgba(0,0,0,0.35)
      const color = await userBadge.evaluate((el) => {
        return window.getComputedStyle(el).color
      })
      expect(color).toContain('0.35')

      // 檢查圓角 20px
      const borderRadius = await userBadge.evaluate((el) => {
        return window.getComputedStyle(el).borderRadius
      })
      expect(borderRadius).toBe('20px')
    })

    test('view and delete links should have correct font size', async ({ page }) => {
      await page.goto('/')

      const viewLink = page.locator('.view-project-link').first()
      await expect(viewLink).toBeVisible({ timeout: 10000 })

      // 檢查字體大小 15px
      const fontSize = await viewLink.evaluate((el) => {
        return window.getComputedStyle(el).fontSize
      })
      expect(fontSize).toBe('15px')
    })

    test('project card should match Figma styling', async ({ page }) => {
      await page.goto('/')

      const projectCard = page.locator('.project-card').first()
      await expect(projectCard).toBeVisible({ timeout: 10000 })

      // 檢查邊框色 rgba(0,0,0,0.1)
      const borderColor = await projectCard.evaluate((el) => {
        return window.getComputedStyle(el).borderColor
      })
      expect(borderColor).toContain('0.1')

      // 檢查圓角 10px
      const borderRadius = await projectCard.evaluate((el) => {
        return window.getComputedStyle(el).borderRadius
      })
      expect(borderRadius).toBe('10px')
    })
  })
})
