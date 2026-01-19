# GitHub Branch Protection & Copilot Code Review Setup

本文件說明如何在 GitHub Web UI 設定 Branch Protection Rules 和 Copilot Code Review Automation。

## 1. Branch Protection Rules (分支保護規則)

### 步驟
1. 前往 Repository → **Settings** → **Rules** → **Rulesets**
2. 點擊 **New ruleset** → **New branch ruleset**

### 建議的 Main Branch Ruleset

```yaml
Name: Protect main branch
Enforcement status: Active
Bypass list: (空，不允許任何人繞過)

Target branches:
  - Include: main

Rules:
  ✅ Restrict deletions
  ✅ Require linear history
  ✅ Require a pull request before merging
     - Required approvals: 1
     - Dismiss stale pull request approvals when new commits are pushed: ✅
     - Require review from Code Owners: ✅
     - Require approval of the most recent reviewable push: ✅
  ✅ Require status checks to pass
     - Require branches to be up to date before merging: ✅
     - Status checks that are required:
       - ESLint
       - TypeScript Check
       - Production Build
       - Security Audit
  ✅ Block force pushes
```

## 2. Copilot Code Review Automation

### 啟用 Copilot Code Review
1. 前往 Repository → **Settings** → **Code security and analysis**
2. 找到 **GitHub Copilot** 區塊
3. 啟用 **Copilot code review**

### 設定自動請求 Copilot Review

在 **Settings** → **Rules** → **Rulesets** 中新增：

```yaml
Name: Copilot Auto Review
Enforcement status: Active

Target branches:
  - Include: main

Rules:
  ✅ Require a pull request before merging
     - Request pull request review from Copilot: ✅
```

### Copilot Review 範圍設定

在 Repository → **Settings** → **Copilot** → **Code review** 中設定：

```
Review scope:
  ✅ All pull requests

Focus areas:
  ✅ Security vulnerabilities
  ✅ Code quality
  ✅ Performance issues
  ✅ Best practices

Ignore patterns:
  - node_modules/**
  - .nuxt/**
  - .output/**
  - **/*.min.js
  - **/generated/**
```

## 3. 推薦的完整 Ruleset 配置

### Main Branch Protection

| 設定項 | 值 | 說明 |
|--------|-----|------|
| Require pull request | ✅ | 禁止直接 push 到 main |
| Required approvals | 1 | 需要至少 1 人核准 |
| Dismiss stale approvals | ✅ | 新 commit 後重新審核 |
| Require CODEOWNERS review | ✅ | 需要 CODEOWNERS 審核 |
| Require status checks | ✅ | 所有 CI 必須通過 |
| Require linear history | ✅ | 強制使用 rebase/squash |
| Block force pushes | ✅ | 禁止強制推送 |
| Restrict deletions | ✅ | 禁止刪除分支 |

### Required Status Checks

以下 CI jobs 必須通過才能合併：

1. **ESLint** - 程式碼風格檢查
2. **TypeScript Check** - 類型檢查
3. **Production Build** - 生產環境建置
4. **Security Audit** - 安全性稽核
5. **Analyze** (CodeQL) - 程式碼安全分析

## 4. 設定步驟總覽

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Settings                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Settings → Rules → Rulesets → New branch ruleset    │
│     └─ 設定 branch protection rules                     │
│                                                          │
│  2. Settings → Code security and analysis               │
│     └─ 啟用 Copilot code review                         │
│                                                          │
│  3. Settings → Copilot → Code review                    │
│     └─ 設定 review scope 和 focus areas                 │
│                                                          │
│  4. Settings → Actions → General                        │
│     └─ 允許 GitHub Actions 建立 PR comments             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 5. 驗證設定

設定完成後，建立一個測試 PR 來驗證：

1. 確認 CI workflows 正常執行
2. 確認 Copilot 自動請求 review
3. 確認 CODEOWNERS 自動請求 review
4. 確認無法直接 merge 未通過 status checks 的 PR
5. 確認無法直接 push 到 main branch

## 6. 故障排除

### CI Status Checks 沒有出現
- 確認 workflow 檔案在 `.github/workflows/` 目錄
- 確認 workflow 已經至少執行過一次
- 檢查 branch filter 是否正確

### Copilot Review 沒有自動觸發
- 確認 Copilot 已在 Organization/Repository 層級啟用
- 確認有足夠的 Copilot seats
- 檢查 Repository settings 中的 Copilot 設定
