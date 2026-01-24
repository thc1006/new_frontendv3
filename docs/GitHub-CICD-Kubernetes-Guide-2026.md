# 2026 完整指南：使用 GitHub Actions 實現 Kubernetes 自動化 CI/CD

> **作者**: WiSDON Lab
> **最後更新**: 2026 年 1 月
> **適用版本**: GitHub Actions, Kubernetes 1.28+, Actions Runner Controller (ARC)

本文將帶你從零開始建立一個生產級別的 CI/CD Pipeline，實現「PR 合併即自動佈署」的現代化開發流程，就像 Cloudflare Workers 一樣優雅。

---

## 目錄

1. [架構概覽](#架構概覽)
2. [為什麼選擇這個架構？](#為什麼選擇這個架構)
3. [核心概念](#核心概念)
4. [Step 1: 設定 Self-Hosted Runner](#step-1-設定-self-hosted-runner)
5. [Step 2: 設定 Branch Protection 或 Rulesets](#step-2-設定-branch-protection-或-rulesets)
6. [Step 3: 建立 CI Workflow](#step-3-建立-ci-workflow)
7. [Step 4: 建立 CD Workflow](#step-4-建立-cd-workflow)
8. [Step 5: 進階設定 - Actions Runner Controller (ARC)](#step-5-進階設定---actions-runner-controller-arc)
9. [安全性最佳實踐](#安全性最佳實踐)
10. [故障排除](#故障排除)
11. [2026 年重要變更](#2026-年重要變更)
12. [參考資源](#參考資源)

---

## 架構概覽

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GitHub Cloud                                    │
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌───────────────┐    ┌──────────────────┐ │
│  │ Feature  │───▶│    PR    │───▶│ CI Pipeline   │───▶│ Branch Protection│ │
│  │ Branch   │    │ Created  │    │ (Lint/Test)   │    │ Status Check ✓   │ │
│  └──────────┘    └──────────┘    └───────────────┘    └────────┬─────────┘ │
│                                                                 │           │
│                                                         ┌───────▼────────┐  │
│                                                         │ Merge to Main  │  │
│                                                         └───────┬────────┘  │
└─────────────────────────────────────────────────────────────────┼───────────┘
                                                                  │
                              ┌───────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Your Infrastructure                                   │
│                                                                              │
│  ┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐   │
│  │  Self-Hosted      │    │  Build & Push     │    │  Deploy to K8s    │   │
│  │  GitHub Runner    │───▶│  Container Image  │───▶│  (Rolling Update) │   │
│  └───────────────────┘    └───────────────────┘    └───────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Kubernetes Cluster                              │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐               │   │
│  │  │ Pod v2  │  │ Pod v2  │  │ Pod v1  │  │ Pod v1  │  ← Rolling   │   │
│  │  │  (new)  │  │  (new)  │  │  (old)  │  │  (old)  │    Update    │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 為什麼選擇這個架構？

| 優點 | 說明 |
|------|------|
| **強制 Code Review** | 所有變更必須經過 PR，確保程式碼品質 |
| **自動化測試** | 每個 PR 自動執行測試，防止錯誤進入主線 |
| **零停機部署** | Kubernetes Rolling Update 確保服務不中斷 |
| **快速回滾** | 出問題可在秒級內回滾到上一版本 |
| **審計追蹤** | 所有變更都有完整的 Git 歷史記錄 |
| **GitOps 友好** | 基礎設施即代碼，版本可控 |

---

## 核心概念

### CI vs CD

| 階段 | 觸發時機 | 目的 | 工具 |
|------|----------|------|------|
| **CI (Continuous Integration)** | PR 建立/更新時 | 驗證程式碼品質 | Lint, Test, Build Check |
| **CD (Continuous Deployment)** | 合併到 main 時 | 自動佈署到環境 | Build, Push, Deploy |

### Branch Protection vs Rulesets

根據 [GitHub 官方文檔](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)，**Rulesets 是 Branch Protection 的進化版**：

| 特性 | Branch Protection | Rulesets |
|------|-------------------|----------|
| 作用範圍 | 僅限分支 | 分支 + Tags + 全域 |
| 多規則聚合 | 優先級競爭（只套用一條） | 全部聚合（最嚴格的生效） |
| 組織級管理 | ❌ 每個 repo 獨立設定 | ✅ 可跨 repo 統一管理 |
| 評估模式 | ❌ | ✅ 可在 Evaluate 模式測試規則 |
| Fork 保護 | 有限 | ✅ 完整的 fork network 保護 |

> **2026 建議**：新專案優先使用 Rulesets；現有專案可逐步遷移。

---

## Step 1: 設定 Self-Hosted Runner

### 為什麼需要 Self-Hosted Runner？

1. **存取本地資源**：可直接連接你的 Kubernetes 叢集
2. **成本控制**：避免 GitHub-hosted runner 的使用限制
3. **客製化環境**：安裝特定工具（如 `kubectl`、`helm`、`podman`）

> ⚠️ **2026 年重要變更**：根據 [Northflank 報導](https://northflank.com/blog/github-pricing-change-self-hosted-alternatives-github-actions)，GitHub 從 2026 年 3 月起對 self-hosted runners 收取 $0.002/分鐘費用。公開儲存庫和 GitHub Enterprise Server 客戶可豁免。

### 安裝步驟

根據 [GitHub 官方文檔](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/adding-self-hosted-runners)：

#### 1. 取得 Runner Token

前往你的 GitHub Repository：
```
Settings → Actions → Runners → New self-hosted runner
```

#### 2. 下載並設定 Runner

```bash
# 建立目錄
mkdir actions-runner && cd actions-runner

# 下載最新版 runner (以 Linux x64 為例)
curl -o actions-runner-linux-x64-2.321.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.321.0/actions-runner-linux-x64-2.321.0.tar.gz

# 解壓縮
tar xzf actions-runner-linux-x64-2.321.0.tar.gz

# 設定 runner（替換為你的 repo URL 和 token）
./config.sh --url https://github.com/YOUR_ORG/YOUR_REPO \
  --token YOUR_TOKEN \
  --name "k8s-deploy-runner" \
  --labels "self-hosted,linux,x64,k8s" \
  --work "_work" \
  --unattended
```

#### 3. 安裝為系統服務

```bash
# 安裝為 systemd 服務
sudo ./svc.sh install $(whoami)

# 啟動服務
sudo ./svc.sh start

# 查看狀態
sudo ./svc.sh status
```

### 安全性注意事項

根據 [GitHub Security Guidelines](https://github.com/dduzgun-security/github-self-hosted-runners) 和 [DevZero 最佳實踐](https://www.devzero.io/blog/mastering-self-hosted-runners-for-github-actions-setup-benefits-and-best-practices)：

- ✅ **僅在私有儲存庫使用** self-hosted runners
- ✅ **限制特定 workflows 使用** runners
- ✅ **啟用 Branch Protection**，要求 PR 審核
- ✅ **使用 hardened OS** 作為 runner 主機
- ❌ **避免在 work folder 存放機密資訊**

---

## Step 2: 設定 Branch Protection 或 Rulesets

### 選項 A：使用 Rulesets（推薦）

根據 [GitHub Rulesets 文檔](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)：

1. 前往 `Settings → Rules → Rulesets → New ruleset → New branch ruleset`

2. 設定基本資訊：
   - **Ruleset Name**: `main-protection`
   - **Enforcement status**: `Active`
   - **Bypass list**: 視需求設定（建議留空）

3. 設定 Target branches：
   - 選擇 `Include by pattern`
   - 輸入 `main`

4. 啟用以下 Rules：

| Rule | 說明 |
|------|------|
| ✅ Restrict deletions | 禁止刪除分支 |
| ✅ Require a pull request before merging | 強制 PR |
| ✅ Required approvals: 1 | 至少一人審核 |
| ✅ Dismiss stale pull request approvals when new commits are pushed | 新 commit 需重新審核 |
| ✅ Require status checks to pass | 強制 CI 通過 |
| ✅ Require branches to be up to date before merging | 分支需為最新 |
| ✅ Block force pushes | 禁止強制推送 |

5. 在 Status checks 加入：
   - `lint`
   - `test`
   - `build`

### 選項 B：使用 Branch Protection Rules

根據 [GitHub Branch Protection 文檔](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule)：

1. 前往 `Settings → Branches → Add branch protection rule`

2. 設定：
   - **Branch name pattern**: `main`
   - ✅ **Require a pull request before merging**
     - ✅ Require approvals: 1
   - ✅ **Require status checks to pass before merging**
     - ✅ Require branches to be up to date before merging
     - 搜尋並加入 status checks
   - ✅ **Require conversation resolution before merging**
   - ✅ **Do not allow bypassing the above settings**

> **注意**：根據 [GitHub Community 討論](https://github.com/orgs/community/discussions/167194)，status checks 需要至少執行過一次才會出現在搜尋列表中。

---

## Step 3: 建立 CI Workflow

根據 [GitHub Actions Workflow Syntax](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions) 和 [2025 完整指南](https://generalistprogrammer.com/cheatsheets/github-actions)：

建立 `.github/workflows/ci.yml`：

```yaml
# CI Pipeline - 在 PR 時執行測試
name: CI

on:
  pull_request:
    branches: [main]
    paths:
      - 'frontend/**'
      - '.github/workflows/ci.yml'

# 避免同一 PR 同時執行多個 workflow
concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '20'

jobs:
  lint:
    name: Lint & Type Check
    runs-on: self-hosted  # 使用自架 runner
    timeout-minutes: 10
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Run ESLint
        working-directory: frontend
        run: npm run lint

      - name: Run Type Check
        working-directory: frontend
        run: npm run typecheck

  test:
    name: E2E Tests
    runs-on: self-hosted
    needs: lint  # lint 通過才執行
    timeout-minutes: 30
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Install Playwright browsers
        working-directory: frontend
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        working-directory: frontend
        run: npx playwright test --reporter=github
        env:
          CI: true

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: frontend/playwright-report/
          retention-days: 7

  build:
    name: Build Verification
    runs-on: self-hosted
    needs: test
    timeout-minutes: 15
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Build application
        working-directory: frontend
        run: npm run build

      - name: Verify build output
        working-directory: frontend
        run: |
          if [ ! -d ".output" ]; then
            echo "❌ Build output directory not found"
            exit 1
          fi
          echo "✅ Build successful"
```

### 關鍵概念說明

根據 [GitHub Actions Jobs 文檔](https://runs-on.com/github-actions/jobs-and-steps/)：

| 概念 | 說明 |
|------|------|
| `runs-on` | 指定執行環境，`self-hosted` 表示使用自架 runner |
| `needs` | 定義 job 依賴關係，形成執行順序 |
| `timeout-minutes` | 設定 job 最長執行時間（預設 360 分鐘） |
| `concurrency` | 控制同時執行的 workflow 數量 |
| `uses` | 引用現成的 Action（如 `actions/checkout@v4`） |
| `run` | 執行 shell 指令 |

---

## Step 4: 建立 CD Workflow

根據 [Devtron CI/CD 指南](https://devtron.ai/blog/create-ci-cd-pipelines-with-github-actions-for-kubernetes-the-definitive-guide/) 和 [CloudOps Now 2025 Ultimate Guide](https://www.cloudopsnow.in/ci-cd-with-github-actions-kubernetes-the-ultimate-guide-2025/)：

建立 `.github/workflows/cd.yml`：

```yaml
# CD Pipeline - 合併到 main 後自動佈署
name: CD

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
      - 'k8s/**'
      - '.github/workflows/cd.yml'

env:
  REGISTRY: ghcr.io  # GitHub Container Registry
  IMAGE_NAME: ${{ github.repository }}/frontend
  K8S_NAMESPACE: default

jobs:
  build-and-push:
    name: Build & Push Image
    runs-on: self-hosted
    permissions:
      contents: read
      packages: write
    outputs:
      image_tag: ${{ steps.meta.outputs.version }}
      full_image: ${{ steps.meta.outputs.tags }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=raw,value=latest

      - name: Build and push image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    name: Deploy to Kubernetes
    runs-on: self-hosted
    needs: build-and-push
    environment: production  # 可設定 environment protection rules
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up kubectl
        uses: azure/setup-kubectl@v4
        with:
          version: 'v1.28.0'

      - name: Update deployment image
        run: |
          kubectl set image deployment/frontend-deployment \
            frontend=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ needs.build-and-push.outputs.image_tag }} \
            -n ${{ env.K8S_NAMESPACE }}

      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/frontend-deployment \
            -n ${{ env.K8S_NAMESPACE }} \
            --timeout=300s

      - name: Verify deployment
        run: |
          echo "=== Deployment Status ==="
          kubectl get deployment frontend-deployment -n ${{ env.K8S_NAMESPACE }}
          echo ""
          echo "=== Pod Status ==="
          kubectl get pods -n ${{ env.K8S_NAMESPACE }} -l app=frontend
          echo ""
          echo "=== Recent Events ==="
          kubectl get events -n ${{ env.K8S_NAMESPACE }} --sort-by='.lastTimestamp' | tail -10

  health-check:
    name: Health Check
    runs-on: self-hosted
    needs: deploy
    steps:
      - name: Wait for service ready
        run: sleep 15

      - name: Check application health
        run: |
          # 取得 service endpoint
          SERVICE_IP=$(kubectl get svc frontend-service -n ${{ env.K8S_NAMESPACE }} -o jsonpath='{.spec.clusterIP}')

          # 健康檢查
          HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://${SERVICE_IP}:80 || echo "000")

          if [[ "$HTTP_STATUS" =~ ^(200|301|302)$ ]]; then
            echo "✅ Health check passed! (HTTP $HTTP_STATUS)"
          else
            echo "❌ Health check failed! (HTTP $HTTP_STATUS)"
            exit 1
          fi

  notify:
    name: Deployment Summary
    runs-on: self-hosted
    needs: [build-and-push, deploy, health-check]
    if: always()
    steps:
      - name: Create summary
        run: |
          echo "## 🚀 Deployment Summary" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "| Item | Value |" >> $GITHUB_STEP_SUMMARY
          echo "|------|-------|" >> $GITHUB_STEP_SUMMARY
          echo "| Image Tag | \`${{ needs.build-and-push.outputs.image_tag }}\` |" >> $GITHUB_STEP_SUMMARY
          echo "| Commit | \`${{ github.sha }}\` |" >> $GITHUB_STEP_SUMMARY
          echo "| Deploy Status | ${{ needs.deploy.result }} |" >> $GITHUB_STEP_SUMMARY
          echo "| Health Check | ${{ needs.health-check.result }} |" >> $GITHUB_STEP_SUMMARY
          echo "| Triggered by | @${{ github.actor }} |" >> $GITHUB_STEP_SUMMARY
```

### Push-based vs Pull-based 部署

根據 [nth-root Kubernetes 部署指南](https://nth-root.nl/en/guides/automate-kubernetes-deployments-with-github-actions)：

| 模式 | 說明 | 適用場景 |
|------|------|----------|
| **Push-based** | CI/CD 直接 push 到 K8s | 簡單、快速、本文採用 |
| **Pull-based (GitOps)** | ArgoCD/Flux 監控 Git 並同步 | 大型團隊、多環境 |

---

## Step 5: 進階設定 - Actions Runner Controller (ARC)

根據 [GitHub ARC 官方文檔](https://docs.github.com/en/actions/tutorials/use-actions-runner-controller/quickstart) 和 [ARC GitHub Repository](https://github.com/actions/actions-runner-controller)：

如果你需要**自動擴展** runners，可使用 Actions Runner Controller：

### 安裝 ARC

```bash
# 安裝 controller
NAMESPACE="arc-systems"
helm install arc \
  --namespace "${NAMESPACE}" \
  --create-namespace \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set-controller

# 建立 GitHub App 認證（比 PAT 更安全）
kubectl create secret generic controller-manager \
  -n "${NAMESPACE}" \
  --from-literal=github_app_id=YOUR_APP_ID \
  --from-literal=github_app_installation_id=YOUR_INSTALLATION_ID \
  --from-file=github_app_private_key=path/to/private-key.pem

# 安裝 runner scale set
INSTALLATION_NAME="arc-runner-set"
helm install "${INSTALLATION_NAME}" \
  --namespace "${NAMESPACE}" \
  --set githubConfigUrl="https://github.com/YOUR_ORG/YOUR_REPO" \
  --set githubConfigSecret="controller-manager" \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set
```

### 在 Workflow 中使用

```yaml
jobs:
  build:
    runs-on: arc-runner-set  # 使用 scale set 名稱
    steps:
      - uses: actions/checkout@v4
      # ...
```

### ARC 優勢

根據 [Medium ARC 教程](https://medium.com/@blackhorseya/deploying-github-actions-runner-controller-on-kubernetes-with-github-app-authentication-1983089d3980)：

- **自動擴展**：根據 workflow 數量動態調整 runner 數量
- **Ephemeral Runners**：每次執行後銷毀，確保環境乾淨
- **成本優化**：沒有 workflow 時不消耗資源
- **高可用**：可部署在多個 K8s 叢集

---

## 安全性最佳實踐

根據 [AWS DevOps Blog](https://aws.amazon.com/blogs/devops/best-practices-working-with-self-hosted-github-action-runners-at-scale-on-aws/) 和 [WarpBuild 指南](https://www.warpbuild.com/blog/self-hosting-github-actions)：

### 1. Runner 安全

```yaml
# ❌ 不要這樣做
runs-on: self-hosted  # 公開 repo 中使用 self-hosted runner

# ✅ 建議做法
runs-on: self-hosted
if: github.repository_owner == 'your-org'  # 確保只在自己的 repo 執行
```

### 2. Secrets 管理

```yaml
# 使用 GitHub Secrets，不要硬編碼
- name: Deploy
  env:
    KUBECONFIG_DATA: ${{ secrets.KUBECONFIG }}
  run: |
    echo "$KUBECONFIG_DATA" | base64 -d > /tmp/kubeconfig
    export KUBECONFIG=/tmp/kubeconfig
    kubectl apply -f k8s/
```

### 3. 最小權限原則

```yaml
permissions:
  contents: read       # 只讀取代碼
  packages: write      # 只推送到 registry
  # 不給予不必要的權限
```

### 4. 環境保護

在 GitHub 設定 Environment Protection Rules：
- 要求審核者批准才能部署到 production
- 設定等待時間（如 5 分鐘）
- 限制可部署的分支

---

## 故障排除

### Runner 無法連接

```bash
# 查看 runner 狀態
sudo systemctl status actions.runner.*

# 查看日誌
journalctl -u actions.runner.* -f

# 重新註冊 runner
./config.sh remove
./config.sh --url ... --token ...
```

### Status Check 沒有出現

根據 [GitHub Community 討論](https://github.com/orgs/community/discussions/167194)：

1. 確保 workflow 已經至少執行過一次
2. 確保 job 名稱與 Branch Protection 設定一致
3. 確保 workflow 的 `on` 觸發條件正確

### 部署失敗回滾

```bash
# 查看部署歷史
kubectl rollout history deployment/frontend-deployment

# 回滾到上一版
kubectl rollout undo deployment/frontend-deployment

# 回滾到特定版本
kubectl rollout undo deployment/frontend-deployment --to-revision=2
```

---

## 2026 年重要變更

### 1. Self-Hosted Runner 收費

根據 [Northflank 報導](https://northflank.com/blog/github-pricing-change-self-hosted-alternatives-github-actions)：

- **2026 年 3 月起**：Self-hosted runners 收取 $0.002/分鐘
- **豁免對象**：公開儲存庫、GitHub Enterprise Server
- **替代方案**：AWS CodeBuild managed runners、Buildkite、CircleCI

### 2. Hosted Runner 降價

- GitHub 將 hosted runner 價格降低最高 39%
- 可能影響 self-hosted vs hosted 的成本計算

### 3. Rulesets 成為主流

根據 [DEV Community 分析](https://dev.to/piyushgaikwaad/branch-protection-rules-vs-rulesets-the-right-way-to-protect-your-git-repos-305m)：

- Branch Protection Rules 逐漸被 Rulesets 取代
- Rulesets 提供更強大的組織級管理能力
- 建議新專案直接使用 Rulesets

---

## 參考資源

### 官方文檔

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Self-hosted Runners](https://docs.github.com/actions/hosting-your-own-runners)
- [Actions Runner Controller](https://docs.github.com/en/actions/tutorials/use-actions-runner-controller/quickstart)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)

### 教程與指南

- [Devtron: CI/CD Pipeline for Kubernetes](https://devtron.ai/blog/create-ci-cd-pipelines-with-github-actions-for-kubernetes-the-definitive-guide/)
- [CloudOps Now: Ultimate Guide 2025](https://www.cloudopsnow.in/ci-cd-with-github-actions-kubernetes-the-ultimate-guide-2025/)
- [Medium: Production-Grade Pipeline](https://medium.com/@arantika129bagewadi/building-a-production-grade-ci-cd-pipeline-for-kubernetes-using-github-actions-780ea13bef75)
- [Medium: Modern CI/CD with ArgoCD](https://medium.com/@nsalexamy/modern-ci-cd-architecture-with-github-actions-argo-cd-and-argo-rollouts-45fd6b09b315)
- [Spacelift: GitHub Actions Kubernetes](https://spacelift.io/blog/github-actions-kubernetes)

### 安全性

- [AWS: Self-hosted Runners Best Practices](https://aws.amazon.com/blogs/devops/best-practices-working-with-self-hosted-github-action-runners-at-scale-on-aws/)
- [GitHub Security Guidelines](https://github.com/dduzgun-security/github-self-hosted-runners)
- [DevZero: Mastering Self-Hosted Runners](https://www.devzero.io/blog/mastering-self-hosted-runners-for-github-actions-setup-benefits-and-best-practices)

### 工具與範例

- [ARC GitHub Repository](https://github.com/actions/actions-runner-controller)
- [Sample K8s CI/CD Repository](https://github.com/narmidm/github-actions-kubernetes)
- [DevOpsCube: Setup Guide](https://devopscube.com/github-actions-self-hosted-runner/)

---

## 總結

實現「PR 合併即自動佈署」需要以下關鍵元件：

1. **Self-Hosted Runner** - 讓 GitHub Actions 能存取你的 K8s
2. **Branch Protection / Rulesets** - 強制 PR 和 CI 通過
3. **CI Workflow** - 自動化測試與建構驗證
4. **CD Workflow** - 自動化部署與健康檢查

這樣的架構讓你的團隊能夠：
- 安全地協作開發
- 自動驗證程式碼品質
- 快速且可靠地部署變更
- 在出問題時快速回滾

就像 Cloudflare Workers 一樣，**推送即部署**，但多了完整的品質保證流程。

---

*本文最後更新於 2026 年 1 月。如有任何問題或建議，歡迎在 GitHub Issues 中反饋。*
