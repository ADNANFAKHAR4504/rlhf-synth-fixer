# CI/CD Pipeline Configuration - Multi-Platform Implementation

## Objective
Implement a production-grade, multi-platform CI/CD pipeline configuration in `lib/ci-cd.yml` following industry best practices and security standards.

## Platform Support
Your implementation can target any of the following CI/CD platforms:
- **GitHub Actions** (GitHub Workflows)
- **GitLab CI/CD**
- **CircleCI**
- **Google Cloud Build**
- **ArgoCD** (GitOps)
- **Azure DevOps Pipelines**
- **Jenkins** (Declarative Pipeline)

## Requirements

### 1. Platform Detection
The pipeline must use platform-specific syntax correctly:

**GitHub Actions:**
```yaml
name: Pipeline Name
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
```

**GitLab CI:**
```yaml
image: alpine:latest

stages:
  - build
  - test
  - deploy

build-job:
  stage: build
  script:
    - echo "Building"
```

**CircleCI:**
```yaml
version: 2.1
workflows:
  build-deploy:
    jobs:
      - build
```

### 2. Script Organization (CRITICAL)
**MUST FOLLOW:** All script blocks with more than 5 lines MUST be moved to external `scripts/` directory.

**BAD - Will Fail:**
```yaml
- name: Deploy Application
  run: |
    echo "Line 1"
    echo "Line 2"
    echo "Line 3"
    echo "Line 4"
    echo "Line 5"
    echo "Line 6"  # 6+ lines - FAILS
    npm install
    npm run build
```

**GOOD - Will Pass:**
```yaml
- name: Deploy Application
  run: ./scripts/deploy.sh
```

The `scripts/deploy.sh` should contain all the logic. This ensures:
- Maintainability
- Reusability
- Easier testing
- Version control clarity

### 3. Container Registry Requirements
If your pipeline builds and deploys containers, you MUST use a **private container registry**.

**Acceptable Private Registries:**
- AWS Elastic Container Registry (ECR)
- Google Container Registry (GCR) / Artifact Registry
- Azure Container Registry (ACR)
- GitLab Container Registry
- Private Harbor registry
- GitHub Container Registry (GHCR)

**GitLab CI Example:**
```yaml
build-container:
  image: docker:latest
  script:
    - docker build -t $CI_REGISTRY/myapp:latest .
    - docker push $CI_REGISTRY/myapp:latest
```

**GitHub Actions Example:**
```yaml
- name: Build and push
  env:
    ECR_REGISTRY: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com
  run: |
    docker build -t $ECR_REGISTRY/myapp:latest .
    docker push $ECR_REGISTRY/myapp:latest
```

**NOT Acceptable:**
```yaml
image: nginx:latest  # Public DockerHub - FAILS
```

### 4. Secrets and Environment Variables
Secrets MUST use platform-specific syntax and NEVER be hardcoded.

**GitHub Actions:**
```yaml
env:
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
  DATABASE_URL: ${{ vars.DATABASE_URL }}
```

**GitLab CI:**
```yaml
variables:
  AWS_REGION: "us-east-1"

deploy:
  script:
    - aws s3 cp file s3://bucket --region $AWS_REGION
  environment:
    name: production
    url: https://example.com
```

**CircleCI:**
```yaml
jobs:
  deploy:
    environment:
      AWS_REGION: ${AWS_REGION}
      DATABASE_URL: ${DATABASE_URL}
```

**Google Cloud Build:**
```yaml
steps:
  - name: 'gcr.io/cloud-builders/gcloud'
    env:
      - 'PROJECT_ID=$PROJECT_ID'
    secretEnv: ['DB_PASSWORD']
availableSecrets:
  secretManager:
    - versionName: projects/$PROJECT_ID/secrets/db-password/versions/latest
      env: 'DB_PASSWORD'
```

### 5. Hardcoded Secrets Detection (CRITICAL - AUTO-FAIL)
Your pipeline MUST NOT contain hardcoded secrets. The following will cause automatic failure:

**Forbidden:**
- AWS Access Keys: `AKIA...`
- Hardcoded passwords: `password: "mypassword123"`
- API keys: `api_key: "sk_live_abc123..."`
- Database credentials in connection strings
- Private SSH/TLS keys

**Example of What Will Fail:**
```yaml
env:
  AWS_ACCESS_KEY_ID: AKIAIOSFODNN7EXAMPLE  # CRITICAL FAIL
  DB_PASSWORD: "MySecretPassword123"        # CRITICAL FAIL
```

