# CI/CD Pipeline Configuration - Multi-Platform Implementation

## Objective
Implement a production-grade, multi-platform CI/CD pipeline configuration in `lib/ci-cd.yml` following industry best practices and security standards for a Node.js application that automatically builds Docker images and deploys them to AWS.

## Context
The business wants an automated workflow that triggers on every GitHub commit, builds the application into a Docker container, stores the image in ECR, and deploys it through our environments. The current manual deployment process is error-prone and time-consuming. We want developers to simply push code and have everything else happen automatically - building, testing, and deploying the Docker containers. The pipeline needs to be reliable, secure, and cost-effective while providing full visibility into what's happening at each stage.

## Platform Support
Your implementation can target any of the following CI/CD platforms:
- **GitHub Actions** (GitHub Workflows) - Preferred
- **GitLab CI/CD**
- **CircleCI**
- **Google Cloud Build**
- **ArgoCD** (GitOps)
- **Azure DevOps Pipelines**
- **Jenkins** (Declarative Pipeline)

## What we need to build

Create a complete CI/CD pipeline configuration in `lib/ci-cd.yml` that automates Docker image builds and deployments for a Node.js application.

### Core Requirements

1. **Platform Detection & Correct Syntax**
   - Use platform-specific syntax correctly
   - For GitHub Actions: `name:`, `on:`, `jobs:`, `runs-on:`, `steps:`
   - For GitLab CI: `image:`, `stages:`, `stage:`, `script:`
   - For CircleCI: `version:`, `workflows:`, `jobs:`

2. **Script Organization (CRITICAL)**
   - **MUST FOLLOW:** All script blocks with more than 5 lines MUST be moved to external `scripts/` directory
   - Keep pipeline YAML clean and maintainable
   - Example: `run: ./scripts/deploy.sh` instead of inline scripts

3. **Container Image Management**
   - **MUST use private container registry**: AWS ECR, GCR, ACR, GitLab Registry, GHCR, or Harbor
   - **FORBIDDEN:** Public DockerHub images for deployment
   - Proper image tagging with commit SHA or version
   - Lifecycle policies to prevent unlimited accumulation

4. **Build and Deploy Stages**
   - Source/Checkout stage
   - Build stage (compile, test, build Docker image)
   - Container scanning stage (security validation)
   - Deploy to Dev environment
   - Manual approval for Staging (optional)
   - Deploy to Staging
   - Manual approval for Production (required)
   - Deploy to Production

5. **Security and Secrets Management (CRITICAL)**
   - **FORBIDDEN:** Hardcoded secrets (AWS keys, passwords, API keys, tokens)
   - **MUST:** Use platform-specific secret syntax
     - GitHub Actions: `${{ secrets.SECRET_NAME }}`
     - GitLab CI: CI/CD variables
     - CircleCI: Context variables
   - **AUTO-FAIL:** Any hardcoded credentials like `AKIA...`, `password: "..."`, etc.

6. **Container Vulnerability Scanning**
   - **REQUIRED** if building container images
   - Use Trivy, Grype, Snyk, Anchore, Aqua Security, or Prisma Cloud
   - Scan images before deployment
   - Fail pipeline on HIGH/CRITICAL vulnerabilities

7. **Environment Declaration**
   - Declare environments for deployment protection
   - GitHub Actions: `environment: production`
   - GitLab CI: `environment: { name: production, url: ... }`
   - Azure DevOps: `environment: production`

8. **Artifact Handling**
   - Proper artifact upload/download between jobs
   - Build artifacts should be passed to deploy stages
   - Use platform-specific artifact actions/features

9. **Monitoring and Notifications**
   - Build status notifications
   - Deployment completion alerts
   - Failure notifications (Slack, email, etc.)
   - CloudWatch integration for AWS deployments

### Technical Requirements

- Pipeline configuration in `lib/ci-cd.yml` file
- Target platform: **GitHub Actions** (preferred) or other supported CI/CD platforms
- Build Docker images for Node.js application
- Push images to **private container registry** (AWS ECR recommended)
- Deploy to AWS infrastructure
- Use environment variables for all configuration
- Implement multi-stage pipeline: build → scan → dev → staging → production
- Container scanning with Trivy or equivalent
- Manual approval gates for staging and production
- Proper job dependencies and artifact passing
- Environment declarations for deployment protection
- Secrets managed via platform-specific secret management
- Build and deployment notifications
- External scripts in `scripts/` directory for complex operations

