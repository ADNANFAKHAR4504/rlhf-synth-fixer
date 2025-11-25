# Security Compliance Monitoring Infrastructure

This Pulumi TypeScript program deploys an automated infrastructure compliance scanning system for AWS, designed to meet SOC2 requirements.

## Architecture Overview

The system consists of the following components:

1. **AWS Config** - Continuously records configuration changes for EC2, RDS, and S3 resources
2. **Lambda Function** - Analyzes Config snapshots and detects non-compliant resources using predefined rules
3. **DynamoDB Table** - Stores compliance scan results with partition key 'resourceId' and sort key 'timestamp'
4. **S3 Bucket** - Stores Config delivery data with AES256 encryption, versioning, and intelligent tiering
5. **EventBridge Rules** - Triggers compliance scans every 6 hours and on Config changes
6. **SNS Topic** - Sends notifications for critical compliance violations
7. **CloudWatch Dashboard** - Displays compliance metrics and recent violations
8. **CloudWatch Alarms** - Monitors Lambda function health
9. **Dead Letter Queue** - Captures failed Lambda executions for troubleshooting

## Prerequisites

- Node.js 18.x or higher
- Pulumi CLI 3.x or higher
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create the required resources

## Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Variables

```bash
export ENVIRONMENT_SUFFIX="dev"  # or prod, staging, etc.
export AWS_REGION="us-east-1"
```

### 3. Deploy the Stack

```bash
pulumi up
```

This will:
- Create all infrastructure resources
- Set up AWS Config recording for EC2, RDS, and S3
- Deploy the Lambda function with compliance rules
- Configure EventBridge schedules and event-driven triggers
- Create the CloudWatch dashboard and alarms

### 4. Verify Deployment

After deployment, you can verify the setup:

```bash
# Check Config recorder status
aws configservice describe-configuration-recorder-status

# Check Lambda function
aws lambda get-function --function-name compliance-analyzer-<suffix>

# View CloudWatch dashboard
aws cloudwatch get-dashboard --dashboard-name compliance-dashboard-<suffix>
```

## Configuration

### Environment Variables

- `ENVIRONMENT_SUFFIX` - Suffix for resource names (default: 'dev')
- `AWS_REGION` - AWS region for deployment (default: 'us-east-1')
- `REPOSITORY` - Repository name for tagging
- `COMMIT_AUTHOR` - Commit author for tagging
- `PR_NUMBER` - Pull request number for tagging
- `TEAM` - Team name for tagging

### Compliance Rules

The Lambda function includes built-in compliance rules for:

**S3 Buckets:**
- Encryption must be enabled
- Versioning must be enabled

**EC2 Instances:**
- Detailed monitoring must be enabled
- Root volume must be encrypted

**RDS Instances:**
- Encryption at rest must be enabled
- Backup retention period must be at least 7 days
- Multi-AZ deployment must be enabled

You can modify these rules by updating the `COMPLIANCE_RULES` object in the Lambda function code.

## Outputs

The stack exports the following outputs:

- `configBucketName` - Name of the S3 bucket for Config delivery
- `complianceTableName` - Name of the DynamoDB table storing compliance results
- `complianceFunctionArn` - ARN of the Lambda function
- `snsTopicArn` - ARN of the SNS topic for critical violations
- `dashboardName` - Name of the CloudWatch dashboard

## Monitoring

### CloudWatch Dashboard

Access the dashboard in the AWS Console:
1. Navigate to CloudWatch > Dashboards
2. Select `compliance-dashboard-<suffix>`

The dashboard displays:
- Lambda function invocations, errors, and duration
- DynamoDB read/write capacity consumption
- Recent compliance violations from logs

### SNS Notifications

Subscribe to the SNS topic to receive alerts:

```bash
aws sns subscribe \
  --topic-arn <snsTopicArn> \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Cost Optimization

This implementation uses cost-optimized configurations:

- DynamoDB on-demand billing (pay per request)
- S3 intelligent tiering (automatic cost optimization)
- Lambda with appropriate memory allocation (256MB)
- Config recording limited to specific resource types
- S3 lifecycle policies to delete old versions after 90 days

## Security Considerations

- All S3 buckets use AES256 encryption
- Lambda functions use IAM roles with least-privilege permissions
- X-Ray tracing enabled for observability
- Dead letter queues for error handling
- AWS Config uses the AWS managed policy `AWS_ConfigRole`

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

Note: All resources are configured to be fully destroyable without manual intervention.

## Troubleshooting

### Lambda Function Errors

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/compliance-analyzer-<suffix> --follow
```

Check Dead Letter Queue:
```bash
aws sqs receive-message --queue-url <dlq-url>
```

### Config Recording Issues

Check Config status:
```bash
aws configservice describe-configuration-recorder-status
```

Check delivery channel:
```bash
aws configservice describe-delivery-channels
```

## Testing

To manually trigger a compliance scan:

```bash
aws lambda invoke \
  --function-name compliance-analyzer-<suffix> \
  --payload '{}' \
  response.json
```

View the results in DynamoDB:

```bash
aws dynamodb scan --table-name compliance-results-<suffix>
```

## Support

For issues or questions, please refer to:
- [Pulumi Documentation](https://www.pulumi.com/docs/)
- [AWS Config Documentation](https://docs.aws.amazon.com/config/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
