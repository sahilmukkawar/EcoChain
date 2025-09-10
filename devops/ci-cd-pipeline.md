# EcoChain CI/CD Pipeline

## Overview

This document outlines the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the EcoChain platform. The pipeline is designed to ensure code quality, automated testing, and seamless deployment across all microservices and applications.

## Pipeline Architecture

### Tools and Technologies

- **Source Control**: GitHub
- **CI/CD Platform**: GitHub Actions
- **Infrastructure as Code**: Terraform
- **Container Orchestration**: Kubernetes
- **Container Registry**: Docker Hub / GitHub Container Registry
- **Secrets Management**: GitHub Secrets / HashiCorp Vault
- **Monitoring**: Prometheus + Grafana

### Pipeline Stages

1. **Code Commit & Pull Request**
2. **Code Quality & Linting**
3. **Unit Testing**
4. **Integration Testing**
5. **Build & Package**
6. **Security Scanning**
7. **Deployment to Staging**
8. **Acceptance Testing**
9. **Deployment to Production**
10. **Post-Deployment Verification**

## Workflow Definitions

### Microservice Workflow

Each microservice repository contains its own workflow file (`.github/workflows/ci-cd.yml`) with the following structure:

```yaml
name: EcoChain Microservice CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint code
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test
        
      - name: Run integration tests
        run: npm run test:integration
        
  build-and-push:
    needs: lint-and-test
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to DockerHub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ecochain/service-name
          tags: |
            type=ref,event=branch
            type=sha,format=short
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=registry,ref=ecochain/service-name:buildcache
          cache-to: type=registry,ref=ecochain/service-name:buildcache,mode=max
          
  deploy-staging:
    needs: build-and-push
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Terraform
        uses: hashicorp/setup-terraform@v2
        
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-south-1
      
      - name: Deploy to Staging
        run: |
          cd terraform/environments/staging
          terraform init
          terraform apply -auto-approve -var="image_tag=${{ github.sha }}"
      
      - name: Run Acceptance Tests
        run: npm run test:acceptance -- --env=staging
        
  deploy-production:
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Terraform
        uses: hashicorp/setup-terraform@v2
        
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-south-1
      
      - name: Deploy to Production
        run: |
          cd terraform/environments/production
          terraform init
          terraform apply -auto-approve -var="image_tag=${{ github.sha }}"
      
      - name: Verify Deployment
        run: |
          curl -s https://api.ecochain.com/health | grep -q "status":"ok"
```

### AI Service Workflow

For Python-based AI microservices, a specialized workflow is used:

```yaml
name: EcoChain AI Service CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
          cache: 'pip'
      
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install -r requirements-dev.txt
      
      - name: Lint code
        run: |
          flake8 .
          black --check .
          isort --check .
      
      - name: Run unit tests
        run: pytest tests/unit
        
      - name: Run integration tests
        run: pytest tests/integration
        
  build-and-push:
    needs: lint-and-test
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to DockerHub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ecochain/ai-service-name
          tags: |
            type=ref,event=branch
            type=sha,format=short
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=registry,ref=ecochain/ai-service-name:buildcache
          cache-to: type=registry,ref=ecochain/ai-service-name:buildcache,mode=max
          
  # Deployment jobs similar to microservice workflow
```

### Mobile App Workflow

For React Native mobile applications:

```yaml
name: EcoChain Mobile App CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint code
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test
        
  build-android:
    needs: lint-and-test
    if: github.ref == 'refs/heads/develop' || github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Set up JDK
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '17'
      
      - name: Setup Android SDK
        uses: android-actions/setup-android@v2
      
      - name: Build Android App
        run: |
          cd android
          ./gradlew assembleRelease
      
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-release
          path: android/app/build/outputs/apk/release/app-release.apk
      
      - name: Deploy to Firebase App Distribution
        if: github.ref == 'refs/heads/develop'
        uses: wzieba/Firebase-Distribution-Github-Action@v1
        with:
          appId: ${{ secrets.FIREBASE_APP_ID_ANDROID }}
          serviceCredentialsFileContent: ${{ secrets.FIREBASE_SERVICE_CREDENTIALS }}
          groups: testers
          file: android/app/build/outputs/apk/release/app-release.apk
          releaseNotes: |
            Build from ${{ github.repository }}@${{ github.sha }}
            Commit message: ${{ github.event.head_commit.message }}
      
      - name: Deploy to Google Play Store
        if: github.ref == 'refs/heads/main'
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON }}
          packageName: com.ecochain.app
          releaseFiles: android/app/build/outputs/bundle/release/app-release.aab
          track: production
          status: completed
          
  build-ios:
    needs: lint-and-test
    if: github.ref == 'refs/heads/develop' || github.ref == 'refs/heads/main'
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install CocoaPods
        run: |
          cd ios
          pod install
      
      - name: Build iOS App
        run: |
          cd ios
          xcodebuild -workspace EcoChain.xcworkspace -scheme EcoChain -configuration Release -archivePath EcoChain.xcarchive archive
          xcodebuild -exportArchive -archivePath EcoChain.xcarchive -exportOptionsPlist ExportOptions.plist -exportPath ./build
      
      - name: Upload IPA
        uses: actions/upload-artifact@v3
        with:
          name: app-release-ios
          path: ios/build/EcoChain.ipa
      
      # Deploy to TestFlight or App Store similar to Android deployment
```

