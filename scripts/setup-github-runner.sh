#!/bin/bash
# GitHub Self-Hosted Runner 安裝腳本
# 這個 runner 會在你的伺服器上執行，讓 GitHub Actions 可以存取本地 K8s

set -e

RUNNER_VERSION="2.331.0"
RUNNER_DIR="/home/usepc/actions-runner"
RUNNER_USER="usepc"

echo "=========================================="
echo "  GitHub Self-Hosted Runner 安裝腳本"
echo "=========================================="
echo ""

# 檢查是否有 runner token
if [ -z "$RUNNER_TOKEN" ]; then
    echo "❌ 請先設定 RUNNER_TOKEN 環境變數"
    echo ""
    echo "取得 Token 的步驟："
    echo "1. 前往 https://github.com/thc1006/new_frontendv3/settings/actions/runners/new"
    echo "2. 複製頁面上顯示的 token"
    echo "3. 執行: export RUNNER_TOKEN=你的token"
    echo "4. 再次執行此腳本"
    exit 1
fi

# 建立目錄
echo "📁 建立 runner 目錄..."
mkdir -p $RUNNER_DIR
cd $RUNNER_DIR

# 下載 runner
echo "📥 下載 GitHub Actions Runner v${RUNNER_VERSION}..."
curl -o actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz -L \
    https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz

# 解壓縮
echo "📦 解壓縮..."
tar xzf actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz

# 設定 runner
echo "⚙️ 設定 runner..."
./config.sh --url https://github.com/thc1006/new_frontendv3 \
    --token $RUNNER_TOKEN \
    --name "k8s-deploy-runner" \
    --labels "self-hosted,linux,x64,k8s,podman" \
    --work "_work" \
    --unattended

# 安裝為 systemd 服務
echo "🔧 安裝為系統服務..."
sudo ./svc.sh install $RUNNER_USER

# 啟動服務
echo "🚀 啟動 runner 服務..."
sudo ./svc.sh start

# 檢查狀態
echo ""
echo "=========================================="
echo "  安裝完成！"
echo "=========================================="
echo ""
sudo ./svc.sh status
echo ""
echo "Runner 已設定完成，可以在 GitHub repo 的 Settings > Actions > Runners 頁面看到"
echo ""
echo "常用指令："
echo "  查看狀態: sudo systemctl status actions.runner.thc1006-new_frontendv3.k8s-deploy-runner"
echo "  查看日誌: journalctl -u actions.runner.thc1006-new_frontendv3.k8s-deploy-runner -f"
echo "  重啟服務: sudo systemctl restart actions.runner.thc1006-new_frontendv3.k8s-deploy-runner"
