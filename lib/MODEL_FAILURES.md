# Model Failures

This file documents common issues, errors, or failures encountered during CI/CD Pipeline YAML implementation.

## Critical Failures (Auto-Fail)

### 1. Hardcoded Secrets
**Issue**: Credentials hardcoded directly in YAML configuration

**Examples of Violations**:
```yaml
env:
  AWS_ACCESS_KEY_ID: AKIAIOSFODNN7EXAMPLE
  AWS_SECRET_ACCESS_KEY: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
  DATABASE_PASSWORD: MySecretPassword123
```

**Impact**: Security breach, credential exposure in version control
**Fix**: Use platform-specific secret management

### 2. Inline Scripts >5 Lines
**Issue**: Complex logic embedded directly in pipeline YAML

**Example of Violation**:
```yaml
- name: Deploy Application
  run: |
    echo "Starting deployment"
    aws ecr get-login-password --region us-east-1 | docker login ...
    docker build -t myapp:latest .
    docker tag myapp:latest $ECR_REGISTRY/myapp:latest
    docker push $ECR_REGISTRY/myapp:latest
    kubectl apply -f k8s/deployment.yml
    kubectl rollout status deployment/myapp
```

**Impact**: Unmaintainable, untestable, hard to debug
**Fix**: Move to `scripts/deploy.sh`

### 3. Public DockerHub Images for Deployment
**Issue**: Using public container registry instead of private registry

**Example of Violation**:
```yaml
- name: Build and Deploy
  run: |
    docker build -t myusername/myapp:latest .
    docker push myusername/myapp:latest
```

**Impact**: No access control, potential security risks
**Fix**: Use ECR, GCR, ACR, or other private registries

### 4. Missing Container Scanning
**Issue**: Building and deploying containers without vulnerability scanning

**Example of Violation**:
```yaml
- name: Build
  run: docker build -t myapp:latest .
- name: Deploy
  run: ./scripts/deploy.sh
```

**Impact**: Deploying vulnerable containers to production
**Fix**: Add Trivy, Grype, Snyk, or Anchore scanning

## Security Failures

### 5. Missing Environment Declarations
**Issue**: Deploying to production without environment protection

**Example of Violation**:
```yaml
deploy-prod:
  runs-on: ubuntu-latest
  steps:
    - run: ./scripts/deploy.sh prod
```

**Impact**: No deployment protection, accidental production deployments
**Fix**: Add `environment: production`

### 6. Incorrect Platform Syntax
**Issue**: Using wrong syntax for detected CI/CD platform

**Example of Violation** (GitLab CI using GitHub Actions syntax):
```yaml
name: Pipeline
on: push
jobs:
  build:
    runs-on: ubuntu-latest
```

**Impact**: Pipeline won't execute, syntax errors
**Fix**: Use platform-specific syntax

## Functional Failures

### 7. Missing Job Dependencies
**Issue**: Jobs running without proper dependency chain

**Example of Violation**:
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps: [...]

  deploy:
    runs-on: ubuntu-latest
    steps: [...]  # Missing 'needs: build'
```

**Impact**: Deploy job might run before build completes
**Fix**: Add proper job dependencies with `needs:`

### 8. Missing Artifact Handling
**Issue**: Not passing build artifacts to deployment stages

**Example of Violation**:
```yaml
build:
  runs-on: ubuntu-latest
  steps:
    - run: npm run build
    # Missing artifact upload

deploy:
  needs: build
  runs-on: ubuntu-latest
  steps:
    - run: ./scripts/deploy.sh
    # Missing artifact download
```

**Impact**: Deploy stage has no artifacts to deploy
**Fix**: Use actions/upload-artifact and actions/download-artifact

### 9. Missing Manual Approval for Production
**Issue**: No manual approval gate before production deployment

**Example of Violation**:
```yaml
deploy-prod:
  needs: deploy-staging
  runs-on: ubuntu-latest
  # Missing environment approval
```

**Impact**: Automated deployments to production without review
**Fix**: Add environment with required reviewers

### 10. No Failure Notifications
**Issue**: Pipeline failures go unnoticed

**Example of Violation**:
```yaml
jobs:
  deploy:
    steps:
      - run: ./scripts/deploy.sh
    # Missing notification on failure
```

**Impact**: Team unaware of deployment failures
**Fix**: Add Slack/email notifications with `if: failure()`

## Platform-Specific Issues

### 11. GitHub Actions - Missing Checkout
**Issue**: Not checking out code before use

**Example of Violation**:
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm install  # No code checked out!
```

### 12. GitLab CI - Missing Image Declaration
**Issue**: Not specifying Docker image for job execution

**Example of Violation**:
```yaml
build:
  script:
    - npm install  # No image specified
```

### 13. CircleCI - Incorrect Version Format
**Issue**: Using wrong version declaration

**Example of Violation**:
```yaml
version: 3.0  # CircleCI uses 2.1
```

## Summary

Common failure categories:
- **Security**: Hardcoded secrets, no scanning, public registries
- **Maintainability**: Long inline scripts, poor organization
- **Reliability**: Missing dependencies, no artifacts, no approvals
- **Compliance**: Missing environment protection, no notifications
- **Platform**: Incorrect syntax, missing required elements

All issues must be resolved for production-ready pipeline configuration.