### 6. Container Image Scanning
If you build container images, you MUST include container vulnerability scanning.

**Accepted Scanning Tools:**
- Trivy
- Grype
- Snyk
- Anchore
- Aqua Security
- Prisma Cloud

**GitHub Actions Example:**
```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'myregistry.azurecr.io/myapp:${{ github.sha }}'
    format: 'sarif'
    output: 'trivy-results.sarif'
```

**GitLab CI Example:**
```yaml
container-scan:
  image: aquasec/trivy:latest
  script:
    - trivy image --exit-code 1 --severity HIGH,CRITICAL $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
```

### 7. Environment Declaration
Your pipeline should declare environments for deployment protection.

**GitHub Actions:**
```yaml
jobs:
  deploy-prod:
    environment: production
    runs-on: ubuntu-latest
```

**GitLab CI:**
```yaml
deploy-production:
  stage: deploy
  environment:
    name: production
    url: https://prod.example.com
```

**Azure DevOps:**
```yaml
- deployment: DeployWeb
  environment: production
```

### 8. Kubernetes Deployment (if applicable)
If deploying to Kubernetes, ensure:
- Namespace is specified
- Manifest files are organized in `k8s/` or `manifests/` directory
- Security contexts are considered

**Example:**
```yaml
- name: Deploy to Kubernetes
  run: |
    kubectl apply -f k8s/deployment.yml --namespace=production
    kubectl rollout status deployment/myapp -n production
```

### 9. Multi-Environment Pipeline Pattern
Recommended structure for production pipelines:

```yaml
stages/jobs:
  1. Build
  2. Test
  3. Deploy to Dev
  4. Manual Approval (optional)
  5. Deploy to Staging
  6. Manual Approval (required)
  7. Deploy to Production
```

### 10. Job Dependencies and Artifacts
Ensure proper job orchestration:

**GitHub Actions:**
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
```

**GitLab CI:**
```yaml
build:
  artifacts:
    paths:
      - dist/

deploy:
  dependencies:
    - build
```

## Validation Criteria

Your pipeline will be validated against:

1. **Platform Detection** - Correct syntax for detected platform
2. **Script Length** - No inline scripts >5 lines
3. **Private Registry** - Container images from private registries only
4. **Secret Management** - No hardcoded secrets, proper syntax
5. **Container Scanning** - Required if containers are built
6. **Environment Declaration** - Environments defined for deployments
7. **Best Practices** - Caching, artifacts, notifications
8. **Kubernetes** - Proper namespace and manifest organization (if applicable)

## Deliverables

1. `lib/ci-cd.yml` - Your pipeline configuration
2. `scripts/` directory - External scripts (if needed)
3. Environment-specific configurations properly parameterized
4. No hardcoded secrets or sensitive data

## Example Scenarios

### Scenario 1: GitHub Actions with AWS CDK
```yaml
name: CDK Deployment Pipeline

on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: cdk-out
          path: cdk.out/

  deploy-dev:
    needs: build
    runs-on: ubuntu-latest
    environment: dev
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
      - run: ./scripts/deploy-cdk.sh dev
    env:
      AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
      AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

### Scenario 2: GitLab CI with Container Deployment
```yaml
image: docker:latest

variables:
  CONTAINER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

stages:
  - build
  - scan
  - deploy

build-container:
  stage: build
  script:
    - ./scripts/build-container.sh

scan-container:
  stage: scan
  image: aquasec/trivy:latest
  script:
    - trivy image --exit-code 1 $CONTAINER_IMAGE

deploy-dev:
  stage: deploy
  environment:
    name: development
  script:
    - ./scripts/deploy-k8s.sh dev
```

## Tips for Success

1. Start with platform detection - ensure your syntax is correct
2. Keep scripts external - move complex logic to `scripts/`
3. Use environment variables for all configuration
4. Never commit secrets - always use secret management
5. Add container scanning if you build images
6. Declare environments for better deployment control
7. Follow the reference implementation in `.github/workflows/ci-cd.yml`

## Anti-Patterns to Avoid

- Long inline scripts (>5 lines)
- Hardcoded credentials
- Public DockerHub images for deployment
- Missing container scanning when building images
- No environment declarations
- Poor job dependency management
- Missing artifact handling between jobs
