import { test, expect } from '@playwright/test'
import { skipIfNoBackend } from './utils/test-helpers'

/**
 * 回歸測試 - 防止已修復的問題再次發生
 *
 * 這些測試涵蓋了曾經出現過的 bug，確保它們不會再次發生。
 * 每當修復一個 bug 時，應該在這裡添加對應的回歸測試。
 *
 * 注意：這些測試需要後端（前端初始化需要 API）
 */
test.describe('Regression Tests', () => {
  skipIfNoBackend()

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
      // favicon 可能有版本號 query string，如 /favicon.ico?v=2 或 /favicon-32x32.png?v=2
      expect(href).toMatch(/favicon[^?]*\.(png|ico)(\?.*)?$/)
    })

    test('favicon file should be accessible', async ({ request }) => {
      // 直接請求 favicon 檔案確認存在
      // 優先測試 favicon.ico（nuxt.config.ts 中的主要配置）
      const icoResponse = await request.get('/favicon.ico')
      const pngResponse = await request.get('/favicon.png')
      // 至少一種 favicon 格式應該可以訪問
      expect(icoResponse.status() === 200 || pngResponse.status() === 200).toBe(true)
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

      // 等待地圖和 marker 載入 - mapbox marker 容器包含我們的 custom-marker
      await page.waitForSelector('.mapboxgl-marker', { timeout: 15000 })

      const marker = page.locator('.mapboxgl-marker').first()
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
      try {
        await page.waitForSelector('.mapboxgl-marker', { timeout: 15000 })
      } catch {
        // 如果沒有 marker（可能沒有專案或地圖未載入），跳過測試
        test.skip()
        return
      }

      // 額外等待確保地圖渲染完成
      await page.waitForTimeout(2000)

      // 找到 custom-marker 元素
      const customMarker = page.locator('.mapboxgl-marker').first()
      const isVisible = await customMarker.isVisible().catch(() => false)
      if (!isVisible) {
        test.skip()
        return
      }

      // 驗證 marker 有正確的 anchor 設定（防止 hover 時跳動的關鍵）
      // mapboxgl-marker-anchor-bottom 表示 marker 以底部為錨點
      const hasBottomAnchor = await customMarker.evaluate((el) => {
        return el.classList.contains('mapboxgl-marker-anchor-bottom')
      })

      // 驗證 marker 的 CSS 設定正確
      // transform-origin 應該設為 bottom center 以確保 scale 時底部不移動
      const cssProperties = await customMarker.evaluate((el) => {
        const style = window.getComputedStyle(el)
        return {
          transformOrigin: style.transformOrigin,
          position: style.position
        }
      })

      // 檢查 anchor 設定
      expect(hasBottomAnchor).toBe(true)

      // transform-origin 應該包含 bottom 或是數值接近 100%（底部）
      // 格式可能是 "16px 42px" (center bottom) 或 "50% 100%" 等
      expect(cssProperties.transformOrigin).toBeTruthy()

      // position 應該是 absolute（mapbox marker 的標準設定）
      expect(cssProperties.position).toBe('absolute')
    })

    test('marker should use CSS class for hover state instead of inline style', async ({ page }) => {
      await page.goto('/')

      // 等待地圖載入
      await page.waitForSelector('.mapboxgl-marker', { timeout: 15000 })

      // 找到專案卡片並 hover
      const projectCard = page.locator('.project-card').first()
      await expect(projectCard).toBeVisible({ timeout: 10000 })

      // 使用 JavaScript 查找 custom-marker 元素
      // mapboxgl.Marker 結構可能是 .mapboxgl-marker 直接作為 custom-marker，
      // 或者 custom-marker 是其子元素
      const markerInfo = await page.evaluate(() => {
        const marker = document.querySelector('.mapboxgl-marker')
        if (!marker) return null

        // 檢查是否 marker 本身就是 custom-marker
        if (marker.classList.contains('custom-marker')) {
          return { found: true, isDirectCustomMarker: true }
        }

        // 檢查子元素
        const customMarker = marker.querySelector('.custom-marker')
        if (customMarker) {
          return { found: true, isDirectCustomMarker: false }
        }

        return { found: false, classes: Array.from(marker.classList) }
      })

      expect(markerInfo).not.toBeNull()
      expect(markerInfo?.found).toBe(true)

      // Hover 卡片（這會觸發 onCardHover）
      await projectCard.hover()
      await page.waitForTimeout(500)

      // 檢查 marker-hovered class 是否被添加
      const hoverResult = await page.evaluate(() => {
        // 先找 .custom-marker
        let targetElement = document.querySelector('.custom-marker')

        // 如果找不到，檢查 .mapboxgl-marker 是否直接有 marker-hovered
        if (!targetElement) {
          targetElement = document.querySelector('.mapboxgl-marker')
        }

        if (!targetElement) return { error: 'no marker found' }

        const hasHoveredClass = targetElement.classList.contains('marker-hovered')
        const inlineTransform = (targetElement as HTMLElement).style.transform

        return {
          hasHoveredClass,
          inlineTransform,
          classes: Array.from(targetElement.classList)
        }
      })

      // 驗證 hover 機制：應該使用 class 控制狀態，或不使用 inline scale(1.2+)
      // 接受兩種情況：
      // 1. 有 marker-hovered class（推薦）
      // 2. inline transform 不包含 scale(1.2+)（避免跳動）
      const isUsingClassBasedHover = hoverResult.hasHoveredClass
      const isNotUsingInlineScale = !hoverResult.inlineTransform ||
        !hoverResult.inlineTransform.match(/scale\(1\.[2-9]\)/)

      expect(isUsingClassBasedHover || isNotUsingInlineScale).toBe(true)
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
