# Kubernetes Deployment

This directory contains all Kubernetes manifests for deploying the WiSDON platform.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Kubernetes Cluster                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┐     ┌─────────────┐     ┌──────────┐              │
│  │  Nginx  │────▶│  Frontend   │     │  Backend │              │
│  │ :80/443 │     │  (Nuxt 3)   │     │  (Flask) │              │
│  └────┬────┘     │   :3000     │     │   :8000  │              │
│       │          └─────────────┘     └────┬─────┘              │
│       │                                    │                     │
│       └────────────────────────────────────┘                     │
│                          │                                       │
│  ┌───────────┬───────────┼───────────┬───────────┐             │
│  │           │           │           │           │              │
│  ▼           ▼           ▼           ▼           ▼              │
│ MySQL    MongoDB      Redis     InfluxDB    MinIO              │
│ :3306     :27017      :6379      :8086    :9000/9001           │
│                                                                  │
│  ┌─────────┐                                                    │
│  │ Grafana │ ─── Monitoring Dashboard                           │
│  │  :3000  │                                                    │
│  └─────────┘                                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. Kubernetes cluster (minikube, k3s, or managed K8s)
2. kubectl configured
3. Container images built locally:
   ```bash
   # Build frontend image
   cd frontend
   buildah bud -t localhost/wisdon-frontend:latest .

   # Build backend image
   cd backend
   buildah bud -t localhost/wisdon-backend:latest .
   ```

## Deployment

### 1. Create Secrets

Copy the secrets template and fill in your values:

```bash
cp k8s/secrets.yaml.example k8s/secrets.yaml
# Edit secrets.yaml with your actual values
kubectl apply -f k8s/secrets.yaml
```

### 2. Deploy All Services

Using kustomize:

```bash
kubectl apply -k k8s/
```

Or deploy individual components:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/nginx-config.yaml
kubectl apply -f k8s/mysql.yaml
kubectl apply -f k8s/mongodb.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/influxdb.yaml
kubectl apply -f k8s/minio.yaml
kubectl apply -f k8s/grafana.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/nginx.yaml
```

### 3. Frontend Only

For frontend-only deployment:

```bash
kubectl apply -k k8s/frontend/
```

## File Structure

```
k8s/
├── kustomization.yaml    # Main kustomize config
├── namespace.yaml        # wisdon-frontend namespace
├── configmap.yaml        # Frontend environment config
├── nginx-config.yaml     # Nginx reverse proxy config
├── secrets.yaml.example  # Secrets template (DO NOT commit actual secrets!)
│
├── # Core Application
├── deployment.yaml       # Frontend deployment
├── service.yaml          # Frontend service (NodePort 30080)
├── backend.yaml          # Backend deployment + service
│
├── # Databases
├── mysql.yaml            # MySQL deployment + service
├── mongodb.yaml          # MongoDB deployment + service + HPA
├── redis.yaml            # Redis deployment + service
├── influxdb.yaml         # InfluxDB deployment + service
│
├── # Object Storage & Monitoring
├── minio.yaml            # MinIO deployment + service
├── grafana.yaml          # Grafana deployment + service
│
├── # Reverse Proxy
├── nginx.yaml            # Nginx deployment + service
│
└── frontend/             # Frontend-only deployment configs
    ├── kustomization.yaml
    ├── namespace.yaml
    ├── configmap.yaml
    ├── deployment.yaml
    └── service.yaml
```

## Services

| Service   | Internal Port | NodePort | Description |
|-----------|--------------|----------|-------------|
| Frontend  | 3000         | 30080    | Nuxt 3 frontend |
| Backend   | 8000         | -        | Flask API |
| MySQL     | 3306         | -        | Primary database |
| MongoDB   | 27017        | -        | Document store (with HPA) |
| Redis     | 6379         | -        | Cache/session store |
| InfluxDB  | 8086         | -        | Time series database |
| MinIO     | 9000/9001    | -        | Object storage |
| Grafana   | 3000         | -        | Monitoring dashboard |
| Nginx     | 80/443       | 80/443   | Reverse proxy |

## Horizontal Pod Autoscaler (HPA)

MongoDB is configured with HPA for automatic scaling:

- Min replicas: 1
- Max replicas: 3
- Scale up when CPU > 70% or Memory > 80%
- Scale down stabilization: 5 minutes

Check HPA status:
```bash
kubectl get hpa -n wisdon-frontend
```

## Data Persistence

All stateful services use hostPath volumes mounted to `/data/wisdon/`:

| Service   | Host Path |
|-----------|-----------|
| MySQL     | /data/wisdon/mysql |
| MongoDB   | /data/wisdon/mongodb |
| Redis     | /data/wisdon/redis |
| InfluxDB  | /data/wisdon/influxdb |
| MinIO     | /data/wisdon/minio |
| Grafana   | /data/wisdon/grafana |

Create directories on the host:
```bash
sudo mkdir -p /data/wisdon/{mysql,mongodb,redis,influxdb,minio,grafana}
sudo chmod 777 /data/wisdon/*
```

## Monitoring

View pod status:
```bash
kubectl get pods -n wisdon-frontend -w
```

View logs:
```bash
kubectl logs -f deployment/frontend -n wisdon-frontend
kubectl logs -f deployment/backend -n wisdon-frontend
```

## Troubleshooting

1. **Pod stuck in Pending**: Check resource availability
   ```bash
   kubectl describe pod <pod-name> -n wisdon-frontend
   ```

2. **ImagePullBackOff**: Ensure images are built locally
   ```bash
   buildah images | grep wisdon
   ```

3. **CrashLoopBackOff**: Check container logs
   ```bash
   kubectl logs <pod-name> -n wisdon-frontend --previous
   ```

4. **Connection refused**: Check service endpoints
   ```bash
   kubectl get endpoints -n wisdon-frontend
   ```
