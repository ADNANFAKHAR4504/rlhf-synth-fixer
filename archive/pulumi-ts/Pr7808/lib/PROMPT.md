# CI/CD Pipeline Integration for Multi-Service Application

Hey team,

We're building a comprehensive CI/CD pipeline for our e-commerce platform that deploys containerized microservices across multiple environments. The business needs a production-grade pipeline that can handle both containerized applications and Lambda-based APIs, with proper testing gates, approval workflows, and automated rollback capabilities. This is mission-critical infrastructure that must support our growing platform reliably.

The current challenge is that we're deploying services manually across dev, staging, and production environments, which is error-prone and doesn't provide the confidence or speed we need for rapid feature delivery. We need a fully automated pipeline that can build, test, and deploy our services safely with proper monitoring and rollback mechanisms.

I've been asked to create this infrastructure using **Pulumi with TypeScript** to define all the AWS resources needed. The business wants automated deployments triggered by GitHub commits, comprehensive testing before deployment, cross-account deployment capabilities, and complete visibility into deployment status through CloudWatch and SNS notifications.

## What we need to build

Create a complete CI/CD pipeline infrastructure using **Pulumi with TypeScript** that orchestrates multi-service deployments with automated testing, manual approval gates for production, and intelligent monitoring with rollback capabilities.

### Core Requirements

1. **Pipeline Orchestration**
   - Create a CodePipeline with 5 stages: Source, Build, Test, Manual-Approval, and Deploy
   - Connect the pipeline to GitHub as the source repository using CodeStar connection
   - Configure manual approval gate before production deployment
   - Enable automatic pipeline execution on code changes

2. **Build and Test Automation**
   - Set up CodeBuild project for Docker container builds
   - Configure separate CodeBuild project for running integration tests
   - Use BUILD_GENERAL1_MEDIUM compute type for Docker builds
   - Use BUILD_GENERAL1_SMALL compute type for test execution
   - Enable Docker layer caching to speed up builds

3. **Container Image Management**
   - Create ECR repository for storing Docker images
   - Enable image scanning on push for vulnerability detection
   - Configure image lifecycle policy to retain only last 10 images
   - Enable encryption using AWS managed KMS key

4. **Lambda Deployment**
   - Deploy Lambda function for API processing (Node.js 18 runtime)
   - Configure function with 1024MB memory and 30 second timeout
   - Set reserved concurrent executions to 50
   - Deploy from ECR container image

5. **Deployment History and State**
   - Create DynamoDB table to track deployment history
   - Use 'deploymentId' as partition key and 'timestamp' as sort key
   - Enable PAY_PER_REQUEST billing mode
   - Enable point-in-time recovery for audit trail

6. **Artifact and Cache Management**
   - Configure S3 bucket for pipeline artifacts
   - Enable server-side encryption using AWS managed keys
   - Enable versioning on the bucket
   - Add lifecycle rules to delete old artifacts after 30 days
   - Configure separate S3 bucket for Docker build cache

7. **Monitoring and Alerting**
   - Create CloudWatch alarm monitoring pipeline execution failures
   - Create CloudWatch alarm monitoring Lambda function errors (threshold: 5 errors in 5 minutes)
   - Set up SNS topic for deployment notifications
   - Subscribe operations team email to SNS topic

8. **Cross-Account Deployment Role**
   - Create IAM role that can be assumed for cross-account deployments
   - Configure trust relationship with CodePipeline service
   - Attach policies for Lambda deployment and ECR access
   - Follow least privilege principle

9. **EventBridge Integration**
   - Create EventBridge rule to trigger pipeline on GitHub push events
   - Configure rule to monitor specific branch (main) for production deployments
   - Enable rule to start pipeline execution automatically

