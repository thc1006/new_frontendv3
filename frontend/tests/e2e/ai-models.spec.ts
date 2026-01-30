import { test, expect } from '@playwright/test'
import { skipIfNoBackend } from './utils/test-helpers'

// Mock data for AI models
const mockAiModels = [
  {
    model_id: 1,
    model_name: 'NES Model',
    ai_metrics: [
      { id: 1, name: 'Metric 1', description: 'Description 1', type: 'gauge', unit: '%' }
    ]
  },
  {
    model_id: 2,
    model_name: 'Positioning Model',
    ai_metrics: [
      { id: 2, name: 'Metric 2', description: 'Description 2', type: 'counter', unit: 'count' }
    ]
  }
]

const mockAbstractMetrics = [
  { id: 1, display_name: 'Abstract Metric 1' },
  { id: 2, display_name: 'Abstract Metric 2' }
]

// AI Models 頁面的 E2E 測試
// 依據 CLAUDE.md 要求覆蓋：按鈕狀態、點擊後狀態轉移、Delete 確認流程
test.describe('AI Models Page', () => {
  skipIfNoBackend()

  test.beforeEach(async ({ page }) => {
    // Mock AI models API endpoints
    await page.route('**/api/primitive_ai_models**', async (route) => {
      const method = route.request().method()
      const url = route.request().url()

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockAiModels)
        })
      } else if (method === 'POST') {
        const newModel = { model_id: Date.now(), model_name: 'New Model', ai_metrics: [] }
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newModel)
        })
      } else if (method === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      } else if (method === 'PUT' || method === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ model_id: 1, model_name: 'Updated Model' })
        })
      } else {
        await route.continue()
      }
    })

    // Mock abstract metrics API
    await page.route('**/api/abstract_metrics**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockAbstractMetrics)
      })
    })

    // 先登入
    await page.goto('/login')
    await page.locator('input[type="text"]').first().fill('admin1')
    await page.locator('input[type="password"]').first().fill('admin1')
    await page.locator('button:has-text("Login")').click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })

    // 進入 AI Models 頁面
    await page.goto('/ai-models')
    await page.waitForSelector('.ai-list-container', { timeout: 10000 })
  })

  test('should display AI Models list with action buttons', async ({ page }) => {
    // 確認列表標題
    await expect(page.locator('h2:has-text("Primitive AI")')).toBeVisible()

    // 確認表頭存在
    await expect(page.locator('.ai-list-header')).toBeVisible()

    // 確認操作欄有六個按鈕類型
    const firstRow = page.locator('.ai-list-row').first()
    if (await firstRow.isVisible()) {
      const actionBtns = firstRow.locator('.action-btns button')
      // 應有：詳細、編輯、預覽、Pretrain、Retrain、刪除
      await expect(actionBtns).toHaveCount(6)
    }
  })

  test('should have Enable/Disable switch in each row', async ({ page }) => {
    const firstRow = page.locator('.ai-list-row').first()
    if (await firstRow.isVisible()) {
      // 確認 switch 元件存在
      const switchEl = firstRow.locator('.v-switch')
      await expect(switchEl).toBeVisible()

      // 確認 switch 有 input checkbox
      const switchInput = firstRow.locator('.v-switch input[type="checkbox"]')
      await expect(switchInput).toBeAttached()

      // 確認 switch 是可互動的（非 disabled）
      const isDisabled = await switchInput.isDisabled()
      expect(isDisabled).toBe(false)
    }
  })

  test('should open Preview dialog when clicked', async ({ page }) => {
    const firstRow = page.locator('.ai-list-row').first()
    if (await firstRow.isVisible()) {
      const previewBtn = firstRow.locator('button:has-text("預覽")')
      await previewBtn.click()
      // 現在 Preview 會開啟對話框
      await expect(page.locator('.v-dialog:has-text("Preview")')).toBeVisible({ timeout: 3000 })
    }
  })

  test('should open Pretrain Result dialog when clicked', async ({ page }) => {
    const firstRow = page.locator('.ai-list-row').first()
    if (await firstRow.isVisible()) {
      const pretrainBtn = firstRow.locator('button:has-text("Pretrain")')
      await pretrainBtn.click()
      // 現在 Pretrain 會開啟結果對話框而非只是 snackbar
      await expect(page.locator('.v-dialog:has-text("Pre-train Result")')).toBeVisible({ timeout: 3000 })
    }
  })

  test('should open Retrain dialog and show placeholder warning', async ({ page }) => {
    const firstRow = page.locator('.ai-list-row').first()
    if (await firstRow.isVisible()) {
      // 使用更精確的 locator 避免匹配到 Pretrain
      const retrainBtn = firstRow.locator('button.bg-purple')
      await retrainBtn.click()

      // 應出現 Retrain 對話框
      const dialog = page.locator('.v-dialog:has-text("Retrain 模型")')
      await expect(dialog).toBeVisible({ timeout: 3000 })

      // 確認有 round 和 epochs 輸入欄
      await expect(dialog.locator('input[type="number"]')).toHaveCount(2)

      // 點擊開始訓練
      await dialog.locator('button:has-text("開始訓練")').click()

      // 應顯示 placeholder 提示
      await expect(page.locator('.v-snackbar:has-text("Retrain")')).toBeVisible({ timeout: 3000 })
    }
  })

  test('should open Delete dialog and require confirmation', async ({ page }) => {
    const firstRow = page.locator('.ai-list-row').first()
    if (await firstRow.isVisible()) {
      const deleteBtn = firstRow.locator('button:has-text("刪除")')
      await deleteBtn.click()

      // 應出現確認對話框
      const confirmDialog = page.locator('.v-dialog:has-text("確定要刪除")')
      await expect(confirmDialog).toBeVisible({ timeout: 3000 })

      // 確認有取消和確定刪除按鈕
      await expect(confirmDialog.locator('button:has-text("取消")')).toBeVisible()
      await expect(confirmDialog.locator('button:has-text("確定刪除")')).toBeVisible()

      // 點擊取消應關閉對話框
      await confirmDialog.locator('button:has-text("取消")').click()
      await expect(confirmDialog).not.toBeVisible()
    }
  })

  test('should open Detail dialog when clicking row or detail button', async ({ page }) => {
    const firstRow = page.locator('.ai-list-row').first()
    if (await firstRow.isVisible()) {
      const detailBtn = firstRow.locator('button:has-text("詳細")')
      await detailBtn.click()

      // 應出現詳細資料對話框
      const detailDialog = page.locator('.v-dialog:has-text("模型詳細資料")')
      await expect(detailDialog).toBeVisible({ timeout: 3000 })

      // 確認有模型名稱和 ID
      await expect(detailDialog.locator('text=模型名稱')).toBeVisible()
      await expect(detailDialog.locator('text=模型 ID')).toBeVisible()

      // 關閉
      await detailDialog.locator('button:has-text("關閉")').click()
      await expect(detailDialog).not.toBeVisible()
    }
  })

  test('should open Edit dialog with model name prefilled', async ({ page }) => {
    const firstRow = page.locator('.ai-list-row').first()
    if (await firstRow.isVisible()) {
      const editBtn = firstRow.locator('button:has-text("編輯")')
      await editBtn.click()

      // 應出現編輯對話框
      const editDialog = page.locator('.v-dialog:has-text("編輯模型")')
      await expect(editDialog).toBeVisible({ timeout: 3000 })

      // 確認輸入欄有值
      const nameInput = editDialog.locator('input')
      const inputValue = await nameInput.inputValue()
      expect(inputValue.length).toBeGreaterThan(0)

      // 取消
      await editDialog.locator('button:has-text("取消")').click()
      await expect(editDialog).not.toBeVisible()
    }
  })

  test('should have version selector in each row', async ({ page }) => {
    const firstRow = page.locator('.ai-list-row').first()
    if (await firstRow.isVisible()) {
      // 確認版本選擇器存在
      const versionSelect = firstRow.locator('.version-select')
      await expect(versionSelect).toBeVisible()

      // 點擊展開下拉選單
      await versionSelect.click()

      // 應該有選項出現
      const menuItems = page.locator('.v-list-item')
      await expect(menuItems.first()).toBeVisible({ timeout: 3000 })
    }
  })

  test('should be able to select different version', async ({ page }) => {
    const firstRow = page.locator('.ai-list-row').first()
    if (await firstRow.isVisible()) {
      const versionSelect = firstRow.locator('.version-select')
      await versionSelect.click()

      // 等待選單出現（使用 Playwright auto-waiting）
      const v2Option = page.locator('.v-overlay--active .v-list-item:has-text("v2")')
      await expect(v2Option).toBeVisible({ timeout: 3000 })
      await v2Option.click()

      // 確認選單關閉
      await expect(page.locator('.v-overlay--active .v-list')).not.toBeVisible({ timeout: 3000 })
    }
  })

  test('should show placeholder warning when changing version', async ({ page }) => {
    const firstRow = page.locator('.ai-list-row').first()
    if (await firstRow.isVisible()) {
      const versionSelect = firstRow.locator('.version-select')
      await versionSelect.click()

      // 等待選單出現並選擇 v2（使用 Playwright auto-waiting）
      const v2Option = page.locator('.v-overlay--active .v-list-item:has-text("v2")')
      await expect(v2Option).toBeVisible({ timeout: 3000 })
      await v2Option.click()

      // 確認顯示 placeholder 警告
      await expect(page.locator('.v-snackbar:has-text("版本切換功能尚未接上後端")')).toBeVisible({ timeout: 3000 })
    }
  })

  // Phase 1.3: Pretrain Result 模態視窗測試
  test('should open Pretrain Result dialog after Pretrain completes', async ({ page }) => {
    const firstRow = page.locator('.ai-list-row').first()
    if (await firstRow.isVisible()) {
      const pretrainBtn = firstRow.locator('button:has-text("Pretrain")')
      await pretrainBtn.click()

      // 等待 loading 結束後應顯示結果對話框
      const resultDialog = page.locator('.v-dialog:has-text("Pre-train Result")')
      await expect(resultDialog).toBeVisible({ timeout: 3000 })

      // 確認有標題
      await expect(resultDialog.locator('.v-card-title')).toContainText('Pre-train Result')
    }
  })

  test('should show placeholder metrics in Pretrain Result dialog', async ({ page }) => {
    const firstRow = page.locator('.ai-list-row').first()
    if (await firstRow.isVisible()) {
      const pretrainBtn = firstRow.locator('button:has-text("Pretrain")')
      await pretrainBtn.click()

      // 等待結果對話框
      const resultDialog = page.locator('.v-dialog:has-text("Pre-train Result")')
      await expect(resultDialog).toBeVisible({ timeout: 3000 })

      // 確認有 placeholder 指標資訊區塊
      await expect(resultDialog.locator('.pretrain-metrics-summary')).toBeVisible()
    }
  })

  test('should show placeholder chart area in Pretrain Result dialog', async ({ page }) => {
    const firstRow = page.locator('.ai-list-row').first()
    if (await firstRow.isVisible()) {
      const pretrainBtn = firstRow.locator('button:has-text("Pretrain")')
      await pretrainBtn.click()

      // 等待結果對話框
      const resultDialog = page.locator('.v-dialog:has-text("Pre-train Result")')
      await expect(resultDialog).toBeVisible({ timeout: 3000 })

      // 確認有 placeholder 圖表區塊
      await expect(resultDialog.locator('.pretrain-chart-area')).toBeVisible()
    }
  })

  test('should close Pretrain Result dialog with close button', async ({ page }) => {
    const firstRow = page.locator('.ai-list-row').first()
    if (await firstRow.isVisible()) {
      const pretrainBtn = firstRow.locator('button:has-text("Pretrain")')
      await pretrainBtn.click()

      // 等待結果對話框
      const resultDialog = page.locator('.v-dialog:has-text("Pre-train Result")')
      await expect(resultDialog).toBeVisible({ timeout: 3000 })

      // 點擊關閉
      await resultDialog.locator('button:has-text("關閉")').click()
      await expect(resultDialog).not.toBeVisible()
    }
  })

  // Phase 1.4: Preview 模態視窗測試
  test('should open Preview dialog after Preview button is clicked', async ({ page }) => {
    const firstRow = page.locator('.ai-list-row').first()
    if (await firstRow.isVisible()) {
      const previewBtn = firstRow.locator('button:has-text("預覽")')
      await previewBtn.click()

      // 等待 loading 結束後應顯示 Preview 對話框
      const previewDialog = page.locator('.v-dialog:has-text("Preview")')
      await expect(previewDialog).toBeVisible({ timeout: 3000 })

      // 確認有標題
      await expect(previewDialog.locator('.v-card-title')).toContainText('Preview')
    }
  })

  test('should show model info in Preview dialog', async ({ page }) => {
    const firstRow = page.locator('.ai-list-row').first()
    if (await firstRow.isVisible()) {
      const previewBtn = firstRow.locator('button:has-text("預覽")')
      await previewBtn.click()

      // 等待 Preview 對話框
      const previewDialog = page.locator('.v-dialog:has-text("Preview")')
      await expect(previewDialog).toBeVisible({ timeout: 3000 })

      // 確認有模型資訊區塊
      await expect(previewDialog.locator('.preview-model-info')).toBeVisible()
    }
  })

  test('should show placeholder content area in Preview dialog', async ({ page }) => {
    const firstRow = page.locator('.ai-list-row').first()
    if (await firstRow.isVisible()) {
      const previewBtn = firstRow.locator('button:has-text("預覽")')
      await previewBtn.click()

      // 等待 Preview 對話框
      const previewDialog = page.locator('.v-dialog:has-text("Preview")')
      await expect(previewDialog).toBeVisible({ timeout: 3000 })

      // 確認有 placeholder 內容區塊
      await expect(previewDialog.locator('.preview-content-area')).toBeVisible()
    }
  })

  test('should close Preview dialog with close button', async ({ page }) => {
    const firstRow = page.locator('.ai-list-row').first()
    if (await firstRow.isVisible()) {
      const previewBtn = firstRow.locator('button:has-text("預覽")')
      await previewBtn.click()

      // 等待 Preview 對話框
      const previewDialog = page.locator('.v-dialog:has-text("Preview")')
      await expect(previewDialog).toBeVisible({ timeout: 3000 })

      // 點擊關閉
      await previewDialog.locator('button:has-text("關閉")').click()
      await expect(previewDialog).not.toBeVisible()
    }
  })

  // Phase 1.2: 按鈕狀態優化測試
  test('should show loading state when Pretrain button is clicked', async ({ page }) => {
    const firstRow = page.locator('.ai-list-row').first()
    if (await firstRow.isVisible()) {
      const pretrainBtn = firstRow.locator('button:has-text("Pretrain")')

      // 點擊前應該沒有 loading
      await expect(pretrainBtn.locator('.v-progress-circular')).not.toBeVisible()

      // 點擊按鈕
      await pretrainBtn.click()

      // 應該出現 loading 狀態 (v-btn 的 loading 屬性會顯示 v-progress-circular)
      await expect(pretrainBtn.locator('.v-progress-circular')).toBeVisible({ timeout: 1000 })

      // 等待 loading 結束後應顯示結果對話框
      await expect(page.locator('.v-dialog:has-text("Pre-train Result")')).toBeVisible({ timeout: 3000 })
    }
  })

  test('should show loading state when Preview button is clicked', async ({ page }) => {
    const firstRow = page.locator('.ai-list-row').first()
    if (await firstRow.isVisible()) {
      const previewBtn = firstRow.locator('button:has-text("預覽")')

      // 點擊前應該沒有 loading
      await expect(previewBtn.locator('.v-progress-circular')).not.toBeVisible()

      // 點擊按鈕
      await previewBtn.click()

      // 應該出現 loading 狀態
      await expect(previewBtn.locator('.v-progress-circular')).toBeVisible({ timeout: 1000 })

      // 等待 loading 結束後應顯示 Preview 對話框
      await expect(page.locator('.v-dialog:has-text("Preview")')).toBeVisible({ timeout: 3000 })
    }
  })

  test('should show loading state when Enable/Disable switch is toggled', async ({ page }) => {
    const firstRow = page.locator('.ai-list-row').first()
    if (await firstRow.isVisible()) {
      // 找到 switch 的容器（包含 loading overlay）
      const switchContainer = firstRow.locator('.enable-switch-container')
      const switchEl = switchContainer.locator('.v-switch')

      // 點擊 switch
      await switchEl.click()

      // 應該出現 loading overlay
      await expect(switchContainer.locator('.switch-loading')).toBeVisible({ timeout: 1000 })

      // 等待 loading 結束後應顯示 snackbar
      await expect(page.locator('.v-snackbar:has-text("啟用/停用")')).toBeVisible({ timeout: 3000 })
    }
  })

  // Figma 對齊測試
  test.describe('Pretrain/Retrain Modal Figma Alignment', () => {
    test('Pretrain Result should show training status indicator', async ({ page }) => {
      const firstRow = page.locator('.ai-list-row').first()
      if (await firstRow.isVisible()) {
        const pretrainBtn = firstRow.locator('button:has-text("Pretrain")')
        await pretrainBtn.click()

        const resultDialog = page.locator('.v-dialog:has-text("Pre-train Result")')
        await expect(resultDialog).toBeVisible({ timeout: 3000 })

        // 確認有 Training Status 顯示
        const statusBar = resultDialog.locator('.training-status-bar')
        await expect(statusBar).toBeVisible()
        await expect(statusBar.locator('.status-label')).toContainText('Training Status')
        await expect(statusBar.locator('.status-value')).toBeVisible()
      }
    })

    test('Pretrain Result should show epoch progress', async ({ page }) => {
      const firstRow = page.locator('.ai-list-row').first()
      if (await firstRow.isVisible()) {
        const pretrainBtn = firstRow.locator('button:has-text("Pretrain")')
        await pretrainBtn.click()

        const resultDialog = page.locator('.v-dialog:has-text("Pre-train Result")')
        await expect(resultDialog).toBeVisible({ timeout: 3000 })

        // 確認有 Epoch 進度顯示
        const statusBar = resultDialog.locator('.training-status-bar')
        await expect(statusBar.locator('.epoch-label')).toContainText('Epoch')
        await expect(statusBar.locator('.epoch-value')).toBeVisible()

        // 確認 epoch 格式為 "數字/數字"（如 "0/1000"）
        const epochText = await statusBar.locator('.epoch-value').textContent()
        expect(epochText).toMatch(/^\d+\/\d+$/)
      }
    })

    test('Retrain Modal should have gray header background', async ({ page }) => {
      const firstRow = page.locator('.ai-list-row').first()
      if (await firstRow.isVisible()) {
        const retrainBtn = firstRow.locator('button.bg-purple')
        await retrainBtn.click()

        const dialog = page.locator('.v-dialog:has-text("Retrain 模型")')
        await expect(dialog).toBeVisible({ timeout: 3000 })

        // 確認標題區有灰色背景
        const cardTitle = dialog.locator('.v-card-title')
        await expect(cardTitle).toBeVisible()

        // 檢查背景色是否為灰色（#c7c7c7 或類似）
        const bgColor = await cardTitle.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor
        })

        // rgb(199, 199, 199) = #c7c7c7
        expect(bgColor).toBe('rgb(199, 199, 199)')
      }
    })

    test('Pretrain Result header should have solid gray background', async ({ page }) => {
      const firstRow = page.locator('.ai-list-row').first()
      if (await firstRow.isVisible()) {
        const pretrainBtn = firstRow.locator('button:has-text("Pretrain")')
        await pretrainBtn.click()

        const resultDialog = page.locator('.v-dialog:has-text("Pre-train Result")')
        await expect(resultDialog).toBeVisible({ timeout: 3000 })

        const cardTitle = resultDialog.locator('.v-card-title')
        const bgColor = await cardTitle.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor
        })

        // 確認為純色灰色背景而非 gradient
        expect(bgColor).toBe('rgb(199, 199, 199)')
      }
    })
  })
})
