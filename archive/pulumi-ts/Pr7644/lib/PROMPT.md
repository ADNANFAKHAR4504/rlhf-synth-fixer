# CI/CD Pipeline Infrastructure Setup

Hey team,

We need to set up a complete CI/CD pipeline for our application using AWS native services. The business wants a fully automated pipeline that handles source control integration, builds, and deployments. I've been asked to create this infrastructure using Pulumi with TypeScript so we can manage everything as code.

The current pain point is that we're doing manual deployments and it's becoming error-prone and time-consuming. We need an automated solution that integrates with our GitHub repository, runs our tests and builds, and deploys to S3. The pipeline should trigger automatically when code is pushed, and we need visibility into what's happening through CloudWatch logs.

The architecture needs to be secure with least-privilege IAM policies, and everything should be properly tagged and organized. We also need the ability to tear everything down cleanly when needed, so no permanent retention policies that would block cleanup.

## What we need to build

Create a complete CI/CD pipeline infrastructure using **Pulumi with TypeScript** for automated application deployment.

### Core Requirements

1. **Artifact Storage**
   - S3 bucket for storing pipeline artifacts
   - Versioning enabled to track artifact history
   - Proper bucket policies for CodePipeline and CodeBuild access

2. **Build Project Configuration**
   - CodeBuild project with standard Linux 5.0 environment
   - Node.js 18 runtime for build execution
   - Build commands: npm install, npm test, npm run build
   - Integration with CloudWatch Logs for build output

3. **Pipeline Stages**
   - Source stage connected to GitHub repository
   - Build stage using the CodeBuild project
   - Deploy stage pushing artifacts to S3
   - Automatic triggering on GitHub webhook events

4. **Security and Access Control**
   - IAM roles for CodePipeline service with least-privilege policies
   - IAM roles for CodeBuild service with appropriate permissions
   - Service roles scoped to only required actions and resources
   - GitHub webhook authentication and authorization

5. **Monitoring and Logging**
   - CloudWatch Log Group for CodeBuild project
   - 30-day log retention period
   - Build status and error tracking
   - Pipeline execution history

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS CodePipeline** for pipeline orchestration
- Use **AWS CodeBuild** for build execution
- Use **AWS S3** for artifact storage and deployment target
- Use **AWS IAM** for service roles and policies
- Use **AWS CloudWatch Logs** for build logging
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-name-environment-suffix
- Deploy to **us-east-1** region

### Constraints

- IAM policies must follow least-privilege principle
- Only grant permissions required for specific pipeline operations
- No overly permissive wildcard permissions in policies
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging
- Pipeline must support automatic GitHub webhook triggering
- Build environment must use standard AWS managed images

### Deployment Requirements (CRITICAL)

- All resource names MUST include environmentSuffix parameter for uniqueness
- Resources must be fully destroyable without manual intervention
- Use DeletionPolicy: Delete or RemovalPolicy: DESTROY on all resources
- FORBIDDEN: Any Retain or Snapshot policies that block cleanup
- Resource naming pattern: {service}-{purpose}-{environmentSuffix}
- Example: codebuild-project-dev, pipeline-main-dev

## Success Criteria

- **Functionality**: Pipeline successfully clones from GitHub, runs build commands, and deploys artifacts
- **Performance**: Builds complete within reasonable time using Node.js 18 runtime
- **Reliability**: Pipeline triggers automatically on GitHub commits via webhooks
- **Security**: IAM roles use least-privilege policies scoped to specific resources
- **Monitoring**: CloudWatch Logs capture all build output with 30-day retention
- **Resource Naming**: All resources include environmentSuffix in their names
- **Outputs**: Pipeline execution history URL and S3 website endpoint exported
- **Code Quality**: TypeScript code, well-structured, properly typed, documented

## What to deliver

- Complete Pulumi TypeScript implementation
- S3 bucket for artifacts with versioning
- CodeBuild project with Node.js 18 environment
- CodePipeline with Source, Build, and Deploy stages
- IAM roles and policies for CodePipeline and CodeBuild
- CloudWatch Log Group with 30-day retention
- Stack outputs for pipeline URL and S3 endpoint
- All resources tagged and named with environmentSuffix
- **CI/CD Pipeline YAML configuration file (lib/ci-cd.yml)** following the requirements below

## CI/CD Pipeline Configuration Requirements

