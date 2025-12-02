Hey team,

We need to build a complete CI/CD pipeline for containerized applications using AWS native services. The business wants a fully automated workflow that takes code from GitHub, builds Docker images, stores them in a private registry, and deploys them through a controlled approval process.

I've been asked to create this infrastructure using **Pulumi with TypeScript** to provision all the required AWS resources. This pipeline needs to handle the full lifecycle from source control to deployment, with proper artifact management, build automation, and notification capabilities.

The key challenge here is setting up a production-ready pipeline that follows AWS best practices for security, monitoring, and cost optimization. We need proper IAM permissions with least privilege, comprehensive logging for troubleshooting builds, and lifecycle policies to manage storage costs.

## What we need to build

Create a complete CI/CD pipeline infrastructure using **Pulumi with TypeScript** for containerized application deployment.

### Core Requirements

1. **Artifact Storage**
   - Create an S3 bucket for storing pipeline artifacts
   - Enable versioning on the bucket for artifact history
   - Configure appropriate bucket policies and encryption

2. **Container Registry**
   - Set up an ECR repository for Docker image storage
   - Implement lifecycle policies to manage image retention and reduce storage costs
   - Configure appropriate repository policies

3. **Build Automation**
   - Configure a CodeBuild project that builds Docker images from GitHub repository
   - Use standard Linux environment with Docker support for builds
   - Integrate with the ECR repository for image push operations

4. **IAM Security**
   - Create IAM roles for CodePipeline service with minimal required permissions
   - Create IAM roles for CodeBuild service with minimal required permissions
   - Follow principle of least privilege for all service roles
   - Ensure roles can only access resources they specifically need

5. **Pipeline Orchestration**
   - Deploy CodePipeline with three distinct stages:
     - Source stage: Pull code from GitHub repository
     - Build stage: Execute CodeBuild project to build Docker images
     - Manual Approval stage: Require human approval before deployment
   - Configure proper stage transitions and dependencies

6. **Monitoring and Logging**
   - Enable CloudWatch Logs for CodeBuild with 7-day retention period
   - Ensure build logs are captured for troubleshooting
   - Set appropriate log retention to manage costs

7. **Notifications**
   - Set up SNS topic for pipeline state change notifications
   - Configure notifications for pipeline execution events
   - Enable team awareness of pipeline status

8. **Resource Tagging**
   - Tag all resources with Environment=ci
   - Tag all resources with Project=container-pipeline
   - Ensure consistent tagging for cost tracking and resource management

9. **Build Configuration**
   - Configure CodeBuild to use standard Linux environment
   - Enable Docker support for container builds
   - Set appropriate build timeout and resource allocation

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **S3** for artifact storage with versioning
- Use **ECR** for Docker image registry with lifecycle policies
- Use **CodeBuild** for Docker image builds from GitHub
- Use **CodePipeline** for CI/CD orchestration (Source, Build, Manual Approval stages)
- Use **IAM** for service roles with least privilege permissions
- Use **CloudWatch Logs** for build monitoring (7-day retention)
- Use **SNS** for pipeline notifications
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **us-east-1** region
- All resources must be tagged with Environment=ci and Project=container-pipeline

### Deployment Requirements (CRITICAL)

- **Resource Naming**: ALL named resources (S3 buckets, ECR repositories, CodeBuild projects, CodePipeline, SNS topics, IAM roles) MUST include environmentSuffix parameter to ensure uniqueness across parallel deployments
- **Destroyability**: All resources must be fully destroyable without manual intervention. NO RemovalPolicy.RETAIN or deletion protection settings allowed
- **S3 Buckets**: Must be destroyable (Pulumi handles cleanup after PR review)
- **ECR Repositories**: Configure with forceDelete or equivalent to allow removal
- **IAM Roles**: Ensure roles can be deleted without dependency issues

### Constraints

- Use minimal IAM permissions following least privilege principle
- Keep CloudWatch Logs retention to 7 days to control costs
- Use serverless and managed services where possible for cost optimization
- Include proper error handling in pipeline stages
- Ensure resources are properly tagged for cost allocation
- All resources must be fully destroyable for synthetic task cleanup

## Success Criteria

- **Functionality**: Complete CI/CD pipeline with source, build, and approval stages operational
- **Performance**: Build environment properly configured with Docker support
- **Reliability**: Proper error handling and logging for troubleshooting
- **Security**: IAM roles follow least privilege, S3 versioning enabled, ECR lifecycle policies configured
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Monitoring**: CloudWatch Logs enabled with appropriate retention
- **Notifications**: SNS notifications configured for pipeline events
- **Code Quality**: Clean TypeScript code, well-structured, properly typed
- **Tagging**: All resources tagged with Environment=ci and Project=container-pipeline

## What to deliver

- Complete Pulumi TypeScript implementation with all AWS services
- S3 bucket with versioning for artifact storage
- ECR repository with lifecycle policies for Docker images
- CodeBuild project configured for Docker builds from GitHub
- CodePipeline with Source, Build, and Manual Approval stages
- IAM roles for CodePipeline and CodeBuild with least privilege permissions
- CloudWatch Logs configuration with 7-day retention
- SNS topic for pipeline state notifications
- Unit tests for all infrastructure components
- Documentation with deployment instructions
- Pipeline URL and ECR repository URI as stack outputs

## Implementation Notes

### CI/CD Workflow Template (lib/ci-cd.yml)

The `lib/ci-cd.yml` file is a **reference workflow template** demonstrating how to deploy this Pulumi infrastructure in a GitHub Actions CI/CD pipeline. It is **not an active workflow** for this repository. Users should:

1. Copy this file to `.github/workflows/` in their target repository
2. Configure the required GitHub secrets (see below)
3. Adjust environment-specific settings as needed

### Required GitHub Secrets Configuration

The following secrets must be configured in your GitHub repository settings before using the CI/CD workflow:

| Secret Name | Description |
|-------------|-------------|
| `GITHUB_OIDC_ROLE_ARN` | ARN of the IAM role for GitHub OIDC authentication |
| `PULUMI_ACCESS_TOKEN` | Pulumi Cloud access token for state management |
| `DEV_ACCOUNT_ID` | AWS account ID for development environment |
| `STAGING_ACCOUNT_ID` | AWS account ID for staging environment |
| `PROD_ACCOUNT_ID` | AWS account ID for production environment |
| `SLACK_WEBHOOK_URL` | (Optional) Slack webhook URL for notifications |

### CodePipeline GitHub Configuration

The CodePipeline source stage uses placeholder GitHub credentials that **must be replaced** before deployment:

```typescript
configuration: {
  Owner: 'example-owner',      // Replace with your GitHub username/org
  Repo: 'example-repo',        // Replace with your repository name
  Branch: 'main',              // Adjust branch as needed
  OAuthToken: 'placeholder-token',  // Replace with GitHub PAT or use AWS Secrets Manager
}
```

**Recommended**: Store the GitHub OAuth token in AWS Secrets Manager and reference it dynamically.

### S3 Versioning Configuration

The S3 bucket uses the `versioning` block configuration which is functional and supported. While AWS has introduced `aws_s3_bucket_versioning` as a separate resource in newer Terraform/provider versions, the inline `versioning` block in Pulumi remains fully operational and is the recommended approach for this implementation. No immediate migration is required.