## Infrastructure as Code

### Terraform Structure

The infrastructure is defined using Terraform with the following structure:

```
terraform/
├── modules/
│   ├── eks/
│   ├── rds/
│   ├── elasticache/
│   ├── s3/
│   └── cloudfront/
├── environments/
│   ├── staging/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── production/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── global/
    ├── iam/
    └── route53/
```

Example `main.tf` for a staging environment:

```hcl
provider "aws" {
  region = "ap-south-1"
}

module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "~> 3.0"
  
  name = "ecochain-staging-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  
  enable_nat_gateway = true
  single_nat_gateway = true
  
  tags = {
    Environment = "staging"
    Project     = "EcoChain"
  }
}

module "eks" {
  source = "../../modules/eks"
  
  cluster_name    = "ecochain-staging"
  cluster_version = "1.27"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets
  
  node_groups = {
    general = {
      desired_capacity = 2
      max_capacity     = 5
      min_capacity     = 1
      instance_types   = ["t3.medium"]
    },
    ai_services = {
      desired_capacity = 1
      max_capacity     = 3
      min_capacity     = 1
      instance_types   = ["g4dn.xlarge"]
      taints = [
        {
          key    = "workload"
          value  = "ai"
          effect = "NO_SCHEDULE"
        }
      ]
    }
  }
}

module "mongodb_atlas" {
  source = "mongodb/mongodbatlas/mongodbatlas"
  
  project_id        = var.mongodb_atlas_project_id
  cluster_name      = "ecochain-staging"
  mongodb_version   = "6.0"
  provider_name     = "AWS"
  provider_region   = "ap-south-1"
  provider_instance_size_name = "M10"
  
  # Configure VPC peering with AWS VPC
  vpc_peering {
    aws_account_id = data.aws_caller_identity.current.account_id
    vpc_id         = module.vpc.vpc_id
    route_table_cidr_block = module.vpc.vpc_cidr_block
  }
}

module "redis" {
  source = "../../modules/elasticache"
  
  cluster_name = "ecochain-staging-redis"
  vpc_id       = module.vpc.vpc_id
  subnet_ids   = module.vpc.private_subnets
  node_type    = "cache.t3.small"
}

module "s3_storage" {
  source = "../../modules/s3"
  
  bucket_name = "ecochain-staging-storage"
  environment = "staging"
}
```

## Kubernetes Deployment

### Helm Charts

Each microservice has a Helm chart for Kubernetes deployment:

```
helm/
├── charts/
│   ├── auth-service/
│   ├── user-service/
│   ├── collection-service/
│   ├── vision-service/
│   └── ...
└── values/
    ├── staging/
    │   ├── auth-service.yaml
    │   ├── user-service.yaml
    │   └── ...
    └── production/
        ├── auth-service.yaml
        ├── user-service.yaml
        └── ...
```

Example Helm chart for a microservice:

```yaml
# helm/charts/auth-service/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "auth-service.fullname" . }}
  labels:
    {{- include "auth-service.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "auth-service.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "auth-service.selectorLabels" . | nindent 8 }}
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "{{ .Values.service.metricsPort }}"
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .Values.service.port }}
              protocol: TCP
            - name: metrics
              containerPort: {{ .Values.service.metricsPort }}
              protocol: TCP
          livenessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          env:
            - name: NODE_ENV
              value: {{ .Values.environment }}
            - name: PORT
              value: "{{ .Values.service.port }}"
            - name: MONGODB_URI
              valueFrom:
                secretKeyRef:
                  name: {{ include "auth-service.fullname" . }}-mongodb
                  key: uri
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: {{ include "auth-service.fullname" . }}-jwt
                  key: secret
            - name: REDIS_HOST
              value: {{ .Values.redis.host }}
            - name: REDIS_PORT
              value: "{{ .Values.redis.port }}"
```

Example values file for staging:

```yaml
# helm/values/staging/auth-service.yaml
replicaCount: 2

image:
  repository: ecochain/auth-service
  pullPolicy: Always
  tag: "latest"

service:
  type: ClusterIP
  port: 3000
  metricsPort: 9090

environment: staging

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi

redis:
  host: ecochain-staging-redis.internal
  port: 6379
```

