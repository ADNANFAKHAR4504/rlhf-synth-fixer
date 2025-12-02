# Infrastructure Compliance Analysis System

This Pulumi TypeScript project creates an automated compliance analysis system that scans AWS infrastructure for security violations and configuration issues.

## Architecture

The system consists of:

1. **Lambda Function**: Performs compliance scans across IAM, S3, EC2, Security Groups, and CloudWatch
2. **S3 Bucket**: Stores compliance reports with versioning and encryption
3. **SNS Topic**: Sends notifications when critical findings are detected
4. **EventBridge Rule**: Triggers daily compliance scans at 2 AM UTC
5. **CloudWatch**: Tracks metrics for findings and scan performance
6. **IAM Roles**: Provides least-privilege access for Lambda execution

## Compliance Checks

1. **IAM Users**: Identifies users without MFA enabled (CRITICAL)
2. **IAM Roles**: Detects wildcard (*) permissions in policies (HIGH)
3. **S3 Buckets**: Checks for public access and missing encryption (HIGH)
4. **EC2 Instances**: Verifies required tags (Environment, Owner, CostCenter) (MEDIUM)
5. **Security Groups**: Flags rules allowing 0.0.0.0/0 access (CRITICAL)
6. **CloudWatch Logs**: Identifies log groups with retention < 90 days (MEDIUM)

## Deployment

### Prerequisites

- Node.js 18.x or later
- Pulumi CLI installed
- AWS credentials configured
- AWS account with appropriate permissions

### Deploy

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX="dev123"

# Install dependencies
npm install

# Deploy infrastructure
pulumi up
```

### Configuration

Set the environment suffix via Pulumi config or environment variable:

```bash
pulumi config set environmentSuffix dev123
# OR
export ENVIRONMENT_SUFFIX="dev123"
```

## Usage

### Manual Trigger

Invoke the Lambda function manually:

```bash
aws lambda invoke \
  --function-name compliance-scanner-dev123 \
  --payload '{}' \
  response.json
```

### View Reports

Reports are stored in S3 at:
```
s3://compliance-reports-{environmentSuffix}/compliance-reports/YYYY-MM-DD/report-{timestamp}.json
```

### Monitor Metrics

CloudWatch metrics are available in the `ComplianceScanner` namespace:
- `CriticalFindings`: Count of critical issues
- `HighFindings`: Count of high severity issues
- `MediumFindings`: Count of medium severity issues
- `ScanDuration`: Time taken for scan in milliseconds
- `ScanErrors`: Count of scan failures

## Report Format

```json
{
  "scanTimestamp": "2025-12-02T10:30:00.000Z",
  "environmentSuffix": "dev123",
  "findings": {
    "critical": [
      {
        "type": "IAM_USER_NO_MFA",
        "severity": "critical",
        "resource": "john.doe",
        "description": "IAM user 'john.doe' does not have MFA enabled",
        "remediation": "Enable MFA for this IAM user"
      }
    ],
    "high": [],
    "medium": []
  },
  "summary": {
    "critical": 1,
    "high": 0,
    "medium": 0,
    "total": 1
  },
  "scanDurationMs": 45230
}
```

## Notifications

SNS notifications are sent when critical findings are detected. Subscribe to the topic to receive alerts:

```bash
aws sns subscribe \
  --topic-arn $(pulumi stack output complianceSnsTopicArn) \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Cleanup

```bash
pulumi destroy
```

All resources will be deleted including the S3 bucket and its contents.

## Testing

The Lambda function can be tested locally by setting required environment variables:

```bash
export REPORT_BUCKET="compliance-reports-dev123"
export SNS_TOPIC_ARN="arn:aws:sns:us-east-1:123456789012:compliance-alerts-dev123"
export ENVIRONMENT_SUFFIX="dev123"

node -e "require('./lib/tap-stack').lambdaCode"
```

## Security Considerations

- Lambda execution role uses least-privilege permissions
- S3 bucket has public access blocked and encryption enabled
- All resources include environment suffix for isolation
- Reports may contain sensitive information - ensure proper access controls
- SNS topic should be secured with appropriate subscription policies

## Cost Optimization

The system uses serverless architecture to minimize costs:
- Lambda: Only charged for execution time (daily scan ~1-5 minutes)
- S3: Standard storage with versioning
- CloudWatch: Standard log retention (90 days)
- EventBridge: Minimal cost for daily trigger
- SNS: Charged per notification sent

Estimated monthly cost: $5-10 for typical usage
