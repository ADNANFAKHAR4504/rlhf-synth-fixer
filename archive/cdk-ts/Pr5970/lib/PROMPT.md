# Multi-Account CI/CD Pipeline for Containerized Microservices

I need to set up a complete CI/CD pipeline for our microservices application. The team wants to automate deployments across dev, staging, and production environments using AWS services.

## What We're Building

The pipeline should handle the full lifecycle: building code, running tests, creating container images, and deploying to ECS. We need approval gates between environments and automatic rollback capabilities if something goes wrong.

## Requirements

**Pipeline Stages:**
- Source: Pull code from S3 (or other source)
- Build: Compile the application
- Test: Run unit and integration tests
- Image Build: Create Docker container image
- Deploy Staging: Deploy to staging ECS cluster
- Approval: Manual approval gate with notifications
- Deploy Production: Deploy to production ECS cluster

**Infrastructure Components:**

1. **S3 Bucket** for storing pipeline artifacts
   - Enable versioning
   - Encrypt with KMS
   - Allow cross-account access for multi-account deployments

2. **ECR Repository** for custom build images
   - Store Docker images used by CodeBuild
   - Lifecycle policy to keep last 10 images

3. **CodeBuild Projects** for:
   - Building and compiling code
   - Running tests
   - Building and pushing container images
   - Use custom ECR images for build environments
   - Log to CloudWatch with 30-day retention

4. **CodePipeline** to orchestrate everything
   - Connect all stages together
   - Use S3 for artifact storage
   - Manual approval action between staging and production

5. **CodeDeploy** for ECS blue-green deployments
   - Separate applications for staging and production
   - Automatic rollback on CloudWatch alarms
   - Blue-green deployment configuration

6. **Monitoring and Alerts:**
   - CloudWatch alarms for deployment failures
   - SNS topics for notifications and approval requests
   - CloudWatch dashboard showing pipeline metrics

7. **Security:**
   - IAM roles with least-privilege permissions
   - KMS encryption for artifacts and logs
   - Cross-account support for multi-account deployments

## Technical Constraints

- Use AWS CDK v2 with TypeScript
- Region: us-east-1
- Naming convention: `{company}-{service}-{environment}-{resource}`
- All logs should have 30-day retention
- Production deployments must support automatic rollback

## Deliverables

I need two files:
- `bin/tap.ts` - CDK app entry point
- `lib/tap-stack.ts` - Complete stack implementation

The solution should be production-ready and follow AWS best practices for security, monitoring, and multi-account deployments.
