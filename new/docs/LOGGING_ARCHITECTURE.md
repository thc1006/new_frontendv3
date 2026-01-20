# WiSDON Logging 架構規劃

## 現況分析

| 層級 | 現況 | 問題 |
|------|------|------|
| **前端** | 132 個 console.log 呼叫 | 無結構化、無集中收集 |
| **後端** | 基礎 Python logging | 分散、無集中管理 |
| **K8s** | 無集中式日誌 | 難以追蹤跨服務問題 |

## 建議架構

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │     │   Backend   │     │   Nginx     │
│   (Nuxt)    │     │   (Flask)   │     │   Access    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ JSON logs         │ JSON logs         │ Access logs
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────┐
│                    Fluent Bit                       │
│              (DaemonSet on K8s)                     │
└──────────────────────────┬──────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │        Loki            │
              │   (Log Aggregation)    │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │       Grafana          │
              │   (Visualization)      │
              └────────────────────────┘
```

## 實作計畫

### Phase 1: 前端結構化 Logging

**安裝 pino logger：**
```bash
npm install pino pino-pretty
```

**建立 composable：**
```typescript
// composables/useLogger.ts
import pino from 'pino'

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  browser: {
    asObject: true,
    transmit: {
      send: (level, logEvent) => {
        // 發送到後端 /api/logs endpoint
        fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logEvent)
        }).catch(() => {})
      }
    }
  }
})

export const useLogger = () => ({
  info: (msg: string, data?: object) => logger.info(data, msg),
  warn: (msg: string, data?: object) => logger.warn(data, msg),
  error: (msg: string, data?: object) => logger.error(data, msg),
  debug: (msg: string, data?: object) => logger.debug(data, msg)
})
```

**使用範例：**
```vue
<script setup>
const logger = useLogger()

const handleLogin = async () => {
  logger.info('Login attempt', { username: form.username })
  try {
    await login(form)
    logger.info('Login successful', { username: form.username })
  } catch (error) {
    logger.error('Login failed', { username: form.username, error: error.message })
  }
}
</script>
```

### Phase 2: 後端統一 Logging

**更新 config.py：**
```python
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        if record.exc_info:
            log_obj['exception'] = self.formatException(record.exc_info)
        return json.dumps(log_obj)

def setup_logging(app):
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())

    app.logger.handlers = []
    app.logger.addHandler(handler)
    app.logger.setLevel(logging.INFO)

    # 設定所有 logger
    logging.getLogger('werkzeug').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy').setLevel(logging.WARNING)
```

### Phase 3: K8s 集中式日誌 (Loki Stack)

**新增 K8s manifests：**

```yaml
# new/k8s/logging/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: logging
---
# new/k8s/logging/loki.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: loki
  namespace: logging
spec:
  replicas: 1
  selector:
    matchLabels:
      app: loki
  template:
    metadata:
      labels:
        app: loki
    spec:
      containers:
        - name: loki
          image: grafana/loki:2.9.0
          ports:
            - containerPort: 3100
          args:
            - -config.file=/etc/loki/loki.yaml
          volumeMounts:
            - name: config
              mountPath: /etc/loki
            - name: data
              mountPath: /loki
          resources:
            requests:
              memory: "128Mi"
              cpu: "50m"
            limits:
              memory: "256Mi"
              cpu: "200m"
      volumes:
        - name: config
          configMap:
            name: loki-config
        - name: data
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: loki
  namespace: logging
spec:
  ports:
    - port: 3100
  selector:
    app: loki
```

```yaml
# new/k8s/logging/fluent-bit.yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluent-bit
  namespace: logging
spec:
  selector:
    matchLabels:
      app: fluent-bit
  template:
    metadata:
      labels:
        app: fluent-bit
    spec:
      serviceAccountName: fluent-bit
      containers:
        - name: fluent-bit
          image: fluent/fluent-bit:2.2
          volumeMounts:
            - name: varlog
              mountPath: /var/log
            - name: varlibcontainers
              mountPath: /var/lib/containerd/container-logs
              readOnly: true
            - name: config
              mountPath: /fluent-bit/etc/
          resources:
            requests:
              memory: "64Mi"
              cpu: "25m"
            limits:
              memory: "128Mi"
              cpu: "100m"
      volumes:
        - name: varlog
          hostPath:
            path: /var/log
        - name: varlibcontainers
          hostPath:
            path: /var/lib/containerd/container-logs
        - name: config
          configMap:
            name: fluent-bit-config
```

### Phase 4: Grafana Dashboard

在現有 Grafana 中新增 Loki 資料來源：

```yaml
# Grafana datasource 設定
apiVersion: 1
datasources:
  - name: Loki
    type: loki
    access: proxy
    url: http://loki.logging:3100
    isDefault: false
```

## 資源需求估算

| 元件 | CPU | Memory | Storage |
|------|-----|--------|---------|
| Fluent Bit | 25-100m | 64-128Mi | - |
| Loki | 50-200m | 128-256Mi | 1-5Gi |
| **總計** | ~300m | ~384Mi | ~5Gi |

## 實作優先順序

1. **P0 (立即)**: 前端 useLogger composable
2. **P1 (短期)**: 後端 JSON logging
3. **P2 (中期)**: Fluent Bit + Loki 部署
4. **P3 (長期)**: Grafana Dashboard + Alert

## Log 等級規範

| Level | 用途 | 範例 |
|-------|------|------|
| **ERROR** | 系統錯誤、需要處理 | API 500、DB 連線失敗 |
| **WARN** | 潛在問題、但可繼續 | 慢查詢、重試成功 |
| **INFO** | 業務事件 | 用戶登入、訂單建立 |
| **DEBUG** | 開發除錯 | 請求/回應詳情 |

## 敏感資訊處理

**禁止記錄：**
- 密碼、Token
- 完整信用卡號
- 個人身分證字號

**脫敏處理：**
```typescript
// 自動脫敏敏感欄位
const sanitize = (data: object) => {
  const sensitive = ['password', 'token', 'secret', 'credit_card']
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) =>
      sensitive.some(s => k.toLowerCase().includes(s))
        ? [k, '***REDACTED***']
        : [k, v]
    )
  )
}
```
