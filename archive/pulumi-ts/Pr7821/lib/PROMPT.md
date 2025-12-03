Hey team,

We need to build a CI/CD build environment for our Node.js applications using AWS CodeBuild. I've been asked to create this infrastructure using **Pulumi with TypeScript**. The business wants a complete build pipeline that can pull code from GitHub, build it, and store the artifacts securely in S3 with full logging capabilities.

The current situation is that our development team is manually building and deploying applications, which is error-prone and time-consuming. We need an automated build system that can handle our Node.js projects consistently, with proper artifact management and build monitoring. This will be our production build environment, so reliability and visibility are critical.

## What we need to build

Create a CI/CD build environment using **Pulumi with TypeScript** that automates Node.js application builds from GitHub repositories.

### Core Requirements

1. **Artifact Storage**
   - S3 bucket for storing build artifacts
   - Enable versioning on the bucket
   - Configure artifacts to be stored under a 'builds/' prefix
   - Resource name must include environmentSuffix for uniqueness

2. **Build Environment**
   - CodeBuild project configured for Node.js applications
   - Source code from GitHub repository
   - Standard AWS Linux 2 image with Node.js 18 runtime
   - Build timeout set to 15 minutes
   - Resource name must include environmentSuffix

3. **IAM Security**
   - IAM role for CodeBuild with least privilege permissions
   - Grant access to S3 bucket for artifact storage
   - Grant access to CloudWatch Logs for build output
   - Follow AWS best practices for service roles

4. **Build Monitoring**
   - CloudWatch Logs for build output
   - Log retention period of 7 days
   - Proper log group naming with environmentSuffix

5. **Build Configuration**
   - Environment variable: NODE_ENV set to production
   - Environment variable: BUILD_NUMBER from CodeBuild built-in variable
   - Artifacts stored in S3 under builds/ prefix

6. **Resource Tagging**
   - All resources tagged with Environment: production
   - All resources tagged with Team: engineering

7. **Stack Outputs**
   - Export CodeBuild project name
   - Export S3 bucket ARN

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **S3** for artifact storage with versioning
- Use **CodeBuild** for CI/CD build project
- Use **IAM** for roles and permissions
- Use **CloudWatch Logs** for build output with 7-day retention
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** parameter for unique naming
- All resources must be destroyable (no Retain deletion policies)
- No deletion protection or retain policies allowed
- Bucket names must be globally unique using environmentSuffix
- IAM role names must be unique using environmentSuffix

### Constraints

- Use least privilege for IAM permissions
- Enable S3 versioning for artifact history
- Set CloudWatch Logs retention to exactly 7 days
- Build timeout must be 15 minutes
- Use Node.js 18 runtime specifically
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging
- Follow AWS security best practices

## Success Criteria

- **Functionality**: CodeBuild project can build Node.js applications from GitHub
- **Artifact Management**: Build outputs stored in S3 with versioning
- **Security**: IAM roles follow least privilege principle
- **Monitoring**: Build logs available in CloudWatch with 7-day retention
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Tagging**: All resources properly tagged with Environment and Team
- **Code Quality**: Clean TypeScript code, well-structured, documented

## What to deliver

- Complete Pulumi TypeScript implementation
- S3 bucket with versioning for artifacts
- CodeBuild project with Node.js 18 runtime
- IAM role with appropriate permissions
- CloudWatch Logs configuration with 7-day retention
- Environment variables for NODE_ENV and BUILD_NUMBER
- Resource tags for Environment and Team
- Stack outputs for project name and bucket ARN
- Deployment instructions
