# CI/CD Pipeline for Containerized Applications

Hey team,

We need to build a comprehensive CI/CD pipeline system for deploying containerized applications. The business wants an automated deployment workflow that handles everything from source code changes to production deployments, with built-in security scanning and manual approval gates. This is critical for our DevOps team to streamline their container deployment process while maintaining security and compliance.

The pipeline needs to integrate with GitHub as the source, build Docker images automatically, scan them for vulnerabilities, and deploy approved images to ECR with proper versioning. The DevOps team wants to be notified immediately when something goes wrong, and they need manual control over which images make it to production.

## What we need to build

Create a CI/CD pipeline infrastructure using **CDK with TypeScript** for containerized application deployments.

### Core Requirements

1. **CodePipeline Configuration**
   - Three-stage pipeline: Source, Build, and Deploy
   - Automated triggering on source repository changes via CloudWatch Events
   - Artifact management with S3 storage

2. **Source Stage**
   - GitHub integration as source provider
   - OAuth token authentication stored in Secrets Manager
   - Automatic triggering on repository changes

3. **Build Stage**
   - CodeBuild project for Docker image builds
   - Uses provided buildspec.yml file for build instructions
   - Produces Docker images ready for deployment

4. **Security Scanning**
   - Dedicated CodeBuild project for security analysis
   - Trivy integration for container vulnerability scanning
   - Automated security checks before deployment

5. **ECR Deployment**
   - Deploy approved Docker images to Elastic Container Registry
   - Semantic versioning tags (major.minor.patch format)
   - Automated image lifecycle management

6. **Manual Approval Gate**
   - Manual approval action between security scan and ECR deployment
   - Ensures human oversight before production deployments
   - SNS notifications for approval requests

7. **Artifact Storage**
   - S3 bucket for pipeline artifacts
   - Server-side encryption for all artifacts
   - 30-day lifecycle policy for automatic cleanup

8. **IAM Security**
   - Least privilege IAM roles for CodePipeline service
   - Least privilege IAM roles for CodeBuild projects
   - Proper cross-service permissions

9. **Event-Driven Automation**
   - CloudWatch Events rule for automatic pipeline triggering
   - Responds to source repository changes automatically

10. **Failure Notifications**
    - SNS topic for pipeline failure alerts
    - Email notifications to DevOps team
    - Immediate alerting on build or deployment failures

### Technical Requirements

- All infrastructure defined using **CDK with TypeScript**
- Use **CodePipeline** for orchestration
- Use **CodeBuild** for Docker builds and security scanning
- Use **ECR** for container image storage
- Use **S3** for artifact storage with encryption
- Use **Secrets Manager** for GitHub OAuth token
- Use **SNS** for notifications
- Use **CloudWatch Events** for pipeline triggering
- Use **IAM** for service roles and policies
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-environment-suffix`
- Deploy to **us-east-1** region
- All resources must be destroyable (no Retain policies)

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** in their names for uniqueness
- Resource naming pattern: `{resource-type}-{environmentSuffix}`
- No DeletionProtection or Retain policies allowed
- All resources must be fully destroyable after testing
- S3 buckets must have RemovalPolicy.DESTROY with autoDeleteObjects: true
- ECR repositories must have RemovalPolicy.DESTROY

### CI/CD Workflow Requirements

Reference the provided `lib/ci-cd.yml` for multi-stage deployment patterns:
1. GitHub OIDC authentication for secure access
2. Build stage with dependency installation and synthesis
3. Security scanning with cdk-nag
4. Multi-environment deployment (dev, staging, prod)
5. Manual approval gates between environments
6. Encrypted artifact handling
7. Notification webhooks for deployment status

The infrastructure code should support automated CI/CD deployment and work seamlessly with GitHub Actions workflows.

### Constraints

- GitHub OAuth token must be stored in Secrets Manager, never hardcoded
- All S3 artifacts must be encrypted at rest
- IAM roles must follow least privilege principle
- Pipeline artifacts retained for exactly 30 days
- CodeBuild projects must have appropriate timeout settings
- Lambda runtime compatibility (if used): Node.js 18+ requires AWS SDK v3
- All resources must be destroyable (no Retain policies)
- Trivy scanner must be properly configured in CodeBuild
- buildspec.yml file should be referenced from repository

## Success Criteria

- **Functionality**: Pipeline triggers automatically on GitHub changes
- **Functionality**: Docker images build successfully via CodeBuild
- **Security**: Trivy scans containers and reports vulnerabilities
- **Security**: OAuth tokens stored securely in Secrets Manager
- **Automation**: Manual approval required before ECR deployment
- **Automation**: Semantic versioning applied to all images
- **Storage**: S3 artifacts encrypted and retained for 30 days
- **Monitoring**: SNS notifications sent on pipeline failures
- **Permissions**: IAM roles implement least privilege access
- **Resource Naming**: All resources include environmentSuffix
- **Destroyability**: All resources can be destroyed via cdk destroy

## What to deliver

- Complete CDK TypeScript implementation
- CodePipeline with Source, Build, and Deploy stages
- Two CodeBuild projects (build and security scan)
- ECR repository with lifecycle policies
- S3 bucket for artifacts with encryption and lifecycle
- Secrets Manager secret for GitHub OAuth token
- IAM roles and policies with least privilege
- SNS topic for failure notifications
- CloudWatch Events rule for pipeline triggering
- Unit tests for all components
- Integration tests validating pipeline execution
- Documentation and deployment instructions in README.md
