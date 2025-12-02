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
