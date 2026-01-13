import { test, expect } from '@playwright/test'

// 導航選單的 E2E 測試
// 測試側邊欄選單結構與導航功能
test.describe('Navigation Menu', () => {
  test.beforeEach(async ({ page }) => {
    // 先登入
    await page.goto('/login')
    await page.locator('input[type="text"]').first().fill('admin1')
    await page.locator('input[type="password"]').first().fill('admin1')
    await page.locator('button:has-text("登入")').click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  })

  test.describe('Main Menu (No project context)', () => {
    test('should display Profile link in main menu', async ({ page }) => {
      await page.goto('/')
      await page.waitForSelector('.v-navigation-drawer', { timeout: 10000 })

      // 點開選單
      await page.locator('.v-app-bar-nav-icon').click()
      await page.waitForSelector('.v-navigation-drawer.v-navigation-drawer--active', { timeout: 5000 })

      const profileLink = page.locator('.v-navigation-drawer .v-list-item:has-text("Profile")')
      await expect(profileLink).toBeVisible()
    })

    test('should navigate to Profile page from main menu', async ({ page }) => {
      await page.goto('/')

      // 點開選單
      await page.locator('.v-app-bar-nav-icon').click()
      await page.waitForSelector('.v-navigation-drawer.v-navigation-drawer--active', { timeout: 5000 })

      // 點擊 Profile
      await page.locator('.v-navigation-drawer .v-list-item:has-text("Profile")').click()

      await expect(page).toHaveURL('/profile')
    })
  })

  test.describe('Project Menu (With project context)', () => {
    // 使用一個存在的專案 ID 來測試
    const testProjectId = 1

    test('should display Performance submenu in project context', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/overviews`)

      // 點開選單
      await page.locator('.v-app-bar-nav-icon').click()
      await page.waitForSelector('.v-navigation-drawer.v-navigation-drawer--active', { timeout: 5000 })

      // 確認有 Performance 群組（使用群組標題定位器）
      const perfGroup = page.locator('.v-navigation-drawer .v-list-group__header:has-text("Performance")')
      await expect(perfGroup).toBeVisible()
    })

    test('should have AI Model Performance link in Performance submenu', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/overviews`)

      // 點開選單
      await page.locator('.v-app-bar-nav-icon').click()
      await page.waitForSelector('.v-navigation-drawer.v-navigation-drawer--active', { timeout: 5000 })

      // 展開 Performance 群組（點擊群組標題）
      await page.locator('.v-navigation-drawer .v-list-group__header:has-text("Performance")').click()

      // 確認有 AI Model Performance 連結（精確匹配）
      const aiModelLink = page.locator('.v-navigation-drawer .v-list-item').filter({ hasText: /^AI Model Performance$/ })
      await expect(aiModelLink).toBeVisible({ timeout: 3000 })
    })

    test('should have RAN Slice Performance link in Performance submenu', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/overviews`)

      // 點開選單
      await page.locator('.v-app-bar-nav-icon').click()
      await page.waitForSelector('.v-navigation-drawer.v-navigation-drawer--active', { timeout: 5000 })

      // 展開 Performance 群組（點擊群組標題）
      await page.locator('.v-navigation-drawer .v-list-group__header:has-text("Performance")').click()

      // 確認有 RAN Slice Performance 連結（精確匹配）
      const ranSliceLink = page.locator('.v-navigation-drawer .v-list-item').filter({ hasText: /^RAN Slice Performance$/ })
      await expect(ranSliceLink).toBeVisible({ timeout: 3000 })
    })

    test('should navigate to AI Model Performance page', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/overviews`)

      // 點開選單
      await page.locator('.v-app-bar-nav-icon').click()
      await page.waitForSelector('.v-navigation-drawer.v-navigation-drawer--active', { timeout: 5000 })

      // 展開 Performance 群組並點擊 AI Model Performance
      await page.locator('.v-navigation-drawer .v-list-group__header:has-text("Performance")').click()
      await page.locator('.v-navigation-drawer .v-list-item').filter({ hasText: /^AI Model Performance$/ }).click()

      await expect(page).toHaveURL(`/projects/${testProjectId}/performance/ai-model`)
    })

    test('should navigate to RAN Slice Performance page', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/overviews`)

      // 點開選單
      await page.locator('.v-app-bar-nav-icon').click()
      await page.waitForSelector('.v-navigation-drawer.v-navigation-drawer--active', { timeout: 5000 })

      // 展開 Performance 群組並點擊 RAN Slice Performance
      await page.locator('.v-navigation-drawer .v-list-group__header:has-text("Performance")').click()
      await page.locator('.v-navigation-drawer .v-list-item').filter({ hasText: /^RAN Slice Performance$/ }).click()

      await expect(page).toHaveURL(`/projects/${testProjectId}/performance/ran-slice`)
    })

    test('should still have NES link in Performance submenu', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/overviews`)

      // 點開選單
      await page.locator('.v-app-bar-nav-icon').click()
      await page.waitForSelector('.v-navigation-drawer.v-navigation-drawer--active', { timeout: 5000 })

      // 展開 Performance 群組
      await page.locator('.v-navigation-drawer .v-list-group__header:has-text("Performance")').click()

      // 確認 NES 連結仍存在（向後相容）
      const nesLink = page.locator('.v-navigation-drawer .v-list-item').filter({ hasText: /^NES$/ })
      await expect(nesLink).toBeVisible({ timeout: 3000 })
    })

    test('should still have MRO link in Performance submenu', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/overviews`)

      // 點開選單
      await page.locator('.v-app-bar-nav-icon').click()
      await page.waitForSelector('.v-navigation-drawer.v-navigation-drawer--active', { timeout: 5000 })

      // 展開 Performance 群組
      await page.locator('.v-navigation-drawer .v-list-group__header:has-text("Performance")').click()

      // 確認 MRO 連結仍存在（向後相容）
      const mroLink = page.locator('.v-navigation-drawer .v-list-item').filter({ hasText: /^MRO$/ })
      await expect(mroLink).toBeVisible({ timeout: 3000 })
    })
  })
})
