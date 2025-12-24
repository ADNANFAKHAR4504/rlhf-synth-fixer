Hey team,

We need to build a complete CI/CD pipeline that automates Docker image builds and pushes them to Amazon ECR. The DevOps team has been managing Docker builds manually, and we're looking to fully automate this workflow. I've been asked to create this infrastructure using TypeScript with Pulumi. The business wants a production-grade pipeline that triggers automatically on code changes and stores everything securely.

The challenge here is setting up a robust pipeline that handles source code changes from GitHub, builds Docker images using CodeBuild, and manages the entire artifact lifecycle. We need proper IAM permissions, logging for troubleshooting, and all the AWS services working together seamlessly. This is a hard complexity task because we're integrating multiple AWS services including CodePipeline, CodeBuild, ECR, S3, and CloudWatch.

The pipeline needs to be fully automated with webhook triggers, include a manual approval gate before deployment, and ensure all resources are properly tagged for cost tracking and governance. Everything should follow AWS best practices for security and be easily destroyable for testing environments.

## What we need to build

Create a complete CI/CD pipeline using **Pulumi with TypeScript** that automates Docker image builds and pushes to ECR.

### Core Requirements

1. **Artifact Storage**
   - S3 bucket for storing pipeline artifacts
   - Enable versioning on the bucket for artifact history
   - Resource names must include environmentSuffix for uniqueness

2. **Container Registry**
   - ECR repository named 'app-images' for Docker images
   - Enable image scanning on push for security vulnerabilities
   - Configure proper lifecycle policies

3. **Build Infrastructure**
   - CodeBuild project that builds Docker images
   - Use buildspec.yml file from source repository
   - Linux container environment with Docker capabilities
   - Standard compute runtime for cost efficiency

4. **Pipeline Configuration**
   - CodePipeline with three stages: Source, Build, and Deploy
   - Source stage: GitHub integration with webhook triggers
   - Build stage: CodeBuild integration
   - Deploy stage: Manual approval gate
   - Trigger pipeline automatically on main branch changes

5. **Security and Access Control**
   - IAM roles for CodeBuild with least privilege access
   - Policies allowing CodeBuild to access ECR (push images)
   - Policies allowing CodeBuild to access S3 (artifacts)
   - Proper trust relationships between services

6. **Monitoring and Logging**
   - CloudWatch Logs for CodeBuild output
   - 7-day log retention period
   - Enable detailed logging for troubleshooting

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **S3** for artifact storage with versioning
- Use **ECR** for Docker image repository with scanning enabled
- Use **CodeBuild** for building Docker images
- Use **CodePipeline** for orchestrating the CI/CD workflow
- Use **IAM** for service roles and policies
- Use **CloudWatch Logs** for build logs with 7-day retention
- Resource names must include **environmentSuffix** for uniqueness across environments
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **us-east-1** region
- Tag all resources with Environment='production' and Team='devops'

### Deployment Requirements (CRITICAL)

- All resources must be destroyable - no Retain policies or deletion protection
- RemovalPolicy must be DESTROY for all stateful resources (S3, ECR, logs)
- Stack must be fully deployable and destroyable without manual intervention
- No hardcoded account IDs or ARNs - use Pulumi functions to get current account/region
- GitHub connection must be parameterized (accept as stack config or input)

### Constraints

- Use standard compute for CodeBuild (not high-performance instances)
- Keep costs low by using serverless services where possible
- Enable encryption at rest for S3 and ECR
- Follow AWS Well-Architected Framework principles
- All IAM policies must follow least privilege principle
- No public access to S3 bucket or ECR repository
- Include proper error handling in IAM policies
- CloudWatch logs must have defined retention (not indefinite)

## Success Criteria

- **Functionality**: Pipeline triggers automatically on GitHub changes to main branch
- **Build Process**: CodeBuild successfully builds Docker images and pushes to ECR
- **Security**: All IAM roles follow least privilege with proper trust relationships
- **Monitoring**: CloudWatch Logs capture all build output with 7-day retention
- **Artifact Management**: S3 bucket stores pipeline artifacts with versioning
- **Image Security**: ECR scans images on push for vulnerabilities
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: Complete stack can be destroyed without errors or retained resources
- **Cost Optimization**: Uses standard compute and appropriate service tiers
- **Code Quality**: Clean TypeScript code, well-tested, properly documented

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- S3 bucket with versioning for artifacts
- ECR repository 'app-images' with image scanning
- CodeBuild project configured for Docker builds
- CodePipeline with Source (GitHub), Build (CodeBuild), and Deploy (manual approval) stages
- IAM roles and policies for CodeBuild to access ECR and S3
- CloudWatch Logs with 7-day retention
- All resources tagged with Environment='production' and Team='devops'
- Proper exports for key resource ARNs (bucket, repository, pipeline)
- Documentation on how to configure GitHub connection
- Stack that is fully deployable and destroyable
