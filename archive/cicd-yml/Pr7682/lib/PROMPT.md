# CI/CD Pipeline for Node.js Application

Hey team,

We need to set up a CI/CD pipeline for a Node.js application using GitHub
Actions with AWS integration. The business wants an automated workflow that
takes code from commit to deployment with minimal manual intervention.
I've been asked to build this using **GitHub Actions YAML**.

The pipeline should handle the standard development workflow - when developers
push code to the repository, it automatically builds the application, runs
tests, and deploys the artifacts to AWS S3. We need this to be reliable,
secure, and easy to maintain.

## What we need to build

Create a complete CI/CD pipeline using **GitHub Actions YAML** that automates
the build and deployment process for a Node.js application.

### Core Requirements

1. **Source Control Integration**
   - Trigger on push to main branch
   - Support manual workflow dispatch with environment suffix parameter
   - Filter triggers to relevant paths (src/, package.json, workflows)

2. **Source Validation Stage**
   - Checkout code with full history
   - Generate unique version identifier (timestamp + commit SHA)
   - Validate package.json exists and is valid JSON
   - Scan source code for hardcoded secrets

3. **Build Stage**
   - Setup Node.js 18 with npm caching
   - Install dependencies using npm ci
   - Run tests using npm test
   - Build application using npm run build
   - Upload build artifacts to S3

4. **Deploy Stage**
   - Download artifacts from S3
   - Verify artifacts downloaded successfully
   - Deploy to S3 deployment bucket
   - Verify deployment completed
   - Send deployment notification

5. **Security and Authentication**
   - Use GitHub OIDC for AWS authentication (no long-lived credentials)
   - Configure minimal permissions (id-token: write, contents: read)
   - Use environment protection for production deployments
   - Scan for hardcoded secrets in source code

6. **Resource Naming**
   - All S3 bucket references must include environment suffix
   - Format: `nodeapp-artifacts-${ENVIRONMENT_SUFFIX}`
   - Format: `nodeapp-deploy-${ENVIRONMENT_SUFFIX}`
   - Support parallel deployments to different environments

### Technical Requirements

- Pipeline defined using **GitHub Actions YAML**
- Use **AWS S3** for artifact storage and deployment
- Use **GitHub OIDC** for AWS authentication
- Use **actions/checkout@v4** for code checkout
- Use **actions/setup-node@v4** for Node.js setup
- Use **aws-actions/configure-aws-credentials@v4** for AWS auth
- Environment suffix configurable via workflow_dispatch input
- Default environment suffix: 'dev'
- Deploy to **us-east-1** region

### Security Requirements (CRITICAL)

- **OIDC Authentication**: Use role-to-assume with OIDC, NOT access keys
  - Configure proper role session names for audit trails
  - Store role ARN in GitHub secrets (AWS_OIDC_ROLE_ARN)

- **Minimal Permissions**: Restrict GitHub token permissions
  - id-token: write (required for OIDC)
  - contents: read (required for checkout)

- **Secrets Scanning**: Check source code for hardcoded credentials
  - Scan for password, secret, api_key, access_key patterns
  - Fail build if secrets detected

- **Environment Protection**: Use GitHub environments for deployment gates
  - Configure production environment for deploy job
  - Enable manual approval if required

### Pipeline Structure

```
source-validation -> build -> deploy
```

- **source-validation**: Validates code and generates version
- **build**: Depends on source-validation, builds and uploads artifacts
- **deploy**: Depends on source-validation and build, deploys to production

### Constraints

- All inline scripts must be 5 lines or fewer (split into multiple steps)
- Use environment variables for repeated values
- Follow YAML best practices (80 character line limit)
- Use quoted "on" key for yamllint compatibility
- Include proper error handling and verification steps

## Success Criteria

- **Functionality**: Pipeline executes source-validation -> build -> deploy
- **Security**: OIDC authentication with no long-lived credentials
- **Validation**: Source code scanned for secrets before build
- **Versioning**: Artifacts versioned with timestamp and commit SHA
- **Environment Suffix**: All S3 paths include environment suffix
- **Code Quality**: Clean YAML, passes yamllint validation
- **Notifications**: Deployment status reported on completion

## What to deliver

- Complete GitHub Actions workflow file (ci-cd.yml)
- Three-stage pipeline (source-validation, build, deploy)
- OIDC authentication for AWS
- S3 artifact storage with versioning
- Secrets scanning in source validation
- Environment protection for production
- Deployment verification and notifications
- Documentation of implementation
