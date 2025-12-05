# S3 Compliance Analysis Tool

A Pulumi TypeScript implementation for analyzing S3 bucket compliance across an AWS account.

## Features

- Analyzes all S3 buckets in a specified region
- Checks compliance against 5 key requirements:
  - Versioning enabled
  - Server-side encryption (AES256 or KMS)
  - Lifecycle policies for objects older than 90 days
  - No public access
  - CloudWatch metrics configuration
- Tags non-compliant buckets with 'compliance-status: failed'
- Sends notifications for high-severity violations (3+ violations)
- Generates compliance reports as stack outputs and JSON files
- CloudWatch alarms for monitoring
- Step Functions for orchestration
- Lambda for compliance checking logic
- SQS for result queuing
- SNS for notifications

## Prerequisites

- Node.js 18+
- Pulumi CLI
- AWS CLI configured with appropriate credentials
- AWS account with existing S3 buckets

## Deployment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Pulumi stack:
   ```bash
   pulumi stack init dev
   pulumi config set environmentSuffix <your-unique-suffix>
   pulumi config set region us-east-1
   ```

3. Deploy the stack:
   ```bash
   pulumi up
   ```

4. Trigger compliance check:
   ```bash
   aws stepfunctions start-execution \
     --state-machine-arn $(pulumi stack output stateMachineArn) \
     --input '{}'
   ```

## Configuration

- `environmentSuffix`: Unique suffix for resource naming (required)
- `region`: Target AWS region (default: us-east-1)

## Compliance Checks

1. **Versioning**: Ensures bucket versioning is enabled
2. **Encryption**: Verifies server-side encryption with AES256 or AWS KMS
3. **Lifecycle**: Checks for lifecycle policies for objects older than 90 days
4. **Public Access**: Validates bucket policies don't allow public access
5. **CloudWatch Metrics**: Confirms CloudWatch metrics configuration

## Outputs

- `snsTopicArn`: SNS topic for notifications
- `sqsQueueUrl`: SQS queue for compliance results
- `lambdaFunctionArn`: Lambda function ARN
- `stateMachineArn`: Step Functions state machine ARN
- `complianceAlarmArn`: CloudWatch alarm ARN

## Testing

Run unit tests:
```bash
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

## Cleanup

```bash
pulumi destroy
```
