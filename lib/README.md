# CI/CD Pipeline Infrastructure

Complete Pulumi TypeScript implementation for a multi-stage CI/CD pipeline for Node.js microservices.

## Overview

This infrastructure provisions a comprehensive CI/CD pipeline with the following capabilities:

- Multi-stage pipeline (Source → Build → Test → Approval → Deploy)
- Branch-based deployments (main → production, develop → staging)
- Automated build and test processes
- Manual approval for production deployments
- Automated notifications for pipeline events and failures
- Encryption at rest and in transit
- Least-privilege IAM roles

## Architecture

### Components

1. **S3 Artifact Storage**
   - Versioning enabled
   - KMS encryption
   - Lifecycle policies for cleanup

2. **CodePipeline**
   - Production pipeline (main branch)
   - Staging pipeline (develop branch)
   - Manual approval stage for production

3. **CodeBuild Projects**
   - Build project for Node.js applications
   - Test project with code coverage reporting

4. **Lambda Functions**
   - Notification function for deployment events
   - Approval check function for validation

5. **SNS Topics**
   - Pipeline state change notifications
   - Failure notifications

6. **EventBridge Rules**
   - Pipeline state change monitoring
   - Failure event detection

7. **IAM Roles**
   - CodePipeline service role
   - CodeBuild service role
   - Lambda execution role

8. **KMS Encryption**
   - Encryption key for all sensitive data
   - Key rotation enabled

## Prerequisites

- AWS CLI configured with appropriate credentials
- Pulumi CLI installed
- Node.js 18.x or later
- npm or yarn package manager

## Configuration

The infrastructure uses Pulumi configuration for environment-specific values:

```bash
# Set environment suffix
pulumi config set environmentSuffix <your-suffix>

# Set AWS region (optional, defaults to us-east-1)
pulumi config set aws:region us-east-1
```

## Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Lambda Dependencies

```bash
# Install notification lambda dependencies
cd lib/lambda/notification
npm install
cd ../../..

# Install approval lambda dependencies
cd lib/lambda/approval
npm install
cd ../../..
```

### 3. Initialize Pulumi Stack

```bash
# Create a new stack
pulumi stack init <stack-name>

# Set required configuration
pulumi config set environmentSuffix <your-suffix>
```

### 4. Deploy Infrastructure

```bash
pulumi up
```

Review the changes and confirm to deploy.

### 5. Configure SNS Email Subscriptions (Optional)

After deployment, subscribe email addresses to the SNS topics:

```bash
# Get the topic ARNs from outputs
NOTIFICATION_TOPIC=$(pulumi stack output notificationTopicArn)
FAILURE_TOPIC=$(pulumi stack output failureTopicArn)

# Subscribe to notification topic
aws sns subscribe \
  --topic-arn $NOTIFICATION_TOPIC \
  --protocol email \
  --notification-endpoint team@example.com

# Subscribe to failure topic
aws sns subscribe \
  --topic-arn $FAILURE_TOPIC \
  --protocol email \
  --notification-endpoint devops@example.com
```

Confirm the subscriptions via email.

## Usage

### Triggering the Pipeline

The pipelines are configured to use S3 as the source. To trigger a pipeline:

#### Production Pipeline (main branch)

```bash
# Get the artifact bucket name
ARTIFACT_BUCKET=$(pulumi stack output artifactBucketName)

# Upload source code
zip -r main.zip .
aws s3 cp main.zip s3://$ARTIFACT_BUCKET/source/main.zip
```

#### Staging Pipeline (develop branch)

```bash
# Upload source code
zip -r develop.zip .
aws s3 cp develop.zip s3://$ARTIFACT_BUCKET/source/develop.zip
```

### Manual Approval

For production deployments, the pipeline will pause at the Approval stage. Approve or reject the deployment via:

1. AWS Console → CodePipeline → Select pipeline → Approve/Reject
2. AWS CLI:

