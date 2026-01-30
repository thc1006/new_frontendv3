import { test, expect } from '@playwright/test'
import { skipIfNoBackend } from './utils/test-helpers'

// Mock data for projects and chat
const mockProject = {
  project_id: 3,
  title: 'Test Project',
  category: 'INDOOR',
  description: 'Test project for E2E tests',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  lat: 24.786964,
  lng: 120.996776
}

test.describe('ChatInterface Figma Alignment', () => {
  skipIfNoBackend()

  let projectId: string

  test.beforeEach(async ({ page }) => {
    // Mock chat sessions API - matches /projects/{id}/chat_sessions
    await page.route('**/projects/*/chat_sessions**', async (route) => {
      const method = route.request().method()
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { 'chat session id': 1, 'chat session title': 'Test Chat 1' }
          ])
        })
      } else if (method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 'new chat session id': Date.now() })
        })
      } else {
        await route.continue()
      }
    })

    // Mock chat_sessions API - matches /chat_sessions/{id}
    await page.route('**/chat_sessions/**', async (route) => {
      const url = route.request().url()
      const method = route.request().method()

      if (url.includes('/messages')) {
        if (method === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
          })
        } else if (method === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ 'chat message content': 'Mock response' })
          })
        } else {
          await route.continue()
        }
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // 需要先登入並進入專案頁面才能看到小幫手
    await page.goto('/login')
    await page.locator('input[type="text"]').first().fill('admin1')
    await page.locator('input[type="password"]').first().fill('admin1')
    await page.locator('button:has-text("Login")').click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })

    // 等待首頁載入並獲取第一個專案的 ID
    await page.waitForSelector('.project-card', { timeout: 15000 })
    const viewProjectBtn = page.locator('button:has-text("View Project")').first()
    await viewProjectBtn.click()
    await page.waitForURL((url) => url.pathname.includes('/projects/'), { timeout: 10000 })

    // 從 URL 提取專案 ID
    const url = page.url()
    const match = url.match(/\/projects\/(\d+)/)
    projectId = match ? match[1] : '3'

    // 進入專案 Overview 頁面
    await page.goto(`/projects/${projectId}/overviews`)
    await page.waitForLoadState('domcontentloaded')

    // 點擊 WiSDON Chat 按鈕開啟對話框
    const chatButton = page.locator('button:has-text("WiSDON Chat")')
    await chatButton.waitFor({ state: 'visible', timeout: 10000 })
    await chatButton.click()

    // 等待對話框出現
    await page.waitForSelector('.chat-container', { timeout: 10000 })
    await page.waitForTimeout(500)
  })

  test('should have correct header background color #006ab5', async ({ page }) => {
    // 檢查標題區背景色
    const titleElement = page.locator('.sticky-title')
    await titleElement.waitFor({ state: 'visible' })

    const backgroundColor = await titleElement.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor
    })

    // RGB 轉換：#006ab5 = rgb(0, 106, 181)
    expect(backgroundColor).toBe('rgb(0, 106, 181)')
  })

  test('should have correct quick question text without typo', async ({ page }) => {
    // 先建立新聊天室以顯示快速提問按鈕
    const newChatButton = page.locator('.sidebar-header button:has(i.mdi-plus)')
    await newChatButton.click()

    // 等待快速提問區域出現（確保 activeChatId 已設定）
    await page.waitForSelector('.quick-questions', { timeout: 10000 })

    // 檢查快速提問按鈕
    const quickQuestionButton = page.locator('.quick-questions button', { hasText: '今天有異常警告嗎？' })
    await expect(quickQuestionButton).toBeVisible({ timeout: 5000 })

    // 確認沒有錯字版本
    const typoButton = page.locator('.quick-questions button', { hasText: '今天有異常警嗎？' })
    await expect(typoButton).not.toBeVisible()
  })

  test('should have all 4 quick question buttons', async ({ page }) => {
    // 先建立新聊天室以顯示快速提問按鈕
    const newChatButton = page.locator('.sidebar-header button:has(i.mdi-plus)')
    await newChatButton.click()

    // 等待快速提問區域出現（確保 activeChatId 已設定）
    await page.waitForSelector('.quick-questions', { timeout: 10000 })

    // 檢查 4 個快速提問按鈕
    const expectedQuestions = [
      '最新的基站狀態如何？',
      '今天有異常警告嗎？',
      '網路效能如何？',
      '用戶連線數量？'
    ]

    for (const question of expectedQuestions) {
      const button = page.locator('.quick-questions button', { hasText: question })
      await expect(button).toBeVisible({ timeout: 5000 })
    }
  })

  test('should close dialog when clicking close button', async ({ page }) => {
    const closeButton = page.locator('.sticky-title button:has(i.mdi-close)')
    await closeButton.click()

    // 對話框應該關閉
    await expect(page.locator('.chat-container')).not.toBeVisible()
  })
})
