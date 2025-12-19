# CI/CD Pipeline Infrastructure for Serverless Microservices

Hey team,

We need to build a production-grade CI/CD pipeline for our fintech startup's payment processing microservices. The business wants a fully automated deployment system that can handle blue-green deployments with automatic rollback capabilities, and it needs to integrate seamlessly with our GitHub repository structure. This is critical infrastructure that will support our payment processing services, so reliability and automation are top priorities.

The current challenge is that we're manually deploying our serverless microservices, which is error-prone and doesn't give us the confidence we need for a payment processing system. We need proper automated testing in the pipeline, safe deployment mechanisms that can roll back automatically if something goes wrong, and full visibility into our deployment history.

I've been asked to create this infrastructure using **Pulumi with TypeScript** to define all the AWS resources we need. The business specifically wants blue-green deployment capability so we can switch traffic safely between versions, automated testing that runs before any deployment, and CloudWatch monitoring that can trigger automatic rollbacks if error rates spike.

## What we need to build

Create a complete CI/CD pipeline infrastructure using **Pulumi with TypeScript** that orchestrates serverless microservice deployments with blue-green deployment patterns, automated testing, and intelligent rollback mechanisms.

### Core Requirements

1. **Pipeline Orchestration**
   - Create a CodePipeline with exactly 4 stages: Source, Build, Deploy-Blue, and Switch-Traffic
   - Connect the pipeline to GitHub as the source repository
   - Configure proper stage transitions and approval gates where needed

2. **Build and Test Automation**
   - Set up CodeBuild project for TypeScript compilation
   - Integrate Jest unit tests into the build process
   - Use BUILD_GENERAL1_SMALL compute type for cost optimization

3. **Blue-Green Lambda Deployment**
   - Deploy two Lambda functions (blue and green versions)
   - Configure each with 512MB memory and Node.js 18 runtime
   - Set reserved concurrent executions to 100 for both functions
   - Note: Node.js 18+ requires AWS SDK v3 - ensure proper imports in Lambda code

4. **Deployment History Tracking**
   - Create DynamoDB table to store deployment metadata
   - Use 'deploymentId' as partition key
   - Enable PAY_PER_REQUEST billing mode
   - Enable point-in-time recovery for data protection

5. **Automated Blue-Green Deployments**
   - Implement CodeDeploy application for Lambda deployments
   - Use LINEAR_10PERCENT_EVERY_10MINUTES deployment configuration
   - Configure automatic rollback on deployment failures
   - Integrate with CloudWatch alarms for health-based rollbacks

6. **Artifact Management**
   - Configure S3 bucket for pipeline artifacts
   - Enable server-side encryption using AWS managed keys
   - Enable versioning on the bucket
   - Add lifecycle rules to delete old versions after 30 days

7. **Monitoring and Alerting**
   - Create CloudWatch alarm monitoring Lambda error rates
   - Trigger rollback if error rate exceeds 5% for 2 consecutive periods
   - Set up SNS topic for deployment notifications
   - Send alerts to the operations team on failures

8. **Pipeline Outputs**
   - Output the pipeline execution URL for team access
   - Output the deployment status table name for reference

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **CodePipeline** for CI/CD orchestration
- Use **CodeBuild** for compilation and testing
- Use **Lambda** for blue-green deployments (Node.js 18 runtime)
- Use **DynamoDB** for deployment history storage
- Use **CodeDeploy** for blue-green deployment automation
- Use **S3** for artifact storage with encryption
- Use **CloudWatch** for monitoring and alarms
- Use **SNS** for deployment notifications
- Use **IAM** for service permissions
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{purpose}-{environmentSuffix}`
- Deploy to **us-east-1** region
- All IAM roles must follow least privilege principle with no inline policies
- All resources must be destroyable (no Retain policies)

### Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: All resources MUST accept and use an environmentSuffix string parameter for unique naming across multiple deployments
- **Destroyability**: All resources must be fully destroyable - do NOT use RemovalPolicy.RETAIN or DeletionPolicy: Retain
- **Lambda Runtime**: Use Node.js 18.x which requires AWS SDK v3 (not the legacy aws-sdk package)
- **Cost Optimization**: Use smallest compute sizes where possible (BUILD_GENERAL1_SMALL for CodeBuild)

### Constraints

- CodePipeline must have exactly 4 stages in this order: Source, Build, Deploy-Blue, Switch-Traffic
- CodeBuild compute type must be BUILD_GENERAL1_SMALL for cost efficiency
- Lambda functions must have reserved concurrent executions set to 100
- DynamoDB must use PAY_PER_REQUEST billing with point-in-time recovery enabled
- CodeDeploy must use LINEAR_10PERCENT_EVERY_10MINUTES configuration
- S3 buckets must have versioning enabled with 30-day lifecycle deletion rules
- CloudWatch alarms must use 5% error threshold for 2 consecutive periods
- All IAM roles must use managed policies only, no inline policies allowed
- All resources must support multiple environments through Pulumi stacks
- Include proper error handling and logging throughout

### Optional Enhancements

If time permits after completing all mandatory requirements:
- Add **CodeArtifact** repository for npm package caching to reduce build times
- Implement **EventBridge** rule to trigger pipeline on git tags for tag-based releases
- Add **X-Ray** tracing to Lambda functions for improved deployment debugging

## Success Criteria

- **Functionality**: Complete 4-stage pipeline that automatically builds, tests, and deploys code from GitHub to Lambda using blue-green deployment pattern
- **Automation**: Zero manual intervention required from code commit to production deployment
- **Safety**: Automatic rollback triggers when error rates exceed threshold or deployments fail
- **Observability**: CloudWatch alarms and SNS notifications provide visibility into deployment health
- **History**: DynamoDB table maintains complete audit trail of all deployments
- **Security**: All IAM roles follow least privilege with managed policies only
- **Cost Efficiency**: Smallest compute types used where appropriate
- **Resource Naming**: All resources include environmentSuffix for multi-environment support
- **Destroyability**: All resources can be completely removed without leaving orphaned resources
- **Code Quality**: TypeScript with proper typing, well-tested, documented

## What to deliver

- Complete **Pulumi TypeScript** implementation in the lib/ directory
- CodePipeline with 4 stages connecting GitHub to Lambda deployment
- CodeBuild project with TypeScript compilation and Jest testing
- Two Lambda functions (blue and green) with Node.js 18 runtime
- DynamoDB table for deployment history tracking
- CodeDeploy application with LINEAR_10PERCENT_EVERY_10MINUTES deployment
- S3 bucket for artifacts with encryption and lifecycle management
- CloudWatch alarm monitoring error rates with SNS notifications
- IAM roles and policies following least privilege principle
- Stack outputs for pipeline URL and table name
- Clear documentation in README.md with deployment instructions
- Proper error handling and logging throughout the infrastructure
