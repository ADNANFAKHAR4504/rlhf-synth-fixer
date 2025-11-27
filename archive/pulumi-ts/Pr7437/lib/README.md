# CI/CD Pipeline Infrastructure

Complete AWS CI/CD pipeline infrastructure using Pulumi with TypeScript for Blue/Green deployments.

## Architecture

This infrastructure creates a full CI/CD pipeline with:

- **AWS CodePipeline**: Orchestrates the entire CI/CD workflow
- **AWS CodeBuild**: Builds and tests application code
- **AWS CodeDeploy**: Manages Blue/Green deployments with gradual traffic shifting
- **AWS Lambda**: Blue and Green deployment targets for zero-downtime releases
- **Amazon S3**: Stores pipeline artifacts with versioning and encryption
- **Amazon DynamoDB**: Tracks deployment history
- **Amazon SNS**: Sends notifications for pipeline events
- **Amazon CloudWatch**: Monitors and logs all activities

## Prerequisites

- Node.js 20.x or higher
- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- GitHub repository for source code
- GitHub personal access token

## Installation

```bash
# Install dependencies
npm install

# Build TypeScript code
npm run build

# Run linter
npm run lint

# Run tests
npm test
```

## Configuration

Set the following environment variables:

```bash
# Required
export ENVIRONMENT_SUFFIX=dev          # Unique suffix for resource names
export AWS_REGION=us-east-1           # Target AWS region

# GitHub Configuration
export GITHUB_TOKEN=<your-token>      # GitHub personal access token
export GITHUB_OWNER=<owner>           # GitHub repository owner
export GITHUB_REPO=<repo>            # GitHub repository name
export GITHUB_BRANCH=main             # Branch to monitor

# Optional metadata (auto-injected by CI/CD)
export REPOSITORY=<repo-url>
export COMMIT_AUTHOR=<author>
export PR_NUMBER=<pr-number>
export TEAM=<team-name>
```

## Deployment

### Deploy Infrastructure

```bash
# Initialize Pulumi stack
pulumi stack init dev

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up --yes

# Get stack outputs
pulumi stack output
```

### Access Resources

After deployment, outputs include:

- `pipelineUrl`: AWS Console URL for the CodePipeline
- `artifactBucketName`: S3 bucket for pipeline artifacts
- `deploymentTableName`: DynamoDB table for deployment history
- `blueLambdaArn`: ARN of the blue Lambda function
- `greenLambdaArn`: ARN of the green Lambda function

## Resource Naming

All resources include the `environmentSuffix` in their names for uniqueness:

- S3 Bucket: `pipeline-artifacts-{environmentSuffix}`
- DynamoDB Table: `deployment-history-{environmentSuffix}`
- Lambda Functions: `app-processor-blue-{environmentSuffix}`, `app-processor-green-{environmentSuffix}`
- CodePipeline: `app-pipeline-{environmentSuffix}`
- CodeBuild Project: `app-build-{environmentSuffix}`
- CodeDeploy Application: `app-deployment-{environmentSuffix}`
- IAM Roles: `{service}-service-role-{environmentSuffix}`

## Security Features

- **Encryption at Rest**: S3 (AES256), DynamoDB, and SNS use encryption
- **Encryption in Transit**: All data transfers use TLS/SSL
- **IAM Least Privilege**: Service roles have minimal required permissions
- **S3 Public Access**: Blocked at bucket level
- **CloudWatch Logging**: All Lambda functions log to CloudWatch
- **Audit Trail**: DynamoDB tracks deployment history

## Blue/Green Deployment

The pipeline implements CodeDeploy Blue/Green deployments:

1. **Source Stage**: Fetches code from GitHub
2. **Build Stage**: Runs linter, tests, and builds the application
3. **Deploy Stage**: Invokes the blue Lambda function
4. **Traffic Shift Stage**: Gradually shifts traffic from blue to green
   - Linear10PercentEvery1Minute strategy
   - Automatic rollback on failures or CloudWatch alarms

## Monitoring and Alarms

- **CloudWatch Alarms**: Monitor Lambda error rates
- **Automatic Rollback**: Triggered on alarm threshold breaches
- **SNS Notifications**: Pipeline events sent to notification topic
- **Log Retention**: 7 days for Lambda functions

## Testing

### Unit Tests

```bash
# Run unit tests with coverage
npm run test:unit
```

Unit tests use Pulumi mocks to validate:
- Stack instantiation
- Resource naming conventions
- Output registration
- Environment variable handling
- Props interface

### Integration Tests

```bash
# Deploy infrastructure first
pulumi up --yes

# Run integration tests
npm run test:integration
```

Integration tests validate:
- Stack outputs in `cfn-outputs/flat-outputs.json`
- Resource naming conventions
- ARN formats
- Blue/Green deployment setup

## Cost Optimization

The infrastructure is optimized for cost:

- **DynamoDB**: On-demand billing (PAY_PER_REQUEST)
- **CodeBuild**: Small compute instance (BUILD_GENERAL1_SMALL)
- **S3 Lifecycle**: Expires old artifact versions after 30 days
- **Lambda**: Appropriate memory (512MB) and timeout (30s) settings
- **CloudWatch**: 7-day log retention

Estimated monthly cost: $20-50 (varies with usage)

## Cleanup

To destroy all resources:

```bash
# Destroy infrastructure
pulumi destroy --yes

# Remove stack
pulumi stack rm dev --yes
```

All resources are fully destroyable with no retention policies.

## Troubleshooting

### Build Failures

Check CodeBuild logs:
```bash
aws logs tail /aws/codebuild/app-build-${ENVIRONMENT_SUFFIX} --follow
```

### Lambda Errors

Check Lambda logs:
```bash
aws logs tail /aws/lambda/app-processor-blue-${ENVIRONMENT_SUFFIX} --follow
aws logs tail /aws/lambda/app-processor-green-${ENVIRONMENT_SUFFIX} --follow
```

### Deployment Failures

Check CodeDeploy deployment status:
```bash
aws deploy list-deployments --application-name app-deployment-${ENVIRONMENT_SUFFIX}
```

## Contributing

1. Create a feature branch
2. Make changes
3. Run tests: `npm test`
4. Run linter: `npm run lint`
5. Build: `npm run build`
6. Submit pull request

## License

MIT

## Support

For issues or questions, please contact the infrastructure team.
