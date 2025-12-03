# AWS Compliance Checking System (CORRECTED)

This Pulumi TypeScript project deploys an automated AWS compliance checking system. All bugs from the original implementation have been fixed.

## Bug Fixes

1. **environmentSuffix**: Added to all resource names (S3 bucket, SNS topic, Config resources, Lambda function)
2. **IAM Policy**: Corrected AWS Config policy ARN to `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
3. **Bucket Policy**: Added S3 bucket policy for AWS Config write permissions
4. **Config Rules**: Fixed source identifier to `S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED`
5. **Lambda Permissions**: Added Config read permissions to Lambda IAM role
6. **Runtime**: Upgraded Lambda to Node.js 20.x
7. **AWS SDK**: Migrated Lambda code to AWS SDK v3
8. **Error Handling**: Added comprehensive error handling in Lambda function
9. **EventBridge**: Cron expression validated (correct format)
10. **Monitoring**: Fixed CloudWatch alarm configuration

## Architecture

- **AWS Config**: Monitors S3 encryption, EC2 tagging, and IAM password policies
- **S3 Bucket**: Stores Config snapshots and compliance reports (with environmentSuffix)
- **Lambda Function**: Processes compliance results using AWS SDK v3
- **EventBridge**: Schedules Lambda daily at 2 AM UTC
- **CloudWatch**: Monitors Lambda errors and compliance violations
- **SNS**: Sends notifications for compliance issues (with environmentSuffix)

## Prerequisites

- Node.js 18.x or later
- Pulumi CLI installed
- AWS credentials configured
- AWS account with appropriate permissions

## Installation

1. Install dependencies:
   ```bash
   npm install @pulumi/pulumi @pulumi/aws @aws-sdk/client-config-service @aws-sdk/client-s3
   ```

2. Configure Pulumi:
   ```bash
   pulumi stack init dev
   pulumi config set aws:region us-east-1
   ```

3. Set environment suffix:
   ```bash
   export ENVIRONMENT_SUFFIX="dev"
   ```

## Deployment

```bash
pulumi up
```

## Outputs

- `configRecorderName`: AWS Config recorder name
- `bucketArn`: S3 bucket ARN for compliance data
- `lambdaFunctionName`: Lambda function name
- `snsTopicArn`: SNS topic ARN for notifications

## Testing

Manual Lambda trigger:
```bash
aws lambda invoke --function-name compliance-processor-${ENVIRONMENT_SUFFIX} --payload '{}' response.json
```

Subscribe to SNS notifications:
```bash
aws sns subscribe --topic-arn $(pulumi stack output snsTopicArn) --protocol email --notification-endpoint your-email@example.com
```

## Cleanup

```bash
pulumi destroy
```

## Key Improvements

- All resources include environmentSuffix for parallel deployments
- Correct IAM policies for AWS Config service role
- S3 bucket policy allows Config to write snapshots
- Lambda uses Node.js 20.x with AWS SDK v3
- Comprehensive error handling throughout
- All resources are destroyable (no retention policies)
- CloudWatch alarms properly configured
- EventBridge schedule correctly formatted
