# Multi-Stage CI/CD Pipeline Infrastructure

This CDK TypeScript project deploys a comprehensive CI/CD pipeline infrastructure with support for multiple environments, custom Lambda actions, automatic rollback, and cross-account deployments.

## Architecture Overview

The infrastructure includes:

- **CodePipeline**: Multi-stage pipelines for dev, staging, and production environments
- **CodeBuild**: Build and test projects for Node.js applications
- **S3**: Versioned artifact storage buckets
- **Lambda**: Custom pipeline actions for integration testing and rollback automation
- **SNS**: Notification topics for pipeline state changes and approvals
- **CloudWatch**: Alarms and monitoring for automatic rollback
- **IAM**: Cross-account deployment roles

## Prerequisites

- AWS CDK CLI installed (`npm install -g aws-cdk`)
- AWS credentials configured
- Node.js 18.x or later
- GitHub personal access token (stored in AWS Secrets Manager)

## Project Structure

```
lib/
├── tap-stack.ts                          # Main stack
├── constructs/
│   ├── cicd-pipeline-construct.ts        # Pipeline infrastructure
│   ├── notification-construct.ts          # SNS topics for notifications
│   └── rollback-construct.ts             # Rollback automation
└── README.md                             # This file
```

## Deployment Instructions

### 1. Store GitHub Token in Secrets Manager

```bash
aws secretsmanager create-secret \
  --name github-token \
  --description "GitHub personal access token for CodePipeline" \
  --secret-string "your-github-token-here"
```

### 2. Deploy Development Pipeline

```bash
cdk deploy TapStack-dev \
  --context environmentSuffix=dev-001 \
  --context environment=dev \
  --context sourceRepoOwner=your-github-org \
  --context sourceRepoName=your-repo
```

### 3. Deploy Staging Pipeline

```bash
cdk deploy TapStack-staging \
  --context environmentSuffix=staging-001 \
  --context environment=staging \
  --context sourceRepoOwner=your-github-org \
  --context sourceRepoName=your-repo
```

### 4. Deploy Production Pipeline

```bash
cdk deploy TapStack-prod \
  --context environmentSuffix=prod-001 \
  --context environment=prod \
  --context sourceRepoOwner=your-github-org \
  --context sourceRepoName=your-repo
```

## Configuration Parameters

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| environmentSuffix | Unique suffix for resource names | - | Yes |
| environment | Environment name (dev/staging/prod) | - | Yes |
| projectName | Project name prefix | cicd-pipeline | No |
| ownerTag | Owner tag value | devops-team | No |
| sourceRepoOwner | GitHub repository owner | example-org | No |
| sourceRepoName | GitHub repository name | example-app | No |
| sourceBranch | Git branch to track | develop/staging/main | No |
| githubTokenSecretName | Secrets Manager secret name | github-token | No |
| crossAccountRoleArn | ARN for cross-account deployments | - | No |

## Pipeline Stages

### 1. Source Stage
- Pulls source code from GitHub
- Triggered by webhook on branch push
- Outputs source artifact

### 2. Build Stage
- Installs dependencies (`npm ci`)
- Runs linting
- Builds application
- Outputs build artifact

### 3. Test Stage
- Runs unit tests
- Generates test reports
- Uses build artifact

### 4. Integration Test Stage
- Executes Lambda function for integration tests
- Custom test logic can be added
- Reports results back to CodePipeline

### 5. Approval Stage (Staging & Prod only)
- Manual approval required
- SNS notification sent to approval topic
- Prevents automatic production deployments

### 6. Deploy Stage
- Deploys application to target environment
- Supports cross-account deployment via IAM roles
- Can be customized for specific deployment targets

## Automatic Rollback

The infrastructure includes automatic rollback capabilities:

- **CloudWatch Alarms**: Monitor pipeline failures and excessive deployment duration
- **Rollback Lambda**: Automatically stops failed pipeline executions
- **SNS Notifications**: Alerts teams when rollback occurs
- **Audit Logging**: All rollback events are logged

## Cross-Account Deployment

To enable cross-account deployment:

1. Create an IAM role in the target account with trust relationship to the pipeline account
2. Grant necessary deployment permissions to the role
3. Pass the role ARN via `crossAccountRoleArn` parameter

Example trust policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::PIPELINE_ACCOUNT_ID:root"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

## Notifications

The infrastructure creates two SNS topics per environment:

1. **Pipeline State Topic**: Receives all pipeline state change events
2. **Approval Topic**: Receives approval requests for staging/prod

Subscribe email addresses or other endpoints to receive notifications:

```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:pipeline-state-ENV-SUFFIX \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Customization

### Modify Build Specifications

Edit the `buildSpec` in `cicd-pipeline-construct.ts`:
- Update Node.js version
- Add custom build commands
- Configure test frameworks
- Add deployment steps

### Add Custom Pipeline Actions

Add additional Lambda-based actions:
1. Create new Lambda function in the construct
2. Add LambdaInvokeAction to the pipeline
3. Grant necessary permissions

### Adjust Rollback Thresholds

Modify alarm thresholds in `rollback-construct.ts`:
- Change failure detection sensitivity
- Adjust deployment duration limits
- Add custom metrics

## Cleanup

To destroy all resources:

```bash
cdk destroy TapStack-dev
cdk destroy TapStack-staging
cdk destroy TapStack-prod
```

All resources are configured with `RemovalPolicy.DESTROY` and will be completely removed.

## Security Best Practices

- Store sensitive tokens in AWS Secrets Manager
- Use IAM roles with least-privilege permissions
- Enable artifact encryption (S3-managed keys)
- Implement manual approval gates for production
- Monitor pipeline activity via CloudWatch
- Regularly rotate GitHub tokens

## Troubleshooting

### Pipeline Fails to Start
- Verify GitHub token is valid and stored in Secrets Manager
- Check webhook is properly configured on GitHub repository
- Ensure IAM roles have necessary permissions

### Build Failures
- Review CodeBuild logs in CloudWatch
- Verify buildspec commands are correct
- Check Node.js version compatibility

### Deployment Failures
- Review deployment logs in CodeBuild
- Verify target account permissions (for cross-account)
- Check resource quotas in target region

## Support

For issues or questions:
- Review CloudWatch logs for detailed error messages
- Check AWS CodePipeline console for execution details
- Verify all prerequisites are met