```bash
aws codepipeline get-pipeline-state --name $(pulumi stack output productionPipelineName)
# Find the approval action token
aws codepipeline put-approval-result \
  --pipeline-name $(pulumi stack output productionPipelineName) \
  --stage-name Approval \
  --action-name ManualApproval \
  --result status=Approved,summary="Approved by DevOps"
```

## Testing

### Unit Tests

Run unit tests with mocked Pulumi resources:

```bash
npm test
```

### Integration Tests

Integration tests verify deployed resources:

```bash
# Set environment variables
export AWS_REGION=us-east-1
export ENVIRONMENT_SUFFIX=<your-suffix>

# Run integration tests
npm run test:integration
```

## Outputs

The infrastructure exports the following outputs:

| Output | Description |
|--------|-------------|
| `artifactBucketName` | S3 bucket name for pipeline artifacts |
| `productionPipelineName` | Production pipeline name |
| `stagingPipelineName` | Staging pipeline name |
| `notificationTopicArn` | SNS topic ARN for notifications |
| `failureTopicArn` | SNS topic ARN for failure notifications |
| `buildProjectName` | CodeBuild build project name |
| `testProjectName` | CodeBuild test project name |
| `notificationLambdaArn` | Notification Lambda function ARN |
| `approvalLambdaArn` | Approval check Lambda function ARN |
| `kmsKeyId` | KMS key ID for encryption |

## Monitoring

### CloudWatch Logs

All components log to CloudWatch:

- CodeBuild: `/aws/codebuild/nodejs-build-{suffix}`, `/aws/codebuild/nodejs-test-{suffix}`
- Lambda: `/aws/lambda/pipeline-notification-{suffix}`, `/aws/lambda/approval-check-{suffix}`

### Pipeline Metrics

Monitor pipeline metrics in CloudWatch:

```bash
# Get pipeline execution history
aws codepipeline list-pipeline-executions \
  --pipeline-name $(pulumi stack output productionPipelineName)
```

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

Confirm the destruction when prompted. All resources will be permanently deleted.

## Security

### Encryption

- All data at rest is encrypted using KMS
- All data in transit uses TLS/SSL
- S3 bucket has public access blocked

### IAM Roles

All IAM roles follow the principle of least privilege:

- CodePipeline role: S3, CodeBuild, SNS access
- CodeBuild role: S3, CloudWatch Logs access
- Lambda role: SNS, CodePipeline, CloudWatch Logs access

### Network Security

- Lambda functions run in AWS-managed VPC
- No public endpoints exposed

## Troubleshooting

### Pipeline Failures

1. Check CloudWatch Logs for CodeBuild projects
2. Review EventBridge rules for notification issues
3. Verify IAM role permissions

### Lambda Failures

1. Check CloudWatch Logs for Lambda functions
2. Verify environment variables are set correctly
3. Ensure SNS topics have proper permissions

### Deployment Issues

1. Verify Pulumi configuration is set correctly
2. Check AWS credentials and permissions
3. Review Pulumi state for conflicts

## Cost Optimization

The infrastructure is designed for cost efficiency:

- CodeBuild uses small compute instances
- Lambda functions are serverless (pay per invocation)
- S3 lifecycle policies clean up old artifacts
- CloudWatch Logs retention set to 30 days

Estimated monthly cost (low usage): $5-10 USD

## Best Practices

1. **Environment Suffix**: Always use unique environmentSuffix for isolated environments
2. **Email Subscriptions**: Subscribe relevant teams to SNS topics
3. **Monitoring**: Set up CloudWatch alarms for pipeline failures
4. **Testing**: Run tests before deploying to production
5. **Cleanup**: Destroy unused environments to reduce costs

## Support

For issues or questions:

1. Check CloudWatch Logs for error details
2. Review Pulumi documentation: https://www.pulumi.com/docs/
3. Check AWS service documentation

## License

MIT