## Monitoring and Observability

### Prometheus Configuration

Prometheus is configured to scrape metrics from all services:

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
      - action: labelmap
        regex: __meta_kubernetes_pod_label_(.+)
      - source_labels: [__meta_kubernetes_namespace]
        action: replace
        target_label: kubernetes_namespace
      - source_labels: [__meta_kubernetes_pod_name]
        action: replace
        target_label: kubernetes_pod_name
```

### Grafana Dashboards

Grafana dashboards are provided for monitoring:

1. **System Overview Dashboard**: CPU, memory, network usage across all services
2. **Microservice Dashboard**: Request rates, error rates, latencies per service
3. **MongoDB Dashboard**: Query performance, connection stats, operation counts
4. **AI Services Dashboard**: Inference times, batch sizes, GPU utilization
5. **Business Metrics Dashboard**: Collections, orders, user registrations

## Security Practices

### Secrets Management

Secrets are managed using GitHub Secrets for CI/CD and HashiCorp Vault for runtime:

```yaml
# Example Kubernetes configuration for Vault integration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  template:
    metadata:
      annotations:
        vault.hashicorp.com/agent-inject: 'true'
        vault.hashicorp.com/agent-inject-secret-database: 'database/creds/auth-service'
        vault.hashicorp.com/role: 'auth-service'
    spec:
      serviceAccountName: auth-service
      containers:
        - name: auth-service
          # ...
```

### Container Security Scanning

Container images are scanned for vulnerabilities:

```yaml
# GitHub Actions workflow step for security scanning
- name: Scan Docker image
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'ecochain/auth-service:${{ github.sha }}'
    format: 'table'
    exit-code: '1'
    ignore-unfixed: true
    vuln-type: 'os,library'
    severity: 'CRITICAL,HIGH'
```

## Deployment Strategies

### Blue-Green Deployment

For critical services, blue-green deployment is used:

```yaml
# Kubernetes manifest for blue-green deployment
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: auth-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth-service
        image: ecochain/auth-service:v1
        ports:
        - containerPort: 3000
  strategy:
    blueGreen:
      activeService: auth-service-active
      previewService: auth-service-preview
      autoPromotionEnabled: false
```

### Canary Deployment

For less critical services, canary deployment is used:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: marketplace-service
spec:
  replicas: 5
  selector:
    matchLabels:
      app: marketplace-service
  template:
    metadata:
      labels:
        app: marketplace-service
    spec:
      containers:
      - name: marketplace-service
        image: ecochain/marketplace-service:v1
        ports:
        - containerPort: 3000
  strategy:
    canary:
      steps:
      - setWeight: 20
      - pause: {duration: 10m}
      - setWeight: 40
      - pause: {duration: 10m}
      - setWeight: 60
      - pause: {duration: 10m}
      - setWeight: 80
      - pause: {duration: 10m}
```

## Disaster Recovery

### Backup Strategy

- **MongoDB Atlas**: Daily automated backups with 7-day retention
- **S3 Buckets**: Versioning enabled with lifecycle policies
- **Configuration**: All infrastructure and application configs in Git

### Recovery Procedures

1. **Database Restore**: Automated procedure using MongoDB Atlas API
2. **Infrastructure Rebuild**: Complete rebuild from Terraform code
3. **Application Redeployment**: Automated from CI/CD pipeline

## Acceptance Criteria

### CI Pipeline

- All tests pass on every PR
- Code quality checks pass (linting, formatting)
- Security scans show no critical vulnerabilities
- Build artifacts are properly versioned and stored

### CD Pipeline

- Staging deployment completes within 15 minutes
- Production deployment completes within 30 minutes
- Zero downtime during deployments
- Automatic rollback on failed health checks
- Proper secrets rotation and management

### Monitoring

- All services expose Prometheus metrics
- Alerts configured for critical service disruptions
- Logs centrally collected and searchable
- Dashboards show key business and technical metrics

## Implementation Plan

### Sprint 1: Basic CI/CD Setup

- Set up GitHub Actions workflows for all repositories
- Implement basic linting and testing
- Create Docker build and push process

### Sprint 2: Infrastructure as Code

- Develop Terraform modules for all infrastructure components
- Set up staging environment
- Implement MongoDB Atlas integration

### Sprint 3: Kubernetes Deployment

- Create Helm charts for all microservices
- Implement service mesh for inter-service communication
- Set up blue-green deployment for critical services

### Sprint 4: Monitoring and Observability

- Deploy Prometheus and Grafana
- Create dashboards for all services
- Implement logging pipeline

### Sprint 5: Security and Compliance

- Implement secrets management with Vault
- Set up container security scanning
- Create disaster recovery procedures