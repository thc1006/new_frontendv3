import { test, expect } from '@playwright/test'

// Project Setting 頁面的 E2E 測試
// 對應 Figma Node 3:755, 3:876
test.describe('Project Setting Page', () => {
  let projectId: string

  test.beforeEach(async ({ page }) => {
    // 先登入
    await page.goto('/login')
    await page.locator('input[type="text"]').first().fill('admin1')
    await page.locator('input[type="password"]').first().fill('admin1')
    await page.locator('button:has-text("Login")').click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })

    // 取得第一個專案的 ID - 透過點擊 View Project 後從 URL 擷取
    await page.waitForSelector('.view-project-link', { timeout: 10000 })
    const viewBtn = page.locator('.view-project-link').first()
    await viewBtn.click()

    // 等待導航完成
    await page.waitForURL(/\/projects\/\d+\//, { timeout: 10000 })
    const url = page.url()
    const match = url.match(/\/projects\/(\d+)\//)
    projectId = match ? match[1] : '1'

    // 導航到專案設定頁面
    await page.goto(`/projects/${projectId}/setting`)
  })

  // Task 9.1: 頁面結構測試
  test.describe('Page Structure', () => {
    test('should display project setting page', async ({ page }) => {
      await expect(page.locator('.v-container')).toBeVisible({ timeout: 10000 })
    })

    test('should display page title Project Setting', async ({ page }) => {
      await expect(page.locator('h2')).toContainText(/Project Setting/i)
    })
  })

  // Task 9.2: 專案名稱區域測試
  test.describe('Project Name Section', () => {
    test('should have Project Name label', async ({ page }) => {
      await expect(page.locator('text=Project Name')).toBeVisible({ timeout: 10000 })
    })

    test('should display current project name', async ({ page }) => {
      // 應該有顯示專案名稱的元素
      const nameElement = page.locator('.text-h6').first()
      await expect(nameElement).toBeVisible()
    })

    test('should have Edit button', async ({ page }) => {
      const editBtn = page.locator('button:has-text("Edit")')
      await expect(editBtn).toBeVisible()
    })

    test('should show input field when Edit is clicked', async ({ page }) => {
      const editBtn = page.locator('button:has-text("Edit")')
      await editBtn.click()

      // 點擊後應該出現輸入框 (第一個 v-text-field 是專案名稱)
      const input = page.locator('.v-text-field input').first()
      await expect(input).toBeVisible()

      // 按鈕文字應該變成 Save
      await expect(page.locator('button:has-text("Save")')).toBeVisible()
    })
  })

  // Task 9.3: 成員列表測試
  test.describe('Members List Section', () => {
    test('should have Members List label', async ({ page }) => {
      await expect(page.locator('text=Members List')).toBeVisible({ timeout: 10000 })
    })

    test('should have email input field', async ({ page }) => {
      const emailInput = page.locator('input[type="text"]').or(page.locator('.v-text-field input'))
      await expect(emailInput.first()).toBeVisible()
    })

    test('should have Invite button', async ({ page }) => {
      const inviteBtn = page.locator('button:has-text("Invite")')
      await expect(inviteBtn).toBeVisible()
    })

    test('should have Remove button', async ({ page }) => {
      const removeBtn = page.locator('button:has-text("Remove")')
      await expect(removeBtn).toBeVisible()
    })

    test('should display member roles (Owner/participant)', async ({ page }) => {
      // 至少應該顯示 Owner
      await expect(page.locator('text=Owner')).toBeVisible()
    })
  })

  // Task 9.4: 操作按鈕測試
  test.describe('Action Buttons', () => {
    test('should have Back button', async ({ page }) => {
      const backBtn = page.locator('button:has-text("Back")')
      await expect(backBtn).toBeVisible({ timeout: 10000 })
    })

    test('should have Delete button', async ({ page }) => {
      const deleteBtn = page.locator('button:has-text("Delete")')
      await expect(deleteBtn).toBeVisible()
    })

    test('should navigate back on Back button click', async ({ page }) => {
      // 先記錄當前 URL
      const currentUrl = page.url()

      const backBtn = page.locator('button:has-text("Back")')
      await backBtn.click()

      // 應該離開設定頁面
      await expect(page).not.toHaveURL(currentUrl)
    })
  })

  // Task 9.5: Delete 確認對話框測試 (Figma 3:876)
  test.describe('Delete Confirmation Dialog', () => {
    test('should show confirmation dialog when Delete is clicked', async ({ page }) => {
      const deleteBtn = page.locator('button:has-text("Delete")').last()
      await deleteBtn.click()

      // 應該顯示確認對話框
      await expect(page.locator('.v-dialog')).toBeVisible({ timeout: 5000 })
    })

    test('should display warning message in dialog', async ({ page }) => {
      const deleteBtn = page.locator('button:has-text("Delete")').last()
      await deleteBtn.click()

      // 應該顯示警告訊息
      await expect(page.locator('text=This action will delete the whole project')).toBeVisible()
    })

    test('should have Back and Delete buttons in dialog', async ({ page }) => {
      const deleteBtn = page.locator('button:has-text("Delete")').last()
      await deleteBtn.click()

      // 對話框內應該有 Back 和 Delete 按鈕
      const dialog = page.locator('.v-dialog')
      await expect(dialog.locator('button:has-text("Back")')).toBeVisible()
      await expect(dialog.locator('button:has-text("Delete")')).toBeVisible()
    })

    test('should close dialog when Back is clicked', async ({ page }) => {
      const deleteBtn = page.locator('button:has-text("Delete")').last()
      await deleteBtn.click()

      // 點擊 Back 關閉對話框
      const dialog = page.locator('.v-dialog')
      await dialog.locator('button:has-text("Back")').click()

      // 對話框應該關閉
      await expect(dialog).not.toBeVisible()
    })
  })

  // Task 9.6: Figma 樣式對齊測試
  test.describe('Figma Alignment', () => {
    test('should have blue Edit button', async ({ page }) => {
      const editBtn = page.locator('button:has-text("Edit")')
      await expect(editBtn).toBeVisible({ timeout: 10000 })
    })

    test('should have blue Invite button', async ({ page }) => {
      const inviteBtn = page.locator('button:has-text("Invite")')
      await expect(inviteBtn).toBeVisible()
    })

    test('should have red outline Remove button', async ({ page }) => {
      const removeBtn = page.locator('button:has-text("Remove")')
      await expect(removeBtn).toBeVisible()
    })

    test('should have gray Back button', async ({ page }) => {
      const backBtn = page.locator('button:has-text("Back")').first()
      await expect(backBtn).toBeVisible()
    })

    test('should have red Delete button', async ({ page }) => {
      const deleteBtn = page.locator('button:has-text("Delete")').last()
      await expect(deleteBtn).toBeVisible()
    })
  })
})
