Hey team,

We need to set up a complete CI/CD pipeline for our Node.js application that automatically builds Docker images and deploys them to AWS. The business wants an automated workflow that triggers on every GitHub commit, builds the application into a Docker container, stores the image in ECR, and deploys it through our environments. This needs to be production-ready with proper monitoring, security, and failure notifications.

I've been asked to create this infrastructure using **Pulumi with TypeScript**. The pipeline should handle the entire workflow from source code to deployment, with proper artifact management, least-privilege security, and visibility into the build process. We need to ensure the team gets notified immediately if any build or deployment fails so they can respond quickly.

The current manual deployment process is error-prone and time-consuming. We want developers to simply push code to GitHub and have everything else happen automatically - building, testing, and deploying the Docker containers. The pipeline needs to be reliable, secure, and cost-effective while providing full visibility into what's happening at each stage.

## What we need to build

Create a complete CI/CD pipeline infrastructure using **Pulumi with TypeScript** that automates Docker image builds and deployments for a Node.js application.

### Core Requirements

1. **Artifact Storage**
   - S3 bucket for storing pipeline artifacts
   - Enable versioning to track artifact history
   - Proper lifecycle policies for cost optimization

2. **Container Image Management**
   - ECR repository for storing Docker images
   - Proper image tagging and lifecycle policies
   - Secure access controls

3. **Build Infrastructure**
   - CodeBuild project configured for Docker image builds
   - Use standard Linux environment with Docker support
   - Build from Node.js application source code
   - Output Docker images to ECR

4. **Pipeline Orchestration**
   - CodePipeline with three stages: source, build, and deploy
   - GitHub integration for source stage
   - Automatic webhook triggers on code commits
   - Proper stage transitions and artifact passing

5. **Security and Access Control**
   - IAM roles for CodeBuild with least-privilege permissions
   - IAM roles for CodePipeline with least-privilege permissions
   - Proper trust relationships and service permissions
   - Secure access to ECR, S3, and CloudWatch

6. **Monitoring and Logging**
   - CloudWatch Logs integration for build logs
   - 7-day log retention for cost optimization
   - Build status visibility

7. **Failure Notifications**
   - SNS topic for pipeline failure alerts
   - Configure CodePipeline to publish to SNS on failures
   - Enable team to respond quickly to issues

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **S3** for artifact storage with versioning enabled
- Use **CodeBuild** for Docker image builds with standard Linux environment
- Use **ECR** for Docker image repository
- Use **CodePipeline** for pipeline orchestration with source, build, and deploy stages
- Use **IAM** for least-privilege role management
- Use **CloudWatch Logs** for build logging with 7-day retention
- Use **SNS** for failure notifications
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- Tag all resources with Environment=production and Project=nodejs-app

### Constraints

- Implement least-privilege IAM policies - only grant necessary permissions
- All resources must be destroyable (no Retain policies)
- Build environment must support Docker
- Pipeline must trigger automatically on GitHub commits via webhooks
- CloudWatch Logs retention must be exactly 7 days
- All resources must include consistent tags
- Include proper error handling and logging

### Deployment Requirements (CRITICAL)

- All resource names MUST include the environmentSuffix parameter for uniqueness
- Use format: resource-type-${environmentSuffix} (e.g., artifacts-bucket-${environmentSuffix})
- All resources MUST be destroyable with RemovalPolicy.DESTROY or equivalent
- FORBIDDEN: Using Retain policies or making resources permanent
- IAM policies must follow least-privilege principle - grant only required permissions
- ECR lifecycle policies should prevent unlimited image accumulation

## Success Criteria

- Functionality: Pipeline triggers automatically on GitHub commits and builds Docker images successfully
- Performance: Builds complete in reasonable time with proper resource allocation
- Reliability: Pipeline handles failures gracefully and retries appropriately
- Security: All IAM roles follow least-privilege with no overly permissive policies
- Resource Naming: All resources include environmentSuffix parameter in names
- Code Quality: Clean TypeScript code, well-structured, properly typed
- Monitoring: Build logs visible in CloudWatch with 7-day retention
- Notifications: SNS alerts sent on any pipeline failures
- Tagging: All resources tagged with Environment=production and Project=nodejs-app

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- S3 bucket with versioning for artifacts
- ECR repository for Docker images
- CodeBuild project with Docker support
- CodePipeline with source, build, and deploy stages
- IAM roles for CodeBuild and CodePipeline with least-privilege policies
- CloudWatch Logs configuration with 7-day retention
- SNS topic and pipeline notification configuration
- All resources with proper tags and naming conventions
- Documentation in lib/README.md with deployment instructions
