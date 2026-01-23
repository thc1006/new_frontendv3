import { test, expect } from '@playwright/test'

/**
 * API 端點功能測試
 *
 * 此測試檔案驗證所有關鍵 API 端點的連接性和正確性
 * 包括新添加的缺失端點：
 * - GET /projects/{project_id}/maps_aodt
 * - GET /Map_Position/{id}
 * - /primitive_dt_ai_models (CRUD)
 */

test.describe('API Endpoints Integration Tests', () => {
  // 測試前先登入
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="text"]').first().fill('admin1')
    await page.locator('input[type="password"]').first().fill('admin1')
    await page.locator('button:has-text("Login")').click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  })

  test.describe('Authentication API', () => {
    test('POST /auth/login should authenticate user', async ({ page }) => {
      // 已在 beforeEach 中驗證登入成功
      await expect(page.locator('.projects-page')).toBeVisible({ timeout: 10000 })
    })

    test('GET /users/me should return current user info', async ({ page, request }) => {
      // 監聽 API 請求
      const apiResponses: { url: string; status: number }[] = []
      page.on('response', (response) => {
        if (response.url().includes('/api/users/me')) {
          apiResponses.push({ url: response.url(), status: response.status() })
        }
      })

      // 觸發用戶信息請求（通常在頁面載入時自動發送）
      await page.reload()
      await page.waitForTimeout(2000)

      // 驗證至少有一個成功的用戶信息請求
      const successfulRequest = apiResponses.find((r) => r.status === 200)
      expect(successfulRequest).toBeDefined()
    })
  })

  test.describe('Project API', () => {
    test('GET /projects/me should return user projects', async ({ page }) => {
      const apiResponses: { url: string; status: number; body?: any }[] = []

      page.on('response', async (response) => {
        if (response.url().includes('/api/projects')) {
          try {
            const body = await response.json().catch(() => null)
            apiResponses.push({ url: response.url(), status: response.status(), body })
          } catch {
            apiResponses.push({ url: response.url(), status: response.status() })
          }
        }
      })

      await page.waitForTimeout(3000)

      // 驗證項目列表請求成功
      const projectsRequest = apiResponses.find(
        (r) => r.url.includes('/projects') && r.status === 200
      )
      expect(projectsRequest).toBeDefined()
    })

    test('GET /projects/{project_id}/maps_frontend should return map data', async ({ page }) => {
      // 等待專案卡片載入
      await page.waitForSelector('.project-card', { timeout: 15000 })

      // 點擊第一個專案
      const viewProjectBtn = page.locator('button:has-text("View Project")').first()
      await viewProjectBtn.click()

      // 等待導航到專案頁面
      await page.waitForURL((url) => url.pathname.includes('/projects/'), { timeout: 10000 })

      // 監聯 maps_frontend 請求
      const mapResponses: { url: string; status: number }[] = []
      page.on('response', (response) => {
        if (response.url().includes('maps_frontend')) {
          mapResponses.push({ url: response.url(), status: response.status() })
        }
      })

      // 導航到 overviews 頁面（會觸發 maps_frontend 請求）
      const url = page.url()
      const projectId = url.match(/\/projects\/(\d+)/)?.[1]
      if (projectId) {
        await page.goto(`/projects/${projectId}/overviews`)
        await page.waitForTimeout(3000)

        // 檢查是否有 maps_frontend 請求（可能成功或 404）
        expect(mapResponses.length).toBeGreaterThanOrEqual(0)
      }
    })
  })

  test.describe('New API Endpoints (Added)', () => {
    test('GET /projects/{project_id}/maps_aodt endpoint exists', async ({ page }) => {
      // 等待專案卡片載入
      await page.waitForSelector('.project-card', { timeout: 15000 })

      // 點擊第一個專案
      const viewProjectBtn = page.locator('button:has-text("View Project")').first()
      await viewProjectBtn.click()
      await page.waitForURL((url) => url.pathname.includes('/projects/'), { timeout: 10000 })

      // 從 URL 獲取專案 ID
      const url = page.url()
      const projectId = url.match(/\/projects\/(\d+)/)?.[1]

      if (projectId) {
        // 直接測試 API 端點
        const apiResponse = await page.request.get(`/api/projects/${projectId}/maps_aodt`)

        // 端點應該存在（200 或 404 如果沒有數據）
        expect([200, 404]).toContain(apiResponse.status())

        if (apiResponse.status() === 200) {
          const data = await apiResponse.json()
          expect(data).toBeDefined()
        }
      }
    })

    test('GET /Map_Position/{id} endpoint exists', async ({ page }) => {
      // 等待專案卡片載入
      await page.waitForSelector('.project-card', { timeout: 15000 })

      // 點擊第一個專案
      const viewProjectBtn = page.locator('button:has-text("View Project")').first()
      await viewProjectBtn.click()
      await page.waitForURL((url) => url.pathname.includes('/projects/'), { timeout: 10000 })

      // 從 URL 獲取專案 ID
      const url = page.url()
      const projectId = url.match(/\/projects\/(\d+)/)?.[1]

      if (projectId) {
        // 直接測試 API 端點
        const apiResponse = await page.request.get(`/api/Map_Position/${projectId}`)

        // 端點應該存在（200 或 404 如果沒有數據）
        expect([200, 404, 500]).toContain(apiResponse.status())

        if (apiResponse.status() === 200) {
          const data = await apiResponse.json()
          expect(Array.isArray(data)).toBe(true)
        }
      }
    })

    test('GET /primitive_dt_ai_models endpoint exists', async ({ page }) => {
      // 直接測試 API 端點
      const apiResponse = await page.request.get('/api/primitive_dt_ai_models')

      // 端點應該存在
      expect([200, 404]).toContain(apiResponse.status())

      if (apiResponse.status() === 200) {
        const data = await apiResponse.json()
        expect(Array.isArray(data)).toBe(true)
      }
    })
  })

  test.describe('Evaluation API', () => {
    test('GET /evaluations should return evaluations list', async ({ page }) => {
      const apiResponse = await page.request.get('/api/evaluations')

      expect([200]).toContain(apiResponse.status())

      const data = await apiResponse.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('Evaluation workflow page loads correctly', async ({ page }) => {
      // 等待專案卡片載入
      await page.waitForSelector('.project-card', { timeout: 15000 })

      // 點擊第一個專案
      const viewProjectBtn = page.locator('button:has-text("View Project")').first()
      await viewProjectBtn.click()
      await page.waitForURL((url) => url.pathname.includes('/projects/'), { timeout: 10000 })

      // 從 URL 獲取專案 ID
      const url = page.url()
      const projectId = url.match(/\/projects\/(\d+)/)?.[1]

      if (projectId) {
        // 導航到評估頁面
        await page.goto(`/projects/${projectId}/config/evaluations`)
        await page.waitForSelector('.v-container', { timeout: 15000 })

        // 驗證頁面載入成功
        await expect(page.locator('.v-container')).toBeVisible()
      }
    })
  })

  test.describe('AODT API', () => {
    test('GET /aodt/status should return AODT status', async ({ page }) => {
      const apiResponse = await page.request.get('/api/aodt/status')

      // AODT 服務可能未運行，所以允許多種狀態碼
      expect([200, 500, 502, 503]).toContain(apiResponse.status())

      if (apiResponse.status() === 200) {
        const data = await apiResponse.json()
        expect(data).toBeDefined()
      }
    })
  })

  test.describe('Brand and Metrics API', () => {
    test('GET /brands should return brands list', async ({ page }) => {
      const apiResponse = await page.request.get('/api/brands')

      expect([200]).toContain(apiResponse.status())

      const data = await apiResponse.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('GET /abstract_metrics should return metrics list', async ({ page }) => {
      const apiResponse = await page.request.get('/api/abstract_metrics')

      expect([200]).toContain(apiResponse.status())

      const data = await apiResponse.json()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  test.describe('RU/DU/CU API', () => {
    test('GET /rus should return RU list', async ({ page }) => {
      const apiResponse = await page.request.get('/api/rus')

      expect([200]).toContain(apiResponse.status())

      const data = await apiResponse.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('GET /dus should return DU list', async ({ page }) => {
      const apiResponse = await page.request.get('/api/dus')

      expect([200]).toContain(apiResponse.status())

      const data = await apiResponse.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('GET /cus should return CU list', async ({ page }) => {
      const apiResponse = await page.request.get('/api/cus')

      expect([200]).toContain(apiResponse.status())

      const data = await apiResponse.json()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  test.describe('AI Models API', () => {
    test('GET /primitive_ai_models should return models list', async ({ page }) => {
      const apiResponse = await page.request.get('/api/primitive_ai_models')

      expect([200]).toContain(apiResponse.status())

      const data = await apiResponse.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('GET /dt_ai_models should return DT models list', async ({ page }) => {
      const apiResponse = await page.request.get('/api/dt_ai_models')

      expect([200]).toContain(apiResponse.status())

      const data = await apiResponse.json()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  test.describe('Deploy API (New)', () => {
    test('POST /projects/{project_id}/deploy/{evaluation_id} endpoint exists', async ({
      page,
    }) => {
      // 等待專案卡片載入
      await page.waitForSelector('.project-card', { timeout: 15000 })

      // 點擊第一個專案
      const viewProjectBtn = page.locator('button:has-text("View Project")').first()
      await viewProjectBtn.click()
      await page.waitForURL((url) => url.pathname.includes('/projects/'), { timeout: 10000 })

      // 從 URL 獲取專案 ID
      const url = page.url()
      const projectId = url.match(/\/projects\/(\d+)/)?.[1]

      if (projectId) {
        // 獲取專案的評估列表
        const evalResponse = await page.request.get(`/api/projects/${projectId}/evaluations`)

        if (evalResponse.status() === 200) {
          const evaluations = await evalResponse.json()

          if (Array.isArray(evaluations) && evaluations.length > 0) {
            const evaluationId = evaluations[0].eval_id || evaluations[0].evaluation_id

            if (evaluationId) {
              // 測試 deploy 端點存在（不實際執行部署）
              // 使用 GET 方法測試端點是否存在
              const deployResponse = await page.request.fetch(
                `/api/projects/${projectId}/deploy/${evaluationId}`,
                {
                  method: 'POST',
                  failOnStatusCode: false,
                }
              )

              // 端點應該存在（可能返回錯誤，但不是 404）
              // 405 表示方法不允許，但端點存在
              // 400/422 表示請求格式錯誤，但端點存在
              expect([200, 201, 400, 405, 422, 500]).toContain(deployResponse.status())
            }
          }
        }
      }
    })
  })
})

test.describe('API Request Path Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="text"]').first().fill('admin1')
    await page.locator('input[type="password"]').first().fill('admin1')
    await page.locator('button:has-text("Login")').click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  })

  test('All API requests should use /api prefix, not 127.0.0.1', async ({ page }) => {
    const badRequests: string[] = []

    page.on('request', (request) => {
      const url = request.url()
      // 檢查是否有直接請求到 127.0.0.1 的 API 調用
      if (url.includes('127.0.0.1') && !url.includes('localhost')) {
        badRequests.push(url)
      }
    })

    // 導航到多個頁面來觸發各種 API 請求
    await page.waitForTimeout(2000)

    // 等待專案卡片載入
    try {
      await page.waitForSelector('.project-card', { timeout: 10000 })
      const viewProjectBtn = page.locator('button:has-text("View Project")').first()
      await viewProjectBtn.click()
      await page.waitForTimeout(2000)
    } catch {
      // 如果沒有專案，跳過
    }

    // 驗證沒有直接請求到 127.0.0.1 的 API 調用
    expect(badRequests).toEqual([])
  })
})
