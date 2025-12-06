# Build a Complete CI/CD Pipeline for Node.js Application

Hey team,

We need to build a complete CI/CD pipeline for deploying a Node.js web application. I've been asked to create this using **AWS CDK with TypeScript**. The goal is to have infrastructure that automates the entire development workflow from code commit to deployment with proper testing and build steps in between.

This pipeline needs to handle source control, automated testing, builds, and deployment to a static website host. The business wants a fully automated pipeline that triggers on every commit to the main branch, runs tests, builds the application, and deploys it automatically.

## What we need to build

Create a CI/CD pipeline infrastructure using **AWS CDK with TypeScript** that automates the deployment workflow for a Node.js application.

### Core Requirements

1. **Source Control Repository**
   - Create a CodeCommit repository named 'nodejs-webapp'
   - Configure automatic triggering on main branch commits
   - Repository stores the Node.js application source code

2. **Build Automation**
   - Set up CodeBuild project with Node.js 18 standard image
   - Build process runs: npm install, npm test, npm run build
   - Enable build caching for faster subsequent builds
   - Configure NODE_ENV=production environment variable

3. **Deployment Target**
   - S3 bucket configured for static website hosting
   - Bucket serves the built application files
   - Output the website URL for access

4. **Pipeline Orchestration**
   - CodePipeline with three stages: Source, Build, Deploy
   - Source stage pulls from CodeCommit repository
   - Build stage executes CodeBuild project
   - Deploy stage pushes artifacts to S3 bucket
   - Automatic triggering on commits to main branch

5. **IAM Permissions**
   - CodeBuild needs access to source repository
   - CodeBuild needs permissions to deploy to S3
   - Proper service roles for all components
   - Follow least privilege principles

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use AWS CodeCommit for source control
- Use AWS CodeBuild for build automation with Node.js 18 image
- Use AWS CodePipeline for pipeline orchestration
- Use AWS S3 for static website hosting and build cache
- Use AWS IAM for permissions and roles
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- Build caching must be enabled in CodeBuild

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no RemovalPolicy.RETAIN)
- All resources must include environmentSuffix parameter for unique naming
- No deletion protection on any resources
- This infrastructure must support automated deployment via CI/CD

### CI/CD Integration (reference lib/ci-cd.yml)

This infrastructure integrates with GitHub Actions workflow that:
- Uses OIDC authentication for AWS access
- Deploys automatically to dev on commits
- Requires manual approval for staging and prod
- Runs security scanning with cdk-nag
- Supports cross-account deployments

### Constraints

- Must use Node.js 18 runtime for CodeBuild environment
- Static website hosting must be enabled on S3 bucket
- Pipeline must trigger automatically on main branch commits
- Build caching required for performance optimization
- All components must integrate properly with each other
- Include proper error handling and logging

## Success Criteria

- **Functionality**: Complete pipeline from commit to deployment works end-to-end
- **Performance**: Build caching speeds up subsequent builds
- **Reliability**: Pipeline triggers automatically on commits
- **Security**: Proper IAM permissions following least privilege
- **Resource Naming**: All resources include environmentSuffix
- **Integration**: All AWS services work together seamlessly
- **Outputs**: S3 website URL and CodePipeline ARN are available
- **Code Quality**: TypeScript, well-structured, documented

## What to deliver

- Complete AWS CDK TypeScript implementation
- CodeCommit repository for source control
- CodeBuild project with Node.js 18 and build caching
- CodePipeline with Source, Build, Deploy stages
- S3 bucket with static website hosting
- IAM roles and permissions for all services
- Stack outputs for website URL and pipeline ARN
- Unit tests for infrastructure components
- Documentation and deployment instructions
