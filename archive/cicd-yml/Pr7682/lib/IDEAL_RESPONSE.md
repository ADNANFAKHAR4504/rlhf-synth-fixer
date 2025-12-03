# Ideal Response - Node.js CI/CD Pipeline

This file contains the corrected and final version of the CI/CD Pipeline
implementation for a Node.js application using GitHub Actions and AWS services.

## Complete Pipeline Configuration

```yaml
# CI/CD Pipeline for Node.js Application
# Build and deployment workflow using AWS services
---
name: Node.js CI/CD Pipeline

"on":
  workflow_dispatch:
    inputs:
      environment_suffix:
        description: 'Environment suffix for resource naming'
        required: true
        default: 'dev'
  push:
    branches:
      - main
    paths:
      - 'src/**'
      - 'package.json'
      - '.github/workflows/**'

env:
  AWS_REGION: us-east-1
  ENVIRONMENT_SUFFIX: ${{ github.event.inputs.environment_suffix || 'dev' }}

permissions:
  id-token: write
  contents: read

jobs:
  source-validation:
    name: Source Validation
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.version.outputs.version }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Generate version
        id: version
        run: |
          VERSION=$(date +%Y%m%d%H%M%S)-${GITHUB_SHA::8}
          echo "version=$VERSION" >> "$GITHUB_OUTPUT"

      - name: Validate package.json
        run: |
          [ -f package.json ] && echo "package.json found" || exit 1
          node -e "JSON.parse(require('fs').readFileSync('package.json'))"

      - name: Check for secrets in code
        run: |
          SECRETS_PATTERN="(password|secret|api_key|access_key)"
          SECRETS_PATTERN="${SECRETS_PATTERN}\s*=\s*['\"][^'\"]+['\"]"
          ! grep -rE "$SECRETS_PATTERN" \
            --include="*.js" --include="*.ts" --include="*.json" \
            src/ 2>/dev/null

  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: source-validation
    outputs:
      artifact_path: ${{ steps.build.outputs.artifact_path }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        id: build
        run: |
          npm run build
          echo "artifact_path=dist" >> "$GITHUB_OUTPUT"

      - name: Configure AWS credentials via OIDC
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_OIDC_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
          role-session-name: Build-${{ env.ENVIRONMENT_SUFFIX }}

      - name: Upload artifacts to S3
        env:
          VERSION: ${{ needs.source-validation.outputs.version }}
        run: |
          BUCKET="nodeapp-artifacts-${ENVIRONMENT_SUFFIX}"
          aws s3 cp dist/ "s3://${BUCKET}/${VERSION}/" --recursive

  deploy:
    name: Deploy Application
    runs-on: ubuntu-latest
    needs: [source-validation, build]
    environment: production
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials via OIDC
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_OIDC_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
          role-session-name: Deploy-${{ env.ENVIRONMENT_SUFFIX }}

      - name: Download artifacts from S3
        env:
          VERSION: ${{ needs.source-validation.outputs.version }}
        run: |
          mkdir -p deploy
          BUCKET="nodeapp-artifacts-${ENVIRONMENT_SUFFIX}"
          aws s3 cp "s3://${BUCKET}/${VERSION}/" deploy/ --recursive

      - name: Verify deployment artifacts
        run: |
          [ -d deploy ] && echo "Artifacts downloaded" || exit 1
          ls -la deploy/

      - name: Deploy to S3 bucket
        run: |
          BUCKET="nodeapp-deploy-${ENVIRONMENT_SUFFIX}"
          aws s3 sync deploy/ "s3://${BUCKET}/" --delete

      - name: Verify deployment
        run: |
          BUCKET="nodeapp-deploy-${ENVIRONMENT_SUFFIX}"
          aws s3 ls "s3://${BUCKET}/" && echo "Deployment verified"

      - name: Send notification
        if: always()
        env:
          VERSION: ${{ needs.source-validation.outputs.version }}
        run: |
          echo "Deployment status: ${{ job.status }}"
          echo "Version: ${VERSION}"
```