### Constraints

1. **Script Length (CRITICAL - AUTO-FAIL)**
   - No inline scripts longer than 5 lines
   - Move complex logic to `scripts/` directory
   - Keep YAML clean and maintainable

2. **Hardcoded Secrets (CRITICAL - AUTO-FAIL)**
   - Zero tolerance for hardcoded credentials
   - No AWS keys (AKIA...), passwords, API tokens
   - Use platform secret management only

3. **Container Registry**
   - Must use private registry (ECR, GCR, ACR, etc.)
   - No public DockerHub for deployment images
   - Proper authentication and access control

4. **Container Scanning**
   - Required if building container images
   - Must fail on HIGH/CRITICAL vulnerabilities
   - Use industry-standard scanning tools

5. **Pipeline Requirements**
   - Must trigger automatically on commits
   - Proper job dependencies
   - Artifact passing between stages
   - Environment protection for production

### Validation Criteria (CRITICAL)

Your pipeline will be automatically validated against:

1. **Platform Detection** - Correct syntax for detected platform 
2. **Script Length** - No inline scripts >5 lines 
3. **Private Registry** - Container images from private registries only 
4. **Secret Management** - No hardcoded secrets, proper syntax 
5. **Container Scanning** - Required if containers are built 
6. **Environment Declaration** - Environments defined for deployments 
7. **Best Practices** - Caching, artifacts, notifications 
8. **Kubernetes** - Proper namespace and manifest organization (if applicable) 

## Success Criteria

- **Functionality**: Pipeline triggers automatically on commits and builds Docker images successfully
- **Platform Correctness**: Uses correct syntax for detected CI/CD platform
- **Security**: No hardcoded secrets, proper secret management, container scanning
- **Maintainability**: Scripts >5 lines moved to external files
- **Container Security**: Uses private registry, vulnerability scanning passes
- **Deployment Safety**: Environment declarations, manual approvals for production
- **Reliability**: Proper job dependencies, artifact handling, failure notifications
- **Best Practices**: Caching, proper artifact management, status notifications

## What to deliver

1. **`lib/ci-cd.yml`** - Complete CI/CD pipeline configuration
   - Platform-specific correct syntax (GitHub Actions, GitLab CI, etc.)
   - Multi-stage pipeline: source → build → scan → dev → staging → prod
   - Container image build with private registry push
   - Container vulnerability scanning
   - Manual approval gates
   - Environment declarations
   - Proper artifact handling
   - Notifications on success/failure

2. **`scripts/` directory** (if needed)
   - External scripts for operations >5 lines
   - Build scripts
   - Deploy scripts
   - Test scripts
   - Proper permissions (chmod +x)

3. **Configuration**
   - Environment-specific configurations
   - Parameterized for flexibility
   - No hardcoded secrets or credentials

## Example Scenarios

### GitHub Actions Example
```yaml
name: Docker Build and Deploy Pipeline

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REGISTRY: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: docker build -t myapp:${{ github.sha }} .
      - name: Upload artifact
        uses: actions/upload-artifact@v4

  scan:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: aquasecurity/trivy-action@master
        with:
          image-ref: myapp:${{ github.sha }}
          severity: HIGH,CRITICAL

  deploy-dev:
    needs: scan
    environment: dev
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Dev
        run: ./scripts/deploy.sh dev
```

### GitLab CI Example
```yaml
stages:
  - build
  - scan
  - deploy-dev
  - deploy-staging
  - deploy-prod

build:
  stage: build
  script:
    - ./scripts/build-container.sh

scan:
  stage: scan
  image: aquasec/trivy:latest
  script:
    - trivy image $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

deploy-dev:
  stage: deploy-dev
  environment:
    name: development
  script:
    - ./scripts/deploy.sh dev
```

## Tips for Success

1. **Start with platform detection** - Identify and use correct syntax
2. **Keep scripts external** - Move logic >5 lines to `scripts/`
3. **Use environment variables** - Never hardcode values
4. **Never commit secrets** - Use platform secret management
5. **Add container scanning** - Required for security
6. **Declare environments** - Enable deployment protection
7. **Test the pipeline** - Ensure all stages work correctly

## Anti-Patterns to Avoid

-  Long inline scripts (>5 lines)
-  Hardcoded credentials
-  Public DockerHub images for deployment
-  Missing container scanning
-  No environment declarations
-  Poor job dependency management
-  Missing artifact handling between jobs