You MUST create a production-grade CI/CD pipeline configuration file at `lib/ci-cd.yml` that automates the deployment of the Pulumi infrastructure.

### Platform Requirements
Choose ONE of the following CI/CD platforms:
- **GitHub Actions** (Recommended)
- **GitLab CI/CD**
- **CircleCI**
- **Azure DevOps Pipelines**

### Pipeline Stages Required
Your CI/CD pipeline MUST include the following stages:

1. **Source Stage**: Checkout code from repository
2. **Build Stage**:
   - Install dependencies
   - Run Pulumi preview
   - Generate CloudFormation templates
   - Upload artifacts
3. **Deploy to Dev**: Deploy infrastructure to development environment
4. **Manual Approval for Staging** (Optional but recommended)
5. **Deploy to Staging**: Deploy to staging environment
6. **Manual Approval for Production** (Required)
7. **Deploy to Production**: Deploy to production environment

### Critical CI/CD Requirements

1. **Script Organization (CRITICAL)**
   - Any script block with more than 5 lines MUST be moved to external `scripts/` directory
   - Example: Create `scripts/deploy-pulumi.sh`, `scripts/run-tests.sh`, etc.
   - Pipeline should call these scripts, not contain inline logic

2. **Secrets Management (CRITICAL - AUTO-FAIL IF VIOLATED)**
   - NEVER hardcode secrets, credentials, or API keys
   - Use platform-specific secret management:
     - GitHub Actions: `${{ secrets.SECRET_NAME }}`
     - GitLab CI: `$CI_SECRET_NAME` or secret variables
     - CircleCI: `${SECRET_NAME}` from context/project settings
   - **Forbidden items that will cause automatic failure:**
     - AWS Access Keys: `AKIA...`
     - Hardcoded passwords
     - API keys
     - Database credentials
     - Private SSH/TLS keys

3. **Environment Declaration**
   - Declare all deployment environments (dev, staging, prod)
   - Use platform-specific environment protection rules
   - Example for GitHub Actions:
     ```yaml
     jobs:
       deploy-dev:
         environment: dev
     ```

4. **AWS Credentials**
   - Use OIDC (OpenID Connect) for AWS authentication (preferred)
   - OR use secrets for AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
   - Specify AWS_REGION as environment variable

5. **Artifact Management**
   - Upload build artifacts (Pulumi state, outputs, logs)
   - Download artifacts in deployment stages
   - Use platform-specific artifact management features

6. **Multi-Environment Support**
   - Support deployment to multiple environments
   - Use environment-specific configuration (dev, staging, prod)
   - Pass environment parameter to Pulumi: `pulumi up --stack <env>`

7. **Notifications**
   - Include success/failure notifications
   - Can use Slack, email, or other notification services
   - Use secrets for webhook URLs

### Example Pipeline Structure (GitHub Actions)

```yaml
name: Pulumi Infrastructure Pipeline

on:
  push:
    branches: [main, dev]
  workflow_dispatch:

env:
  AWS_REGION: us-east-1

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: ./scripts/pulumi-preview.sh
      - uses: actions/upload-artifact@v4
        with:
          name: pulumi-outputs
          path: outputs/

  deploy-dev:
    needs: build
    runs-on: ubuntu-latest
    environment: dev
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
      - run: ./scripts/deploy-pulumi.sh dev
    env:
      AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
      AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
```

### Validation Criteria for CI/CD Pipeline

Your `lib/ci-cd.yml` file will be validated against:

1.  **Platform Detection** - Correct syntax for the chosen platform
2.  **Script Length** - No inline scripts longer than 5 lines
3.  **Secret Management** - No hardcoded secrets; proper use of platform secrets
4.  **Environment Declaration** - All environments properly declared
5.  **Multi-Stage Pipeline** - Build, Dev, Staging, Prod stages present
6.  **Artifact Management** - Proper artifact upload/download between stages
7.  **AWS Configuration** - Proper AWS credentials and region configuration
8.  **Pulumi Integration** - Correct Pulumi commands for preview and deployment

### Anti-Patterns to Avoid in CI/CD

-  Long inline scripts (>5 lines)
-  Hardcoded credentials or secrets
-  Missing environment declarations
-  No artifact handling between jobs
-  No manual approval for production
-  Missing AWS region or credentials configuration
-  Not using platform-specific secret syntax
