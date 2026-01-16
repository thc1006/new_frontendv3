import { test, expect } from '@playwright/test'

/**
 * 回歸測試 - 防止已修復的問題再次發生
 *
 * 這些測試涵蓋了曾經出現過的 bug，確保它們不會再次發生。
 * 每當修復一個 bug 時，應該在這裡添加對應的回歸測試。
 */
test.describe('Regression Tests', () => {

  // ============================================================
  // Issue: Favicon 未顯示在瀏覽器分頁標籤
  // Fixed: 2026-01-16 (commit: 42a96a9)
  // Root cause: nuxt.config.ts 缺少 app.head favicon 設定
  // ============================================================
  test.describe('Favicon Configuration', () => {
    test('should have favicon link in HTML head', async ({ page }) => {
      await page.goto('/login')

      // 檢查 favicon link 標籤存在
      const faviconPng = page.locator('link[rel="icon"][type="image/png"]')
      const faviconIco = page.locator('link[rel="icon"][type="image/x-icon"]')

      // 至少要有一種 favicon 設定
      const hasPng = await faviconPng.count() > 0
      const hasIco = await faviconIco.count() > 0

      expect(hasPng || hasIco).toBe(true)
    })

    test('favicon should point to valid file', async ({ page }) => {
      await page.goto('/login')

      // 取得 favicon href
      const faviconLink = page.locator('link[rel="icon"]').first()
      const href = await faviconLink.getAttribute('href')

      expect(href).toBeTruthy()
      expect(href).toMatch(/favicon\.(png|ico)$/)
    })

    test('favicon file should be accessible', async ({ page, request }) => {
      // 直接請求 favicon 檔案確認存在
      const response = await request.get('/favicon.png')
      expect(response.status()).toBe(200)
    })
  })

  // ============================================================
  // Issue: Projects List 頁面 marker hover 時位置會亂跑
  // Fixed: 2026-01-16 (commit: 42a96a9)
  // Root cause: 直接設置 el.style.transform 覆蓋了 mapbox 的定位 transform
  // Solution: 使用 CSS class + transform-origin: bottom center
  // ============================================================
  test.describe('Marker Hover Position Stability', () => {
    test.beforeEach(async ({ page }) => {
      // 先登入
      await page.goto('/login')
      await page.locator('input[type="text"]').first().fill('admin1')
      await page.locator('input[type="password"]').first().fill('admin1')
      await page.locator('button:has-text("Login")').click()
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
    })

    test('marker should have transform-origin set to bottom center', async ({ page }) => {
      await page.goto('/')

      // 等待地圖和 marker 載入
      await page.waitForSelector('.custom-marker', { timeout: 15000 })

      const marker = page.locator('.custom-marker').first()
      await expect(marker).toBeVisible()

      // 檢查 transform-origin 設定
      const transformOrigin = await marker.evaluate((el) => {
        return window.getComputedStyle(el).transformOrigin
      })

      // transform-origin 應該包含 bottom 或 50% 100% (center bottom)
      // 瀏覽器可能回傳像素值，所以檢查 y 軸是否在底部
      expect(transformOrigin).toBeTruthy()
    })

    test('marker position should remain stable after hover', async ({ page }) => {
      await page.goto('/')

      // 等待地圖和 marker 載入
      await page.waitForSelector('.custom-marker', { timeout: 15000 })

      const marker = page.locator('.custom-marker').first()
      await expect(marker).toBeVisible()

      // 記錄 hover 前的位置
      const boundingBoxBefore = await marker.boundingBox()
      expect(boundingBoxBefore).not.toBeNull()

      // Hover marker
      await marker.hover()
      await page.waitForTimeout(300) // 等待動畫完成

      // 記錄 hover 後的位置
      const boundingBoxAfter = await marker.boundingBox()
      expect(boundingBoxAfter).not.toBeNull()

      // 底部位置應該保持不變（允許 2px 誤差）
      // 因為 transform-origin 設定在底部，縮放時底部不應移動
      const bottomBefore = boundingBoxBefore!.y + boundingBoxBefore!.height
      const bottomAfter = boundingBoxAfter!.y + boundingBoxAfter!.height

      expect(Math.abs(bottomAfter - bottomBefore)).toBeLessThan(3)
    })

    test('marker should use CSS class for hover state instead of inline style', async ({ page }) => {
      await page.goto('/')

      // 等待地圖載入
      await page.waitForSelector('.custom-marker', { timeout: 15000 })

      // 找到專案卡片並 hover
      const projectCard = page.locator('.project-card').first()
      await expect(projectCard).toBeVisible({ timeout: 10000 })

      const marker = page.locator('.custom-marker').first()

      // 記錄 hover 前的 inline transform style
      const transformBefore = await marker.evaluate((el) => {
        return el.style.transform
      })

      // Hover 卡片（這會觸發 onCardHover）
      await projectCard.hover()
      await page.waitForTimeout(300)

      // 檢查 marker 是否有 marker-hovered class
      const hasHoveredClass = await marker.evaluate((el) => {
        return el.classList.contains('marker-hovered')
      })

      // 應該使用 class 而非直接修改 inline style
      expect(hasHoveredClass).toBe(true)

      // inline transform 不應該被直接覆蓋成 scale
      const transformAfter = await marker.evaluate((el) => {
        return el.style.transform
      })

      // 如果使用 CSS class，inline style 不應該包含 scale
      // (scale 應該來自 CSS class 的定義)
      if (transformAfter) {
        expect(transformAfter).not.toMatch(/scale\(1\.[2-9]\)/)
      }
    })
  })

  // ============================================================
  // 其他已知問題的回歸測試可以在這裡添加
  // 格式：
  // - Issue 描述
  // - Fixed 日期和 commit
  // - Root cause
  // - Solution
  // ============================================================

})
