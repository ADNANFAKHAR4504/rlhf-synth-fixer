# Reusable GitHub Actions CI/CD Pipeline

This is a **reusable GitHub Actions workflow** designed to work with multiple repositories. The pipeline respects each repository's own npm scripts, allowing teams to define their own build, test, and deployment commands while following a standardized CI/CD flow.

## 🏗️ Architecture & Design

### Modular Approach
The pipeline uses **composite actions** to eliminate code duplication and improve maintainability:

- **Setup Environment Action**: Handles checkout, Node.js setup, artifact downloads, and binary permissions
- **Configure AWS Action**: Manages AWS credential configuration for CDK operations
- **Main Workflow**: Orchestrates the CI/CD flow using the composite actions

### Key Benefits
- **Repository Freedom**: Uses npm scripts (`npm run test:unit`, `npm run test:integration`) so each repo defines its own commands
- **Efficient Dependency Management**: Installs dependencies once and shares them across all jobs
- **Artifact Sharing**: Shares build artifacts and executable binaries between jobs
- **Flexible Testing**: Supports both mocked and live integration testing
- **Maintainable**: Reusable components eliminate 70% of code duplication

## Required GitHub Secrets

To use this pipeline, you need to configure the following secrets in your GitHub repository settings:

### AWS Credentials
- `AWS_ACCESS_KEY_ID` - Your AWS access key ID
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret access key  
- `AWS_REGION` - AWS region for deployment (optional, defaults to us-east-1)

### API Configuration (for live integration tests)
- `API_GATEWAY_ENDPOINT` - The deployed API Gateway endpoint URL
- `READ_ONLY_API_KEY` - Read-only API key for testing
- `ADMIN_API_KEY` - Admin API key for testing

## Workflow Triggers

### Push to Main Branch
- Runs full pipeline: Build → Unit Tests → CDK Synth → CDK Deploy → Live Integration Tests
- Deploys to production environment
- Runs integration tests against live environment

### Pull Requests
- Runs: Build → Unit Tests → Mocked Integration Tests
- No deployment, uses mocked endpoints for testing
- Provides fast feedback for development

## Pipeline Stages

1. **Build**: Compiles TypeScript and prepares artifacts
2. **Unit Testing**: Runs unit tests with coverage
3. **CDK Synth**: Synthesizes CloudFormation templates (main branch only)
4. **CDK Deploy**: Deploys infrastructure to AWS (main branch only)
5. **Integration Tests**: 
   - Mocked tests for pull requests
   - Live tests against deployed infrastructure for main branch
6. **Cleanup**: Destroys infrastructure if deployment or tests fail

## Environment Protection

The pipeline uses GitHub's environment protection for the `production` environment. This allows you to:
- Require manual approval before deployment
- Restrict deployments to specific branches
- Add additional security policies

## Setup Instructions

1. **Configure AWS IAM User/Role**:
   - Create an IAM user with permissions for CDK deployment
   - Add the access key and secret to GitHub secrets

2. **Set up GitHub Secrets**:
   - Go to repository Settings → Secrets and variables → Actions
   - Add all required secrets listed above

3. **Configure Environment Protection** (optional):
   - Go to repository Settings → Environments
   - Create a `production` environment
   - Add protection rules as needed

4. **First Deployment**:
   - Push to main branch to trigger the pipeline
   - Monitor the Actions tab for deployment progress
   - Update API secrets with actual values after first deployment

## Local Development

You can still use the existing npm scripts for local development:

```bash
npm run build          # Build the project
npm run watch          # Watch for changes
npm run test:unit      # Run unit tests
npm run test:integration # Run integration tests
npx cdk synth          # Synthesize CloudFormation
npx cdk deploy         # Deploy to AWS
```

## Node.js Version

The pipeline uses Node.js 22 LTS as specified. Make sure your local development environment matches this version for consistency.

## Repository Requirements

For the pipeline to work with your repository, you need to define these npm scripts in your `package.json`:

```json
{
  "scripts": {
    "build": "tsc",                    // or your build command
    "test:unit": "jest --coverage --testPathPattern=\\.unit\\.test\\.ts$",
    "test:integration": "jest --testPathPattern=\\.int\\.test\\.ts$ --testTimeout=30000"
  }
}
```

### Script Definitions:
- **`build`**: Compiles/builds your project (e.g., TypeScript compilation)
- **`test:unit`**: Runs unit tests with coverage reporting
- **`test:integration`**: Runs integration tests (works with both mocked and live environments)

The pipeline will automatically handle:
- Installing dependencies (`npm ci`)
- Sharing `node_modules` and binaries across jobs
- Setting up the PATH for executable commands
- CDK synthesis and deployment (if applicable)