## Key Features Implemented

### 1. GitHub OIDC Integration
- All AWS authentication uses OIDC via `role-to-assume`
- No hardcoded AWS access keys or secret keys
- Secure, short-lived credentials for all stages
- Proper session naming for audit trails (Build-{env}, Deploy-{env})

### 2. Three-Stage Pipeline
- **Source Validation**: Validates code, generates version, checks for secrets
- **Build**: Installs dependencies, runs tests, builds application
- **Deploy**: Downloads artifacts and deploys to S3

### 3. Security Best Practices
- **OIDC Authentication**: No long-lived credentials stored
- **Secrets Scanning**: Checks for hardcoded credentials in code
- **Minimal Permissions**: `id-token: write` and `contents: read` only
- **Environment Protection**: Production environment requires approval

### 4. Node.js Build Workflow
- Uses Node.js 18 with npm caching for fast builds
- Standard workflow: `npm ci` -> `npm test` -> `npm run build`
- Generates versioned artifacts with timestamp and commit SHA

### 5. Artifact Management
- Artifacts stored in S3 with environment suffix
- Versioned paths using timestamp and commit SHA
- Separate artifact and deployment buckets

### 6. Environment Suffix Pattern
- All resource names include `${ENVIRONMENT_SUFFIX}` for uniqueness
- Supports parallel deployments to different environments
- Configurable via workflow dispatch or defaults to 'dev'

### 7. YAML Best Practices
- Quoted "on" key for yamllint compatibility
- All lines under 80 characters
- Inline scripts kept to 5 lines or fewer
- Environment variables used for repeated values

## Architecture Flow

```
+-------------------+    +-------------------+    +-------------------+
| Source Validation |--->| Build Application |--->| Deploy Application|
|                   |    |                   |    |                   |
| - Checkout code   |    | - Setup Node.js   |    | - Download from S3|
| - Generate version|    | - Install deps    |    | - Verify artifacts|
| - Validate files  |    | - Run tests       |    | - Deploy to S3    |
| - Scan secrets    |    | - Build app       |    | - Verify deploy   |
|                   |    | - Upload to S3    |    | - Send notification|
+-------------------+    +-------------------+    +-------------------+
```

## Compliance with PROMPT.md Requirements

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| GitHub Actions YAML | Done | ci-cd.yml workflow file |
| Source validation stage | Done | Validates code, generates version |
| Build stage | Done | Node.js 18, npm ci/test/build |
| Deploy stage | Done | S3 sync with verification |
| OIDC authentication | Done | aws-actions/configure-aws-credentials@v4 |
| Minimal permissions | Done | id-token: write, contents: read |
| Secrets scanning | Done | grep-based pattern detection |
| Environment suffix | Done | All S3 paths include suffix |
| Environment protection | Done | production environment on deploy |
| Version generation | Done | Timestamp + commit SHA |
| Deployment notification | Done | Status and version output |
| YAML best practices | Done | Passes yamllint validation |

## AWS Services Used

- **S3**: Artifact storage and deployment target
- **IAM**: OIDC role for GitHub Actions authentication

## Usage

### Manual Trigger
```bash
gh workflow run "Node.js CI/CD Pipeline" -f environment_suffix=dev
```

### Automatic Trigger
Push changes to `main` branch in `src/`, `package.json`, or `.github/workflows/`

## Prerequisites

1. **AWS OIDC Provider**: Configure GitHub as OIDC provider in AWS IAM
2. **IAM Role**: Create role with trust policy for GitHub OIDC
3. **S3 Buckets**: Create artifact and deployment buckets per environment
4. **GitHub Secret**: Store role ARN as `AWS_OIDC_ROLE_ARN`

## Outputs

The pipeline provides:
- Versioned artifacts in `s3://nodeapp-artifacts-{env}/{version}/`
- Deployed application in `s3://nodeapp-deploy-{env}/`
- Deployment notifications with status and version information

All requirements from PROMPT.md have been fully implemented.
