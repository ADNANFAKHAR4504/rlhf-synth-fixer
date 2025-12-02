Hey team,

We need to set up automated build infrastructure for one of our Node.js applications. The dev team has been manually building and testing their code, and we want to automate this entire process using AWS CodeBuild. I've been asked to create this infrastructure using **Pulumi with TypeScript**.

The goal is to create a complete CI/CD build pipeline that automatically pulls code from GitHub, runs the full test suite, builds the application, and stores the artifacts. This needs to be production-ready with proper logging, IAM security, and resource tagging.

## What we need to build

Create a continuous integration build system using **Pulumi with TypeScript** that automates Node.js application builds on AWS.

### Core Requirements

1. **Artifact Storage**
   - Create an S3 bucket for storing build artifacts
   - Enable versioning on the bucket to track artifact history
   - All artifacts from successful builds should be stored here

2. **CodeBuild Project**
   - Configure AWS CodeBuild to build Node.js applications
   - Source code comes from a GitHub repository
   - Use AWS-managed Node.js 18 runtime environment
   - Build specifications must be inline (not from buildspec.yml file)
   - Build process: install dependencies, run tests, build application
   - Compute type: BUILD_GENERAL1_SMALL for cost efficiency
   - Build timeout: 15 minutes maximum

3. **Security and Access Control**
   - Create dedicated IAM service role for CodeBuild
   - Follow least-privilege principle (only required permissions)
   - Grant access to S3 bucket for artifact uploads
   - Grant CloudWatch Logs write permissions for build logs
   - Properly configure trust relationship for CodeBuild service

4. **Build Logging**
   - Create CloudWatch Logs log group for build logs
   - Set log retention period to 7 days
   - Configure CodeBuild to stream logs to CloudWatch

5. **Resource Tagging**
   - Tag all resources with Environment: 'ci'
   - Tag all resources with ManagedBy: 'pulumi'

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS S3** for artifact storage with versioning enabled
- Use **AWS CodeBuild** for the build project
- Use **IAM** for service roles and policies
- Use **CloudWatch Logs** for build logging
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-environment-suffix`
- Deploy to **us-east-1** region
- All resources must be fully managed by Pulumi

### Deployment Requirements (CRITICAL)

- All resource names MUST include environmentSuffix parameter (e.g., `codebuild-project-${environmentSuffix}`)
- All resources MUST be destroyable with no retention policies or deletion protection
- S3 bucket must not have RETAIN removal policy
- CloudWatch log group must not have RETAIN removal policy
- Include proper error handling in infrastructure code
- Export stack outputs for CodeBuild project name and S3 bucket name

### Build Process Specification

The CodeBuild project must execute these commands in sequence:
1. `npm install` - Install all Node.js dependencies
2. `npm test` - Run the application test suite
3. `npm run build` - Build the application for deployment

### Constraints

- Use least-privilege IAM permissions (no wildcards or overly broad access)
- Cost-efficient compute resources (BUILD_GENERAL1_SMALL)
- Short log retention (7 days for CI builds)
- All resources must support parallel deployment testing
- No manual configuration required after deployment

## Success Criteria

- **Functionality**: CodeBuild project can successfully pull from GitHub, build Node.js apps, and store artifacts
- **Security**: IAM roles follow least-privilege with specific permissions only
- **Logging**: All build logs captured in CloudWatch with proper retention
- **Tagging**: All resources properly tagged for environment tracking
- **Resource Naming**: All resources include environmentSuffix for unique identification
- **Outputs**: CodeBuild project name and S3 bucket name exported for reference
- **Code Quality**: Clean TypeScript code with proper types and error handling
- **Destroyability**: All resources can be cleanly destroyed without manual intervention

## What to deliver

- Complete Pulumi TypeScript implementation in lib/ directory
- CodeBuild project configured with Node.js 18 runtime
- S3 bucket with versioning for artifact storage
- IAM service role with least-privilege policies
- CloudWatch Logs log group with 7-day retention
- Resource tagging for all AWS resources
- Stack outputs for project name and bucket name
- Unit tests validating all infrastructure components
- Documentation explaining the build pipeline architecture