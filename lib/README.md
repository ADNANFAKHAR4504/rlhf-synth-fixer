# Automated Infrastructure Compliance Monitoring System

This Pulumi TypeScript program deploys an automated infrastructure compliance monitoring system that scans AWS resources for required tags and generates compliance reports.

## Architecture

The solution includes:

- **Lambda Function**: Scans EC2 instances, RDS databases, and S3 buckets for required tags
- **CloudWatch Events**: Triggers the Lambda function every 6 hours
- **S3 Bucket**: Stores compliance reports with versioning enabled
- **SNS Topic**: Sends email notifications for non-compliant resources
- **CloudWatch Logs**: Captures Lambda execution logs with 30-day retention
- **IAM Roles**: Least-privilege policies for Lambda execution

## Required Tags

The system checks for the following tags on all resources:
- Environment
- CostCenter
- Owner

## Prerequisites

- Node.js 18.x or later
- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create Lambda, S3, SNS, CloudWatch, and IAM resources

## Installation

1. Install dependencies:

```bash
npm install
```

2. Install Lambda function dependencies:

```bash
cd lib/lambda
npm install
cd ../..
```

## Configuration

Create a Pulumi stack and set required configuration:

```bash
pulumi stack init dev
pulumi config set environmentSuffix dev-001
pulumi config set alertEmail your-email@example.com
pulumi config set aws:region us-east-1
```

### Configuration Parameters

- `environmentSuffix` (required): Unique suffix for resource names
- `alertEmail` (optional): Email address for compliance alerts (default: ops@example.com)
- `aws:region` (optional): AWS region for deployment (default: us-east-1)

## Deployment

Deploy the infrastructure:

```bash
pulumi up
```

Review the changes and confirm the deployment.

## Usage

### Manual Invocation

Trigger a compliance scan manually:

```bash
aws lambda invoke --function-name $(pulumi stack output lambdaFunctionName) output.json
cat output.json
```

### View Compliance Reports

Reports are stored in S3:

```bash
aws s3 ls s3://$(pulumi stack output reportsBucketName)/compliance-reports/
aws s3 cp s3://$(pulumi stack output reportsBucketName)/compliance-reports/scan-<timestamp>.json -
```

### Subscribe to Alerts

After deployment, confirm the SNS email subscription:

1. Check your email for a confirmation message from AWS SNS
2. Click the confirmation link to start receiving alerts

### View Logs

View Lambda execution logs:

```bash
aws logs tail $(pulumi stack output logGroupName) --follow
```

## Compliance Report Format

Compliance reports are JSON files with the following structure:

```json
{
  "timestamp": "2025-12-03T15:30:00.000Z",
  "scan_id": "scan-1701619800000",
  "summary": {
    "total_resources": 50,
    "compliant": 45,
    "non_compliant": 5
  },
  "violations": [
    {
      "resource_id": "i-1234567890abcdef0",
      "resource_type": "EC2",
      "missing_tags": ["CostCenter", "Owner"],
      "last_modified": "2025-12-01T10:00:00.000Z"
    }
  ]
}
```

## Cleanup

Remove all resources:

```bash
pulumi destroy
```

## Troubleshooting

### Lambda Timeout

If scans timeout with many resources, increase Lambda memory and timeout:

```typescript
// In index.ts
const lambdaFunction = new aws.lambda.Function(`compliance-scanner-${environmentSuffix}`, {
    // ...
    timeout: 600,  // Increase to 10 minutes
    memorySize: 1024,  // Increase memory
    // ...
});
```

### Missing Permissions

If Lambda fails with permission errors, check the IAM policy in `index.ts` and ensure it includes all necessary permissions.

### SNS Email Not Received

1. Check spam folder
2. Verify email address configuration: `pulumi config get alertEmail`
3. Check SNS subscription status in AWS Console

## Testing

Run unit tests:

```bash
npm test
```

Run integration tests:

```bash
npm run test:integration
```

## Cost Estimation

Approximate monthly costs (assuming default configuration):

- Lambda: ~$1-5 (depending on number of resources scanned)
- S3: ~$0.50 (for report storage)
- SNS: ~$0.50 (for email notifications)
- CloudWatch Logs: ~$0.50 (for log storage)

Total: ~$2-7/month

## Security Considerations

- S3 bucket uses AES-256 encryption
- IAM policies follow least-privilege principle
- Lambda function only has read access to resources
- SNS email subscriptions require confirmation
- All resources are properly tagged for compliance

## License

MIT
