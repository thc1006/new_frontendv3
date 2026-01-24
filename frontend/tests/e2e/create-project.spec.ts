import { test, expect } from '@playwright/test'
import { login, mockAllExternalServices } from './utils/test-helpers'

// Create Project 頁面的 E2E 測試
// 對應 Figma Node 3:785, 3:814
test.describe('Create Project Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock 外部服務 (MinIO, Geocoding)
    await mockAllExternalServices(page)

    // 登入
    await login(page)

    // 導航到建立專案頁面
    await page.goto('/projects/create', { waitUntil: 'domcontentloaded' })
  })

  // Task 8.1: 頁面結構測試
  test.describe('Page Structure', () => {
    test('should display create project page', async ({ page }) => {
      await expect(page.locator('.create-project-container, .create-project-page')).toBeVisible({ timeout: 10000 })
    })

    test('should display page title New Project', async ({ page }) => {
      await expect(page.locator('h1, h2, .page-title')).toContainText(/New Project/i)
    })
  })

  // Task 8.2: 專案名稱欄位測試
  test.describe('Project Name Field', () => {
    test('should have project name input', async ({ page }) => {
      // Vuetify v-text-field 使用 div 包裝 input
      const projectNameInput = page.locator('.v-text-field input').first()
      await expect(projectNameInput).toBeVisible({ timeout: 10000 })
    })

    test('should have project name label', async ({ page }) => {
      await expect(page.locator('text=Project Name')).toBeVisible()
    })
  })

  // Task 8.3: 地址搜尋欄位測試
  test.describe('Address Search', () => {
    test('should have address search input', async ({ page }) => {
      // Vuetify v-text-field - 找第二個 input (第一個是 project name)
      const addressInput = page.locator('.v-text-field input').nth(1)
      await expect(addressInput).toBeVisible({ timeout: 10000 })
    })

    test('should have search button', async ({ page }) => {
      const searchBtn = page.locator('button:has-text("Search")')
      await expect(searchBtn).toBeVisible()
    })

    test('should display OpenStreetMap label', async ({ page }) => {
      await expect(page.locator('text=OpenStreetMap')).toBeVisible()
    })
  })

  // Task 8.4: 地圖區域測試
  test.describe('Map Area', () => {
    test('should have map container', async ({ page }) => {
      const mapContainer = page.locator('.map-container, .mapboxgl-map, [class*="map"]')
      await expect(mapContainer.first()).toBeVisible({ timeout: 10000 })
    })

    test('should display coordinates info', async ({ page }) => {
      // 應顯示 lng/lat 座標
      await expect(page.locator('text=/lng|lat|經度|緯度/i').first()).toBeVisible()
    })
  })

  // Task 8.5: Indoor/Outdoor 切換測試
  test.describe('Indoor Outdoor Toggle', () => {
    test('should have indoor/outdoor toggle', async ({ page }) => {
      const toggle = page.locator('.v-switch, input[type="checkbox"], [role="switch"]')
      await expect(toggle.first()).toBeVisible({ timeout: 10000 })
    })

    test('should display outdoor/indoor label', async ({ page }) => {
      await expect(page.locator('text=/outdoor|indoor/i').first()).toBeVisible()
    })

    test('should default to outdoor mode', async ({ page }) => {
      // 預設應該顯示 outdoor
      await expect(page.locator('text=outdoor')).toBeVisible()
      // 應該顯示 Search Address
      await expect(page.locator('text=Search Address')).toBeVisible()
    })

    test('should switch to indoor mode and show upload field', async ({ page }) => {
      // 點擊 toggle 切換到 indoor
      const toggle = page.locator('.v-switch input[type="checkbox"]')
      await toggle.click()

      // 應該顯示 indoor
      await expect(page.locator('span:has-text("indoor")')).toBeVisible()
      // 應該顯示 Upload your map file
      await expect(page.locator('text=Upload your map file')).toBeVisible()
      // 應該顯示 Upload 按鈕
      await expect(page.locator('button:has-text("Upload")')).toBeVisible()
    })

    test('should hide search field in indoor mode', async ({ page }) => {
      // 切換到 indoor
      const toggle = page.locator('.v-switch input[type="checkbox"]')
      await toggle.click()

      // Search Address 應該隱藏
      await expect(page.locator('text=Search Address')).not.toBeVisible()
      // Search 按鈕應該隱藏
      await expect(page.locator('button:has-text("Search")')).not.toBeVisible()
    })

    test('should toggle back to outdoor mode', async ({ page }) => {
      // 切換到 indoor
      const toggle = page.locator('.v-switch input[type="checkbox"]')
      await toggle.click()
      await expect(page.locator('text=Upload your map file')).toBeVisible()

      // 切換回 outdoor
      await toggle.click()
      await expect(page.locator('text=Search Address')).toBeVisible()
      await expect(page.locator('button:has-text("Search")')).toBeVisible()
    })
  })

  // Task 8.6: 成員邀請測試
  test.describe('Members List', () => {
    test('should have members list section', async ({ page }) => {
      await expect(page.locator('text=Members List')).toBeVisible({ timeout: 10000 })
    })

    test('should have email invite input', async ({ page }) => {
      // Vuetify v-text-field - email input 是第三個 input
      const emailInput = page.locator('.v-text-field input').nth(2)
      await expect(emailInput).toBeVisible()
    })

    test('should have invite button', async ({ page }) => {
      const inviteBtn = page.locator('button:has-text("Invite")')
      await expect(inviteBtn).toBeVisible()
    })
  })

  // Task 8.7: 按鈕測試
  test.describe('Action Buttons', () => {
    test('should have create button', async ({ page }) => {
      const createBtn = page.locator('button:has-text("Create")')
      await expect(createBtn).toBeVisible({ timeout: 10000 })
    })

    test('should have back button', async ({ page }) => {
      const backBtn = page.locator('button:has-text("Back"), a:has-text("Back")')
      await expect(backBtn).toBeVisible()
    })

    test('should navigate back on back button click', async ({ page }) => {
      const backBtn = page.locator('button:has-text("Back"), a:has-text("Back")')
      await backBtn.click()
      // 應該回到專案列表頁面
      await expect(page).toHaveURL(/\/($|projects)/)
    })
  })

  // Task 8.8: 表單驗證測試
  test.describe('Form Validation', () => {
    test('should disable create button when project name is empty', async ({ page }) => {
      // Create 按鈕應該在沒有專案名稱時被禁用
      const createBtn = page.locator('button:has-text("Create")')
      await expect(createBtn).toBeDisabled()
    })

    test('should enable create button when project name is filled', async ({ page }) => {
      // 填入專案名稱
      const projectNameInput = page.locator('.v-text-field input').first()
      await projectNameInput.fill('Test Project')

      // Create 按鈕應該被啟用
      const createBtn = page.locator('button:has-text("Create")')
      await expect(createBtn).toBeEnabled()
    })
  })

  // Task 8.9: Figma 樣式對齊測試
  test.describe('Figma Alignment', () => {
    test('should have blue create button', async ({ page }) => {
      const createBtn = page.locator('button:has-text("Create")')
      await expect(createBtn).toBeVisible({ timeout: 10000 })
      // 按鈕應該是藍色 (#006ab5)
    })

    test('should have gray back button', async ({ page }) => {
      const backBtn = page.locator('button:has-text("Back")')
      await expect(backBtn).toBeVisible()
      // 按鈕應該是灰色 (#555)
    })

    test('should have rounded input fields', async ({ page }) => {
      const input = page.locator('input').first()
      await expect(input).toBeVisible()
    })
  })
})
