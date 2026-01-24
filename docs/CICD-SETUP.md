# CI/CD 設定指南

本文檔說明如何設定完整的 GitHub PR-based CI/CD 流程，確保所有變更必須通過 PR 和自動化測試才能合併到 main branch。

## 架構概覽

```
開發者 ──▶ Feature Branch ──▶ PR ──▶ CI (測試) ──▶ Review ──▶ Merge ──▶ CD (佈署)
                                       │                              │
                                       ▼                              ▼
                              GitHub Actions                   K8s Deployment
                              (self-hosted runner)            (自動滾動更新)
```

## 設定步驟

### Step 1: 安裝 Self-Hosted GitHub Runner

在你的伺服器 (192.168.0.229) 上執行：

```bash
# 1. 前往 GitHub 取得 runner token
# https://github.com/thc1006/new_frontendv3/settings/actions/runners/new

# 2. 設定 token 環境變數
export RUNNER_TOKEN=你從GitHub複製的token

# 3. 執行安裝腳本
chmod +x scripts/setup-github-runner.sh
./scripts/setup-github-runner.sh
```

### Step 2: 設定 GitHub Branch Protection Rules

1. 前往 https://github.com/thc1006/new_frontendv3/settings/branches

2. 點擊 **Add branch protection rule**

3. 設定以下規則：

| 設定項目 | 值 |
|---------|-----|
| Branch name pattern | `main` |
| ✅ Require a pull request before merging | 啟用 |
| ✅ Require approvals | 1 (或依團隊需求) |
| ✅ Require status checks to pass before merging | 啟用 |
| ✅ Require branches to be up to date before merging | 啟用 |
| Status checks that are required | `lint`, `test`, `build`, `pr-status` |
| ✅ Require conversation resolution before merging | 啟用 |
| ✅ Do not allow bypassing the above settings | 啟用 (連 admin 也要遵守) |

4. 點擊 **Create** 或 **Save changes**

### Step 3: 設定 GitHub Secrets (如果需要)

前往 https://github.com/thc1006/new_frontendv3/settings/secrets/actions

新增以下 secrets (如果使用外部 registry)：

| Secret 名稱 | 說明 |
|------------|------|
| `REGISTRY_USERNAME` | Container registry 使用者名稱 |
| `REGISTRY_PASSWORD` | Container registry 密碼 |

### Step 4: 設定 Environments (可選)

前往 https://github.com/thc1006/new_frontendv3/settings/environments

1. 點擊 **New environment**
2. 名稱輸入 `production`
3. 設定：
   - ✅ Required reviewers (如需人工審核佈署)
   - ✅ Wait timer (例如等待 5 分鐘再佈署)

---

## 使用方式

### 日常開發流程

```bash
# 1. 建立 feature branch
git checkout -b feature/my-new-feature

# 2. 進行開發並 commit
git add .
git commit -m "feat: add new feature"

# 3. 推送到 GitHub
git push -u origin feature/my-new-feature

# 4. 前往 GitHub 建立 PR
# https://github.com/thc1006/new_frontendv3/compare/feature/my-new-feature

# 5. CI 自動執行：
#    - ESLint 檢查
#    - TypeScript 類型檢查
#    - E2E 測試 (Playwright)
#    - 建構驗證

# 6. 所有 checks 通過後，請求 review

# 7. Review 通過後合併 PR

# 8. CD 自動執行：
#    - 建構新的 container image
#    - 推送到 registry
#    - 更新 K8s deployment
#    - 健康檢查
```

### 查看 CI/CD 狀態

- **CI 狀態**: PR 頁面會顯示所有 checks 狀態
- **CD 狀態**: https://github.com/thc1006/new_frontendv3/actions
- **K8s 狀態**: `kubectl get pods -l app=frontend`

### 手動觸發重新佈署

如果需要手動觸發佈署（不建議，應透過 PR）：

```bash
# 觸發 workflow
gh workflow run cd.yml --ref main
```

---

## CI/CD 流程圖

```
┌─────────────────────────────────────────────────────────────────┐
│                        Pull Request                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐      │
│  │  Lint   │───▶│  Test   │───▶│  Build  │───▶│ Status  │      │
│  │ (ESLint)│    │  (E2E)  │    │ (Check) │    │ (Pass?) │      │
│  └─────────┘    └─────────┘    └─────────┘    └────┬────┘      │
│                                                     │           │
│                                              ┌──────┴──────┐    │
│                                              │   Review    │    │
│                                              │  Required   │    │
│                                              └──────┬──────┘    │
│                                                     │           │
│                                              ┌──────┴──────┐    │
│                                              │   Merge     │    │
│                                              │  to Main    │    │
│                                              └──────┬──────┘    │
└─────────────────────────────────────────────────────┼───────────┘
                                                      │
                                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Continuous Deployment                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐      │
│  │  Build  │───▶│  Push   │───▶│ Deploy  │───▶│ Health  │      │
│  │ Image   │    │Registry │    │  K8s    │    │ Check   │      │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 回滾 (Rollback)

如果佈署後發現問題，可以快速回滾：

```bash
# 查看 deployment 歷史
kubectl rollout history deployment/frontend-deployment

# 回滾到上一個版本
kubectl rollout undo deployment/frontend-deployment

# 回滾到特定版本
kubectl rollout undo deployment/frontend-deployment --to-revision=2
```

---

## 故障排除

### Runner 無法連接

```bash
# 查看 runner 狀態
sudo systemctl status actions.runner.thc1006-new_frontendv3.k8s-deploy-runner

# 查看日誌
journalctl -u actions.runner.thc1006-new_frontendv3.k8s-deploy-runner -f

# 重啟 runner
sudo systemctl restart actions.runner.thc1006-new_frontendv3.k8s-deploy-runner
```

### CI 測試失敗

1. 查看 GitHub Actions 日誌
2. 本地執行測試: `cd frontend && npx playwright test`
3. 查看測試報告 artifact

### CD 佈署失敗

```bash
# 查看 pod 狀態
kubectl get pods -l app=frontend

# 查看 pod 日誌
kubectl logs -l app=frontend --tail=100

# 查看 deployment 事件
kubectl describe deployment frontend-deployment
```

---

## 相關資源

- [GitHub Actions 文檔](https://docs.github.com/en/actions)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [Self-hosted Runners](https://docs.github.com/en/actions/hosting-your-own-runners/about-self-hosted-runners)
- [Kubernetes Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
