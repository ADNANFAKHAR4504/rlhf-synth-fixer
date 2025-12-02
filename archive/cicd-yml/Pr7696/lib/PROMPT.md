Hey team,

We need to build a comprehensive CI/CD pipeline workflow for our CDK applications. The business wants to automate the entire deployment process from code commit to production, with proper gates and notifications along the way. This is a critical piece of infrastructure that will enable our development teams to ship faster while maintaining quality and security standards.

The current manual deployment process is causing delays and inconsistencies. We're looking to implement a multi-stage pipeline with automated testing, manual approval gates for production deployments, and comprehensive notifications. The solution needs to handle branch-based deployments where the main branch goes to production and dev branch triggers development deployments.

I've been asked to create this workflow using **GitHub Actions**. The team has already standardized on GitHub for CI/CD, so it's important we stick with it for consistency across our infrastructure codebase.

## What we need to build

Create a complete CI/CD pipeline workflow using **GitHub Actions** that handles the full deployment lifecycle for CDK applications with multi-account AWS deployments.

### Core Requirements

1. **Multi-Account Deployment**
   - Development account for initial deployments
   - Staging account for pre-production testing
   - Production account for final deployments
   - Cross-account role assumption using role chaining

2. **Pipeline Stages**
   - Source stage to checkout code from repository
   - Build stage to synthesize CDK and run security checks
   - Deploy to Dev environment
   - Manual approval before staging deployment
   - Deploy to Staging environment
   - Manual approval before production deployment
   - Deploy to Production environment

3. **Branch-Based Deployments**
   - Main branch triggers full pipeline to production
   - Dev branch triggers development deployments
   - Manual workflow dispatch for ad-hoc deployments

4. **Security Features**
   - GitHub OIDC for AWS authentication (no long-lived credentials)
   - KMS encryption for pipeline artifacts
   - cdk-nag integration for security compliance scanning
   - Role chaining for cross-account access

5. **Notification System**
   - Slack notifications for deployment status
   - Notifications on all deployment outcomes (success/failure)
   - Environment-specific notification context

6. **Security and Access Control**
   - GitHub OIDC role for initial AWS access
   - CrossAccountDeployRole for staging and production
   - Environment protection rules in GitHub
   - Separate GitHub environments for each stage

7. **Build and Test**
   - Node.js 22 runtime environment
   - Deterministic installs with npm ci
   - CDK synthesis for CloudFormation generation
   - cdk-nag security checks before deployment

### Technical Requirements

- All pipeline configuration defined using **GitHub Actions YAML**
- Use **GitHub OIDC** for secure AWS authentication
- Use **AWS CDK** for infrastructure deployment
- Use **cdk-nag** for security compliance scanning
- Use **KMS** for artifact encryption
- Deploy to **us-east-1** region
- Use GitHub environments for approval gates
- Use role chaining for cross-account deployments
- Enable encryption for all artifacts

### Deployment Requirements (CRITICAL)

Pipeline must support multi-environment deployments:
- Dev environment: Direct deployment after build
- Staging environment: Requires approval from staging-approval environment
- Production environment: Requires approval from prod-approval environment

GitHub Secrets required:
- `GITHUB_OIDC_ROLE_ARN`: IAM role for GitHub OIDC authentication
- `DEV_ACCOUNT_ID`: AWS account ID for development
- `STAGING_ACCOUNT_ID`: AWS account ID for staging
- `PROD_ACCOUNT_ID`: AWS account ID for production
- `SLACK_WEBHOOK_URL`: Slack webhook for notifications

GitHub Environments required:
- `dev`: Development deployment environment
- `staging-approval`: Manual approval gate for staging
- `staging`: Staging deployment environment
- `prod-approval`: Manual approval gate for production
- `prod`: Production deployment environment

### Constraints

- Follow GitHub Actions best practices
- No hardcoded account IDs or ARNs in workflow files
- No hardcoded secrets - use GitHub secrets
- Keep inline scripts under 5 lines where possible
- Use latest action versions (v4 for checkout, upload-artifact, download-artifact)
- Enable proper error handling with continue-on-error where appropriate
- Manual approval gates must be properly configured before staging and production

## Success Criteria

- **Pipeline Creation**: GitHub Actions workflow with source, build, dev, staging, and prod stages
- **Artifact Management**: Encrypted artifacts passed between stages
- **Build Integration**: CDK synthesis and cdk-nag security checks
- **OIDC Authentication**: Secure keyless authentication to AWS
- **Cross-Account Deployment**: Role chaining for staging and production accounts
- **Notifications**: Slack notifications on all deployment outcomes
- **Security**: OIDC authentication, KMS encryption, cdk-nag scanning
- **Approval Gates**: Manual approval environments before staging and production
- **Branch Handling**: Main branch to production, dev branch to development
- **Environment Isolation**: Separate GitHub environments for each stage
- **Workflow Quality**: Clear job dependencies, proper error handling

## What to deliver

- Complete GitHub Actions workflow in lib/ci-cd.yml
- Multi-stage pipeline configuration (source, build, dev, staging, prod)
- Cross-account deployment with role chaining
- Manual approval gates using GitHub environments
- Slack notification integration
- CDK synthesis and security scanning
- KMS artifact encryption
- Documentation with deployment instructions
