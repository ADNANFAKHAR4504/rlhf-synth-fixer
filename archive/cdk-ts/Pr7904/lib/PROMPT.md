# CI/CD Pipeline for Node.js Application

Hey team,

We need to build a complete CI/CD pipeline for our Node.js application using **AWS CDK with TypeScript**. The business wants to automate the entire deployment workflow from source code commits through to production deployment. We're currently doing manual deployments which is error-prone and time-consuming, so we need a proper automated pipeline.

The pipeline needs to handle the full lifecycle: pulling code from source control, running our test suite, building the application, and deploying it through CloudFormation. We also need proper artifact management and comprehensive logging so we can troubleshoot issues when they come up.

## What we need to build

Create a complete CI/CD pipeline infrastructure using **AWS CDK with TypeScript** that automates the deployment of a Node.js application from source to production.

### Core Requirements

1. **Source Control**
   - CodeCommit repository for storing application source code
   - Output the repository clone URL for developer access

2. **Build System**
   - CodeBuild project configured to run npm install, npm test, and npm build
   - Use aws/codebuild/standard:6.0 build image
   - Set NODE_ENV environment variable to 'production'
   - Build timeout of 15 minutes
   - CloudWatch Logs integration with 7-day retention

3. **Pipeline Orchestration**
   - CodePipeline with three stages: Source, Build, and Deploy
   - Source stage: CodeCommit integration
   - Build stage: CodeBuild integration
   - Deploy stage: CloudFormation deployment
   - Automatic triggering on commits to main branch
   - Output the pipeline ARN

4. **Artifact Storage**
   - S3 bucket for storing build artifacts
   - Enable versioning on the bucket

5. **Security and Access Control**
   - IAM roles for CodePipeline with least privilege access
   - IAM roles for CodeBuild with least privilege access
   - Proper service-to-service permissions

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use CodeCommit for source repository
- Use CodeBuild for build automation
- Use CodePipeline for pipeline orchestration (3 stages)
- Use S3 for artifact storage with versioning enabled
- Use IAM for service roles with least privilege
- Use CloudWatch Logs for build logs with 7-day retention
- Use CloudFormation for the deploy stage
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to us-east-1 region
- All resources must be destroyable (no Retain policies)

### Build Configuration

- Build image: aws/codebuild/standard:6.0
- Build commands: npm install, npm test, npm build
- Build timeout: 15 minutes
- Environment variable: NODE_ENV='production'

### Pipeline Behavior

- Automatic trigger on commits to main branch
- Three-stage workflow: Source -> Build -> Deploy
- Artifact passing between stages

### Deployment Requirements (CRITICAL)

- All resource names must include environmentSuffix parameter
- Example naming: codecommit-repo-dev, codebuild-project-prod
- Use RemovalPolicy.DESTROY for all resources (no Retain policies)
- This ensures resources can be fully cleaned up during testing
- All IAM roles must follow least privilege principle
- CloudWatch log groups must have 7-day retention period

## Success Criteria

- Functionality: Complete working CI/CD pipeline from source to deploy
- Automation: Pipeline triggers automatically on main branch commits
- Security: IAM roles implement least privilege access
- Observability: CloudWatch Logs capture all build activity with 7-day retention
- Artifact Management: S3 bucket stores versioned build artifacts
- Resource Naming: All resources include environmentSuffix
- Code Quality: TypeScript, well-structured, documented
- Outputs: Repository clone URL and pipeline ARN available

## What to deliver

- Complete AWS CDK TypeScript implementation
- CodeCommit repository setup
- CodeBuild project with proper build configuration
- CodePipeline with three stages (Source, Build, Deploy)
- S3 bucket with versioning for artifacts
- IAM roles with least privilege for all services
- CloudWatch Logs configuration with 7-day retention
- CloudFormation integration for deploy stage
- Proper outputs for repository URL and pipeline ARN
- Unit tests for all components
- Documentation and deployment instructions
