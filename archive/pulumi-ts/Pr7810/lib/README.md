# Infrastructure Compliance Scanner

This Pulumi TypeScript project implements an automated compliance scanner for AWS infrastructure.

## Features

- Scans EC2 instances for unencrypted EBS volumes
- Checks security groups for overly permissive rules
- Verifies IAM roles have proper policies attached
- Validates EC2 instances have required tags
- Checks VPC flow logs are enabled
- Generates JSON compliance reports stored in S3
- Publishes CloudWatch metrics for monitoring

## Prerequisites

- Node.js 18+ and npm
- Pulumi CLI
- AWS credentials configured
- AWS permissions for EC2, IAM, S3, CloudWatch, Lambda

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Set environment suffix:
```bash
export ENVIRONMENT_SUFFIX=dev
pulumi config set environmentSuffix dev
```

3. Deploy the stack:
```bash
pulumi up
```

## Usage

### Manual Invocation

Invoke the Lambda function manually:
```bash
aws lambda invoke --function-name compliance-scanner-dev output.json
cat output.json
```

### Scheduled Scanning

To run compliance scans on a schedule, add an EventBridge rule:
```typescript
const rule = new aws.cloudwatch.EventRule("daily-scan", {
  scheduleExpression: "rate(1 day)",
});

const target = new aws.cloudwatch.EventTarget("target", {
  rule: rule.name,
  arn: complianceFunction.arn,
});

const permission = new aws.lambda.Permission("allow-eventbridge", {
  action: "lambda:InvokeFunction",
  function: complianceFunction.name,
  principal: "events.amazonaws.com",
  sourceArn: rule.arn,
});
```

## Report Format

Compliance reports are stored in S3 as JSON files:
```json
{
  "timestamp": "2025-12-03T19:45:00.000Z",
  "region": "us-east-1",
  "environmentSuffix": "dev",
  "summary": {
    "totalViolations": 15,
    "unencryptedVolumes": 3,
    "permissiveSecurityGroups": 5,
    "missingTags": 4,
    "iamViolations": 2,
    "missingFlowLogs": 1
  },
  "violations": {
    "unencryptedVolumes": [...],
    "permissiveSecurityGroups": [...],
    "missingTags": [...],
    "iamViolations": [...],
    "missingFlowLogs": [...]
  }
}
```

## CloudWatch Metrics

The following custom metrics are published to CloudWatch namespace `ComplianceScanner`:
- `UnencryptedVolumes`
- `PermissiveSecurityGroups`
- `MissingTags`
- `IAMViolations`
- `MissingFlowLogs`

All metrics include dimension `Environment: {environmentSuffix}`.

## Cleanup

```bash
pulumi destroy
```

## Architecture

- **Lambda Function**: Performs compliance scanning using AWS SDK v3
- **S3 Bucket**: Stores compliance reports with 90-day lifecycle
- **IAM Role**: Grants Lambda permissions for read-only scanning and report writing
- **CloudWatch Logs**: Captures Lambda execution logs (7-day retention)
- **CloudWatch Metrics**: Tracks violation counts over time

## Security

The Lambda function has read-only access to EC2, IAM, and VPC resources. Write access is limited to:
- S3 bucket (for reports)
- CloudWatch Logs (for execution logs)
- CloudWatch Metrics (for metric data)

## Testing

Run unit tests:
```bash
npm test
```

Run integration tests (requires deployed stack):
```bash
npm run test:integration
```
