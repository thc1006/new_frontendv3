import { test, expect } from '@playwright/test'
import { skipIfNoBackend } from './utils/test-helpers'

test.describe('ChatInterface Figma Alignment', () => {
  skipIfNoBackend()

  let projectId: string

  test.beforeEach(async ({ page }) => {
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
    await page.waitForLoadState('networkidle')

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
    await page.waitForTimeout(1000)

    // 檢查快速提問按鈕
    const quickQuestionButton = page.locator('.quick-questions button', { hasText: '今天有異常警告嗎？' })
    await expect(quickQuestionButton).toBeVisible()

    // 確認沒有錯字版本
    const typoButton = page.locator('.quick-questions button', { hasText: '今天有異常警嗎？' })
    await expect(typoButton).not.toBeVisible()
  })

  test('should have all 4 quick question buttons', async ({ page }) => {
    // 先建立新聊天室以顯示快速提問按鈕
    const newChatButton = page.locator('.sidebar-header button:has(i.mdi-plus)')
    await newChatButton.click()
    await page.waitForTimeout(1000)

    // 檢查 4 個快速提問按鈕
    const expectedQuestions = [
      '最新的基站狀態如何？',
      '今天有異常警告嗎？',
      '網路效能如何？',
      '用戶連線數量？'
    ]

    for (const question of expectedQuestions) {
      const button = page.locator('.quick-questions button', { hasText: question })
      await expect(button).toBeVisible()
    }
  })

  test('should close dialog when clicking close button', async ({ page }) => {
    const closeButton = page.locator('.sticky-title button:has(i.mdi-close)')
    await closeButton.click()

    // 對話框應該關閉
    await expect(page.locator('.chat-container')).not.toBeVisible()
  })
})
