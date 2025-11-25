# CI/CD Pipeline Infrastructure for Serverless Microservices

Complete Pulumi TypeScript implementation of a production-grade CI/CD pipeline with blue-green deployment capabilities for serverless payment processing microservices.

## Architecture Overview

This infrastructure creates:

1. **CodePipeline** (4 stages): Source → Build → Deploy-Blue → Switch-Traffic
2. **CodeBuild**: TypeScript compilation and Jest unit testing
3. **Lambda Functions**: Blue and Green versions with 512MB memory, Node.js 18
4. **DynamoDB**: Deployment history tracking with point-in-time recovery
5. **CodeDeploy**: Blue-green deployments with LINEAR_10PERCENT_EVERY_10MINUTES
6. **S3**: Encrypted artifact storage with versioning and lifecycle management
7. **CloudWatch**: Error rate monitoring with 5% threshold for rollback
8. **SNS**: Deployment notifications and alerts

## Prerequisites

- Pulumi CLI 3.x or higher
- Node.js 18+ and npm
- AWS CLI configured with appropriate credentials
- GitHub OAuth token for source integration

## Configuration

Set the following Pulumi config values:

```bash
# Required: GitHub OAuth token (stored as secret)
pulumi config set --secret githubToken <your-github-token>

# Optional: GitHub repository configuration
pulumi config set githubOwner <your-github-org>
pulumi config set githubRepo <your-repo-name>
pulumi config set githubBranch main
```

Set environment variables:

```bash
export ENVIRONMENT_SUFFIX=dev  # or prod, staging, etc.
export AWS_REGION=us-east-1
export TEAM=platform
```

## Deployment

Install dependencies:

```bash
npm install
```

Deploy the infrastructure:

```bash
# Preview changes
pulumi preview

# Deploy to AWS
pulumi up
```

## Pipeline Stages

### Stage 1: Source
- Connects to GitHub repository
- Monitors specified branch for changes
- Triggers pipeline on new commits

### Stage 2: Build
- Compiles TypeScript code
- Runs Jest unit tests
- Uses BUILD_GENERAL1_SMALL for cost optimization
- Stores artifacts in S3

### Stage 3: Deploy-Blue
- Deploys new version using CodeDeploy
- Implements blue-green deployment pattern
- Uses LINEAR_10PERCENT_EVERY_10MINUTES strategy
- Monitors CloudWatch alarms during deployment

### Stage 4: Switch-Traffic
- Completes traffic shift to new version
- Updates Lambda alias routing
- Records deployment in DynamoDB

## Automatic Rollback

Rollback triggers automatically when:

- Error rate exceeds 5% for 2 consecutive periods
- CloudWatch alarm enters ALARM state
- CodeDeploy detects deployment failure

## Monitoring

CloudWatch alarm monitors:
- Lambda error rates (threshold: 5%)
- Evaluation periods: 2 consecutive
- Period: 60 seconds

SNS notifications sent on:
- Deployment failures
- Alarm state changes
- Rollback events

## Resource Naming

All resources follow the pattern: `{resource-type}-{purpose}-{environmentSuffix}`

Examples:
- `pipeline-artifacts-dev`
- `deployment-history-prod`
- `payment-blue-staging`

## Cost Optimization

- CodeBuild: BUILD_GENERAL1_SMALL compute type
- DynamoDB: PAY_PER_REQUEST billing mode
- Lambda: Reserved concurrency of 100
- S3: Lifecycle rules delete old versions after 30 days

## Security

- S3 bucket encryption: AES256
- IAM roles follow least privilege principle
- No inline policies used
- Managed policies only

## Cleanup

To remove all infrastructure:

```bash
pulumi destroy
```

All resources are fully destroyable with no retain policies.

## Outputs

After deployment, the following outputs are available:

- `pipelineUrl`: Direct link to CodePipeline console
- `deploymentTableName`: DynamoDB table for deployment history

## Troubleshooting

### Build Failures
Check CodeBuild logs in CloudWatch Logs for compilation or test errors.

### Deployment Rollbacks
Review CloudWatch alarms and error metrics. Check Lambda function logs.

### GitHub Connection Issues
Verify GitHub OAuth token is valid and has required permissions.
