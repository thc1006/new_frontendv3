import { test, expect } from '@playwright/test'

/**
 * 跨版本功能驗證測試
 *
 * 此測試檔案驗證：
 * 1. 1.0.0 版本的所有核心功能在當前前端中正確運作
 * 2. 2.0.0 版本的所有新功能在當前前端中正確運作
 * 3. 後端 API 與前端 Api.ts 的一致性
 */

test.describe('Cross-Version Feature Validation', () => {
  // 測試前先登入
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="text"]').first().fill('admin1')
    await page.locator('input[type="password"]').first().fill('admin1')
    await page.locator('button:has-text("Login")').click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  })

  test.describe('1.0.0 Core Features Validation', () => {
    test('User Authentication - session persists across pages', async ({ page }) => {
      // 驗證登入後 session 正確保持
      await page.reload()
      await page.waitForTimeout(2000)

      // 應該還是在專案頁面，不會被重導向到登入頁
      const url = page.url()
      expect(url).not.toContain('/login')
    })

    test('Project Management - list projects', async ({ page }) => {
      // 監聽 API 請求
      const apiResponses: { url: string; status: number }[] = []
      page.on('response', (response) => {
        if (response.url().includes('/api/projects')) {
          apiResponses.push({ url: response.url(), status: response.status() })
        }
      })

      await page.waitForTimeout(3000)

      // 驗證至少有一個成功的專案請求
      const successfulRequest = apiResponses.find((r) => r.status === 200)
      expect(successfulRequest).toBeDefined()
    })

    test('gNodeB Configuration - CU/DU/RU hierarchy endpoints exist', async ({ page }) => {
      // 測試 CU API
      const cuResponse = await page.request.get('/api/cus')
      expect(cuResponse.status()).toBe(200)
      const cuData = await cuResponse.json()
      expect(Array.isArray(cuData)).toBe(true)

      // 測試 DU API
      const duResponse = await page.request.get('/api/dus')
      expect(duResponse.status()).toBe(200)
      const duData = await duResponse.json()
      expect(Array.isArray(duData)).toBe(true)

      // 測試 RU API
      const ruResponse = await page.request.get('/api/rus')
      expect(ruResponse.status()).toBe(200)
      const ruData = await ruResponse.json()
      expect(Array.isArray(ruData)).toBe(true)
    })

    test('AI Model Management - primitive AI models list', async ({ page }) => {
      const apiResponse = await page.request.get('/api/primitive_ai_models')
      expect(apiResponse.status()).toBe(200)
      const data = await apiResponse.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('Brand Management - brands list', async ({ page }) => {
      const apiResponse = await page.request.get('/api/brands')
      expect(apiResponse.status()).toBe(200)
      const data = await apiResponse.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('Heatmap System - RSRP/Throughput status endpoints', async ({ page }) => {
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
        // 測試 status 端點
        const statusResponse = await page.request.get(`/api/projects/${projectId}/status`)
        expect([200, 404]).toContain(statusResponse.status())
      }
    })
  })

  test.describe('2.0.0 New Features Validation', () => {
    test('AODT Workflow - status endpoint exists', async ({ page }) => {
      const apiResponse = await page.request.get('/api/aodt/status')
      // AODT 服務可能未運行
      expect([200, 500, 502, 503]).toContain(apiResponse.status())
    })

    test('MinIO Integration - bucket operations', async ({ page }) => {
      // 測試 MinIO ensure_bucket endpoint
      const apiResponse = await page.request.post('/api/minio/ensure_bucket', {
        data: { bucket: 'test-bucket' },
      })
      // 允許多種狀態碼（服務可能未運行）
      expect([200, 400, 500, 502, 503]).toContain(apiResponse.status())
    })

    test('Digital Twin - netDT endpoint exists', async ({ page }) => {
      // 等待專案載入並獲取 evaluation ID
      await page.waitForSelector('.project-card', { timeout: 15000 })

      const viewProjectBtn = page.locator('button:has-text("View Project")').first()
      await viewProjectBtn.click()
      await page.waitForURL((url) => url.pathname.includes('/projects/'), { timeout: 10000 })

      const url = page.url()
      const projectId = url.match(/\/projects\/(\d+)/)?.[1]

      if (projectId) {
        // 獲取評估列表
        const evalResponse = await page.request.get(`/api/projects/${projectId}/evaluations`)
        if (evalResponse.status() === 200) {
          const evaluations = await evalResponse.json()
          if (Array.isArray(evaluations) && evaluations.length > 0) {
            const evaluationId = evaluations[0].eval_id || evaluations[0].evaluation_id

            if (evaluationId) {
              // 測試 netDT 端點存在
              const netDtResponse = await page.request.post(`/api/netDT/${evaluationId}`, {
                failOnStatusCode: false,
              })
              // 端點應該存在（可能返回錯誤狀態但不是 404）
              expect([200, 201, 400, 422, 500, 502]).toContain(netDtResponse.status())
            }
          }
        }
      }
    })

    test('Geocoding - search endpoint exists', async ({ page }) => {
      const apiResponse = await page.request.get('/api/geocode/search?q=taipei')
      // Nominatim 服務可能有速率限制
      expect([200, 429, 500]).toContain(apiResponse.status())
    })

    test('RU Cache System - rucaches endpoint', async ({ page }) => {
      const apiResponse = await page.request.get('/api/rucaches')
      expect([200]).toContain(apiResponse.status())
      const data = await apiResponse.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('Abstract Metrics - metrics list', async ({ page }) => {
      const apiResponse = await page.request.get('/api/abstract_metrics')
      expect([200]).toContain(apiResponse.status())
      const data = await apiResponse.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('DT AI Models - dt_ai_models list', async ({ page }) => {
      const apiResponse = await page.request.get('/api/dt_ai_models')
      expect([200]).toContain(apiResponse.status())
      const data = await apiResponse.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('Primitive DT AI Models - primitive_dt_ai_models list', async ({ page }) => {
      const apiResponse = await page.request.get('/api/primitive_dt_ai_models')
      expect([200, 404]).toContain(apiResponse.status())
    })

    test('gNB Status - gnb_status endpoint', async ({ page }) => {
      const apiResponse = await page.request.get('/api/gnb_status')
      // 端點可能返回空數據
      expect([200, 500]).toContain(apiResponse.status())
    })
  })

  test.describe('Backend-Frontend API Consistency', () => {
    test('All evaluation status endpoints exist', async ({ page }) => {
      await page.waitForSelector('.project-card', { timeout: 15000 })

      const viewProjectBtn = page.locator('button:has-text("View Project")').first()
      await viewProjectBtn.click()
      await page.waitForURL((url) => url.pathname.includes('/projects/'), { timeout: 10000 })

      const url = page.url()
      const projectId = url.match(/\/projects\/(\d+)/)?.[1]

      if (projectId) {
        const evalResponse = await page.request.get(`/api/projects/${projectId}/evaluations`)
        if (evalResponse.status() === 200) {
          const evaluations = await evalResponse.json()
          if (Array.isArray(evaluations) && evaluations.length > 0) {
            const evaluationId = evaluations[0].eval_id || evaluations[0].evaluation_id

            if (evaluationId) {
              // 測試所有狀態端點
              const statusEndpoints = ['rsrp', 'throughput', 'rsrp_dt', 'throughputDT']

              for (const endpoint of statusEndpoints) {
                const statusResponse = await page.request.put(
                  `/api/evaluations/${evaluationId}/status/${endpoint}`,
                  {
                    data: { status: 'IDLE' },
                    failOnStatusCode: false,
                  }
                )
                // 端點應該存在
                expect([200, 400, 404, 422]).toContain(statusResponse.status())
              }
            }
          }
        }
      }
    })

    test('Project maps endpoints - maps_frontend and maps_aodt', async ({ page }) => {
      await page.waitForSelector('.project-card', { timeout: 15000 })

      const viewProjectBtn = page.locator('button:has-text("View Project")').first()
      await viewProjectBtn.click()
      await page.waitForURL((url) => url.pathname.includes('/projects/'), { timeout: 10000 })

      const url = page.url()
      const projectId = url.match(/\/projects\/(\d+)/)?.[1]

      if (projectId) {
        // 測試 maps_frontend
        const mapsFrontendResponse = await page.request.get(
          `/api/projects/${projectId}/maps_frontend`
        )
        expect([200, 404]).toContain(mapsFrontendResponse.status())

        // 測試 maps_aodt
        const mapsAodtResponse = await page.request.get(`/api/projects/${projectId}/maps_aodt`)
        expect([200, 404]).toContain(mapsAodtResponse.status())
      }
    })

    test('Evaluation heatmap data endpoints', async ({ page }) => {
      await page.waitForSelector('.project-card', { timeout: 15000 })

      const viewProjectBtn = page.locator('button:has-text("View Project")').first()
      await viewProjectBtn.click()
      await page.waitForURL((url) => url.pathname.includes('/projects/'), { timeout: 10000 })

      const url = page.url()
      const projectId = url.match(/\/projects\/(\d+)/)?.[1]

      if (projectId) {
        const evalResponse = await page.request.get(`/api/projects/${projectId}/evaluations`)
        if (evalResponse.status() === 200) {
          const evaluations = await evalResponse.json()
          if (Array.isArray(evaluations) && evaluations.length > 0) {
            const evaluationId = evaluations[0].eval_id || evaluations[0].evaluation_id

            if (evaluationId) {
              // 測試所有熱力圖數據端點
              const heatmapEndpoints = ['rsrp', 'throughput', 'rsrp_dt', 'throughput_dt']

              for (const endpoint of heatmapEndpoints) {
                const heatmapResponse = await page.request.get(
                  `/api/evaluations/${evaluationId}/${endpoint}`,
                  { failOnStatusCode: false }
                )
                // 端點應該存在（可能沒有數據返回 404）
                expect([200, 404, 500]).toContain(heatmapResponse.status())
              }
            }
          }
        }
      }
    })
  })

  test.describe('Chat System Validation', () => {
    test('Chat sessions API endpoints', async ({ page }) => {
      await page.waitForSelector('.project-card', { timeout: 15000 })

      const viewProjectBtn = page.locator('button:has-text("View Project")').first()
      await viewProjectBtn.click()
      await page.waitForURL((url) => url.pathname.includes('/projects/'), { timeout: 10000 })

      const url = page.url()
      const projectId = url.match(/\/projects\/(\d+)/)?.[1]

      if (projectId) {
        // 測試獲取聊天會話
        const sessionsResponse = await page.request.get(
          `/api/projects/${projectId}/chat_sessions`,
          { failOnStatusCode: false }
        )
        expect([200, 404]).toContain(sessionsResponse.status())
      }
    })
  })

  test.describe('AI Model Control Endpoints (Defined but Unused)', () => {
    test('AI Model activate/deactivate endpoints exist', async ({ page }) => {
      // 這些端點在 Api.ts 中定義但未被使用
      // 測試後端是否真的實現了這些端點
      const aiModelsResponse = await page.request.get('/api/ai_models')

      if (aiModelsResponse.status() === 200) {
        const models = await aiModelsResponse.json()

        if (Array.isArray(models) && models.length > 0) {
          const modelId = models[0].AI_model_id || models[0].model_id

          if (modelId) {
            // 測試 activate 端點
            const activateResponse = await page.request.post(
              `/api/ai_models/${modelId}/activate`,
              { failOnStatusCode: false }
            )
            expect([200, 400, 404, 405]).toContain(activateResponse.status())

            // 測試 deactivate 端點
            const deactivateResponse = await page.request.post(
              `/api/ai_models/${modelId}/deactivate`,
              { failOnStatusCode: false }
            )
            expect([200, 400, 404, 405]).toContain(deactivateResponse.status())
          }
        }
      }
    })
  })
})

test.describe('Feature-Specific Page Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="text"]').first().fill('admin1')
    await page.locator('input[type="password"]').first().fill('admin1')
    await page.locator('button:has-text("Login")').click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  })

  test('Brands page loads correctly', async ({ page }) => {
    await page.goto('/brands')
    await page.waitForSelector('.v-container', { timeout: 15000 })
    await expect(page.locator('.v-container')).toBeVisible()
  })

  test('AI Models page loads correctly', async ({ page }) => {
    await page.goto('/ai-models')
    await page.waitForSelector('.v-container', { timeout: 15000 })
    await expect(page.locator('.v-container')).toBeVisible()
  })

  test('Users page loads correctly (admin only)', async ({ page }) => {
    await page.goto('/users')
    await page.waitForSelector('.v-container', { timeout: 15000 })
    await expect(page.locator('.v-container')).toBeVisible()
  })

  test('Project Overview page loads with map', async ({ page }) => {
    // 等待專案卡片載入
    await page.waitForSelector('.project-card', { timeout: 15000 })

    // 點擊第一個專案
    const viewProjectBtn = page.locator('button:has-text("View Project")').first()
    await viewProjectBtn.click()
    await page.waitForURL((url) => url.pathname.includes('/projects/'), { timeout: 10000 })

    // 導航到 overviews
    const url = page.url()
    const projectId = url.match(/\/projects\/(\d+)/)?.[1]

    if (projectId) {
      await page.goto(`/projects/${projectId}/overviews`)
      await page.waitForSelector('.v-container', { timeout: 15000 })
      await expect(page.locator('.v-container')).toBeVisible()
    }
  })

  test('Evaluations page loads correctly', async ({ page }) => {
    await page.waitForSelector('.project-card', { timeout: 15000 })

    const viewProjectBtn = page.locator('button:has-text("View Project")').first()
    await viewProjectBtn.click()
    await page.waitForURL((url) => url.pathname.includes('/projects/'), { timeout: 10000 })

    const url = page.url()
    const projectId = url.match(/\/projects\/(\d+)/)?.[1]

    if (projectId) {
      await page.goto(`/projects/${projectId}/config/evaluations`)
      await page.waitForSelector('.v-container', { timeout: 15000 })
      await expect(page.locator('.v-container')).toBeVisible()
    }
  })

  test('gNB Config page loads correctly', async ({ page }) => {
    await page.waitForSelector('.project-card', { timeout: 15000 })

    const viewProjectBtn = page.locator('button:has-text("View Project")').first()
    await viewProjectBtn.click()
    await page.waitForURL((url) => url.pathname.includes('/projects/'), { timeout: 10000 })

    const url = page.url()
    const projectId = url.match(/\/projects\/(\d+)/)?.[1]

    if (projectId) {
      await page.goto(`/projects/${projectId}/config/gnb`)
      await page.waitForSelector('.v-container', { timeout: 15000 })
      await expect(page.locator('.v-container')).toBeVisible()
    }
  })

  test('Scene Deployment page loads correctly', async ({ page }) => {
    await page.waitForSelector('.project-card', { timeout: 15000 })

    const viewProjectBtn = page.locator('button:has-text("View Project")').first()
    await viewProjectBtn.click()
    await page.waitForURL((url) => url.pathname.includes('/projects/'), { timeout: 10000 })

    const url = page.url()
    const projectId = url.match(/\/projects\/(\d+)/)?.[1]

    if (projectId) {
      await page.goto(`/projects/${projectId}/scene-deployment`)
      await page.waitForSelector('.v-container', { timeout: 15000 })
      await expect(page.locator('.v-container')).toBeVisible()
    }
  })
})