10. **Pipeline Outputs**
    - Output the pipeline ARN and console URL
    - Output the ECR repository URI for CI/CD integration
    - Output the Lambda function ARN
    - Output the deployment history table name

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **CodePipeline** for CI/CD orchestration
- Use **CodeBuild** for Docker builds and test execution
- Use **ECR** for container image storage with scanning
- Use **Lambda** for API processing (Node.js 18 runtime, container image)
- Use **DynamoDB** for deployment history tracking
- Use **S3** for artifact storage and build caching
- Use **CloudWatch** for monitoring and alarms
- Use **SNS** for deployment notifications
- Use **EventBridge** for automated pipeline triggers
- Use **IAM** for service permissions and cross-account access
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{purpose}-{environmentSuffix}`
- Deploy to **us-east-1** region
- All IAM roles must follow least privilege principle
- All resources must be destroyable (no Retain policies)

### Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: All resources MUST accept and use an environmentSuffix string parameter for unique naming across multiple deployments
- **Destroyability**: All resources must be fully destroyable - do NOT use any retention or protection policies
- **Lambda Runtime**: Use Node.js 18.x runtime with container image deployment
- **Cost Optimization**: Use appropriate compute sizes (MEDIUM for Docker builds, SMALL for tests)
- **Security**: Enable encryption for S3, ECR, and all data at rest

### Constraints

- CodePipeline must have exactly 5 stages in this order: Source, Build, Test, Manual-Approval, Deploy
- CodeBuild for Docker builds must use BUILD_GENERAL1_MEDIUM compute type
- CodeBuild for tests must use BUILD_GENERAL1_SMALL compute type
- Lambda function must have 1024MB memory and 30 second timeout
- Lambda must have reserved concurrent executions set to 50
- ECR must retain only last 10 images via lifecycle policy
- DynamoDB must use PAY_PER_REQUEST billing with point-in-time recovery enabled
- S3 buckets must have versioning enabled with 30-day lifecycle deletion rules
- CloudWatch alarm for Lambda errors must use 5 errors threshold over 5 minutes
- All IAM roles must follow least privilege principle
- All resources must support multiple environments through environmentSuffix parameter
- Include proper error handling and logging throughout

### Optional Enhancements

If time permits after completing all mandatory requirements:
- Add **AWS X-Ray** tracing to Lambda function for debugging
- Implement **CodeArtifact** repository for npm package caching
- Add **CloudWatch Logs Insights** queries for common debugging scenarios

## Success Criteria

- **Functionality**: Complete 5-stage pipeline that automatically builds, tests, and deploys containerized applications from GitHub
- **Automation**: Automated pipeline execution on code commits with manual approval for production
- **Safety**: CloudWatch alarms provide visibility into pipeline and Lambda function health
- **History**: DynamoDB table maintains complete audit trail of all deployments
- **Security**: All resources use encryption, IAM follows least privilege, ECR images are scanned
- **Cost Efficiency**: Appropriate compute types and lifecycle policies minimize costs
- **Resource Naming**: All resources include environmentSuffix for multi-environment support
- **Destroyability**: All resources can be completely removed without leaving orphaned resources
- **Code Quality**: TypeScript with proper typing, well-tested, documented

## What to deliver

- Complete **Pulumi TypeScript** implementation in the lib/ directory
- CodePipeline with 5 stages connecting GitHub to Lambda deployment
- CodeBuild projects for Docker builds and integration tests
- ECR repository with image scanning and lifecycle policies
- Lambda function deployed from container image with proper configuration
- DynamoDB table for deployment history tracking
- S3 buckets for artifacts and build cache with encryption and lifecycle management
- CloudWatch alarms monitoring pipeline and Lambda health with SNS notifications
- EventBridge rule for automated pipeline triggers
- IAM roles and policies following least privilege principle
- Cross-account deployment role with proper trust relationships
- Stack outputs for pipeline URL, ECR URI, Lambda ARN, and table name
- Comprehensive unit tests achieving 100% code coverage
- Integration tests validating deployment workflows
- Clear documentation in all required files (PROMPT.md, MODEL_RESPONSE.md, IDEAL_RESPONSE.md, MODEL_FAILURES.md)
