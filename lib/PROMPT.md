Hey team,

We need to set up automated build infrastructure for one of our Node.js applications. The dev team has been manually building and testing their code, and we want to automate this entire process using AWS CodeBuild. I've been asked to create this infrastructure using **Pulumi with TypeScript**.

The goal is to create a complete CI/CD build pipeline that automatically pulls code from GitHub, runs the full test suite, builds the application, and stores the artifacts. This needs to be production-ready with proper logging, IAM security, and resource tagging.

## What we need to build

Create a continuous integration build system using **Pulumi with TypeScript** that automates Node.js application builds on AWS.

### Core Requirements

1. **Artifact Storage**
   - Create an S3 bucket for storing build artifacts
   - Enable versioning on the bucket to track artifact history
   - All artifacts from successful builds should be stored here

2. **CodeBuild Project**
   - Configure AWS CodeBuild to build Node.js applications
   - Source code comes from a GitHub repository
   - Use AWS-managed Node.js 18 runtime environment
   - Build specifications must be inline (not from buildspec.yml file)
   - Build process: install dependencies, run tests, build application
   - Compute type: BUILD_GENERAL1_SMALL for cost efficiency
   - Build timeout: 15 minutes maximum

3. **Security and Access Control**
   - Create dedicated IAM service role for CodeBuild
   - Follow least-privilege principle (only required permissions)
   - Grant access to S3 bucket for artifact uploads
   - Grant CloudWatch Logs write permissions for build logs
   - Properly configure trust relationship for CodeBuild service

4. **Build Logging**
   - Create CloudWatch Logs log group for build logs
   - Set log retention period to 7 days
   - Configure CodeBuild to stream logs to CloudWatch

5. **Resource Tagging**
   - Tag all resources with Environment: 'ci'
   - Tag all resources with ManagedBy: 'pulumi'

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS S3** for artifact storage with versioning enabled
- Use **AWS CodeBuild** for the build project
- Use **IAM** for service roles and policies
- Use **CloudWatch Logs** for build logging
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-environment-suffix`
- Deploy to **us-east-1** region
- All resources must be fully managed by Pulumi

### Deployment Requirements (CRITICAL)

- All resource names MUST include environmentSuffix parameter (e.g., `codebuild-project-${environmentSuffix}`)
- All resources MUST be destroyable with no retention policies or deletion protection
- S3 bucket must not have RETAIN removal policy
- CloudWatch log group must not have RETAIN removal policy
- Include proper error handling in infrastructure code
- Export stack outputs for CodeBuild project name and S3 bucket name

### Build Process Specification

The CodeBuild project must execute these commands in sequence:
1. `npm install` - Install all Node.js dependencies
2. `npm test` - Run the application test suite
3. `npm run build` - Build the application for deployment

### Constraints

- Use least-privilege IAM permissions (no wildcards or overly broad access)
- Cost-efficient compute resources (BUILD_GENERAL1_SMALL)
- Short log retention (7 days for CI builds)
- All resources must support parallel deployment testing
- No manual configuration required after deployment

## Success Criteria

- **Functionality**: CodeBuild project can successfully pull from GitHub, build Node.js apps, and store artifacts
- **Security**: IAM roles follow least-privilege with specific permissions only
- **Logging**: All build logs captured in CloudWatch with proper retention
- **Tagging**: All resources properly tagged for environment tracking
- **Resource Naming**: All resources include environmentSuffix for unique identification
- **Outputs**: CodeBuild project name and S3 bucket name exported for reference
- **Code Quality**: Clean TypeScript code with proper types and error handling
- **Destroyability**: All resources can be cleanly destroyed without manual intervention

## What to deliver

- Complete Pulumi TypeScript implementation in lib/ directory
- CodeBuild project configured with Node.js 18 runtime
- S3 bucket with versioning for artifact storage
- IAM service role with least-privilege policies
- CloudWatch Logs log group with 7-day retention
- Resource tagging for all AWS resources
- Stack outputs for project name and bucket name
- Unit tests validating all infrastructure components
- Documentation explaining the build pipeline architecture
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