import { test, expect } from '@playwright/test'
import { login, mockAllExternalServices } from './utils/test-helpers'

// Helper function: wait for Vuetify overlay scrim to disappear
async function waitForOverlayToDisappear(page: import('@playwright/test').Page) {
  // Vuetify overlays can block clicks - wait for them to be hidden or gone
  await page.waitForFunction(() => {
    const scrim = document.querySelector('.v-overlay__scrim')
    if (!scrim) return true
    const style = window.getComputedStyle(scrim)
    return style.display === 'none' || style.opacity === '0' || style.visibility === 'hidden'
  }, { timeout: 5000 }).catch(() => {
    // If no scrim found or already hidden, continue
  })
}

// E2E tests for navigation menu
// Tests sidebar menu structure and navigation functionality
test.describe('Navigation Menu', () => {
  test.beforeEach(async ({ page }) => {
    // Mock 外部服務
    await mockAllExternalServices(page)

    // 登入
    await login(page)
  })

  test.describe('Main Menu (No project context)', () => {
    test('should display Profile link in main menu', async ({ page }) => {
      await page.goto('/')
      await page.waitForSelector('.v-navigation-drawer', { timeout: 10000 })

      // Wait for overlay to disappear before clicking nav icon
      await waitForOverlayToDisappear(page)
      await page.locator('.v-app-bar-nav-icon').click()
      await page.waitForSelector('.v-navigation-drawer.v-navigation-drawer--active', { timeout: 5000 })

      const profileLink = page.locator('.v-navigation-drawer .v-list-item:has-text("Profile")')
      await expect(profileLink).toBeVisible()
    })

    test('should navigate to Profile page from main menu', async ({ page }) => {
      await page.goto('/')

      // Wait for overlay to disappear before clicking nav icon
      await waitForOverlayToDisappear(page)
      await page.locator('.v-app-bar-nav-icon').click()
      await page.waitForSelector('.v-navigation-drawer.v-navigation-drawer--active', { timeout: 5000 })

      // Click Profile
      await page.locator('.v-navigation-drawer .v-list-item:has-text("Profile")').click()

      await expect(page).toHaveURL('/profile')
    })
  })

  test.describe('Project Menu (With project context)', () => {
    // 使用一個存在的專案 ID 來測試
    const testProjectId = 2

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

    // Phase D: 新增 Scene Deployment 和 AI Application Simulator 選單項測試
    test('should display Scene Deployment link in project menu', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/overviews`)

      // 點開選單
      await page.locator('.v-app-bar-nav-icon').click()
      await page.waitForSelector('.v-navigation-drawer.v-navigation-drawer--active', { timeout: 5000 })

      // 確認有 Scene Deployment 選單項
      const sceneDeploymentLink = page.locator('.v-navigation-drawer .v-list-item:has-text("Scene Deployment")')
      await expect(sceneDeploymentLink).toBeVisible({ timeout: 3000 })
    })

    test('should display AI Application Simulator link in project menu', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/overviews`)

      // 點開選單
      await page.locator('.v-app-bar-nav-icon').click()
      await page.waitForSelector('.v-navigation-drawer.v-navigation-drawer--active', { timeout: 5000 })

      // 確認有 AI Application Simulator 選單項
      const aiSimulatorLink = page.locator('.v-navigation-drawer .v-list-item:has-text("AI Application Simulator")')
      await expect(aiSimulatorLink).toBeVisible({ timeout: 3000 })
    })

    test('should navigate to Scene Deployment page', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/overviews`)

      // 點開選單
      await page.locator('.v-app-bar-nav-icon').click()
      await page.waitForSelector('.v-navigation-drawer.v-navigation-drawer--active', { timeout: 5000 })

      // 點擊 Scene Deployment
      await page.locator('.v-navigation-drawer .v-list-item:has-text("Scene Deployment")').click()

      await expect(page).toHaveURL(`/projects/${testProjectId}/scene-deployment`)
    })

    test('should navigate to AI Application Simulator page', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/overviews`)

      // 點開選單
      await page.locator('.v-app-bar-nav-icon').click()
      await page.waitForSelector('.v-navigation-drawer.v-navigation-drawer--active', { timeout: 5000 })

      // 點擊 AI Application Simulator
      await page.locator('.v-navigation-drawer .v-list-item:has-text("AI Application Simulator")').click()

      await expect(page).toHaveURL(`/projects/${testProjectId}/ai-simulator`)
    })

    test('should display menu items in correct order (Figma alignment)', async ({ page }) => {
      await page.goto(`/projects/${testProjectId}/overviews`)

      // 點開選單
      await page.locator('.v-app-bar-nav-icon').click()
      await page.waitForSelector('.v-navigation-drawer.v-navigation-drawer--active', { timeout: 5000 })

      // 取得所有選單項的文字
      const menuItems = page.locator('.v-navigation-drawer .v-list > .v-list-item, .v-navigation-drawer .v-list > .v-list-group > .v-list-group__header')

      // 確認 Overview 在 Scene Deployment 之前
      const overviewIndex = await menuItems.evaluateAll((items) =>
        items.findIndex(item => item.textContent?.includes('Overview'))
      )
      const sceneDeploymentIndex = await menuItems.evaluateAll((items) =>
        items.findIndex(item => item.textContent?.includes('Scene Deployment'))
      )
      const aiSimulatorIndex = await menuItems.evaluateAll((items) =>
        items.findIndex(item => item.textContent?.includes('AI Application Simulator'))
      )

      expect(overviewIndex).toBeLessThan(sceneDeploymentIndex)
      expect(sceneDeploymentIndex).toBeLessThan(aiSimulatorIndex)
    })
  })
})
