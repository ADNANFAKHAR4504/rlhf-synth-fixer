# Infrastructure Compliance Monitoring System

Automated EC2 compliance monitoring system built with Pulumi TypeScript. Scans EC2 instances every 6 hours for required tags and security group violations, generates daily compliance reports, and sends alerts via SNS.

## Architecture

- **Scanner Lambda**: Runs every 6 hours, scans all EC2 instances for compliance violations
- **Reporter Lambda**: Runs daily at midnight UTC, aggregates scan results into JSON reports
- **S3 Bucket**: Stores scan results and reports with versioning enabled
- **CloudWatch**: Logs (30-day retention), alarms (failures and >5min duration), and dashboard
- **SNS**: Email notifications for compliance violations and Lambda failures
- **EventBridge**: Scheduled triggers for both Lambda functions

## Prerequisites

- Node.js 18+ and npm
- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create IAM roles, Lambda functions, S3 buckets, etc.

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install Lambda function dependencies:
```bash
cd lib/lambda/scanner && npm install && cd -
cd lib/lambda/reporter && npm install && cd -
```

## Configuration

Required Pulumi configuration:

```bash
# Set environment suffix (required for unique resource naming)
pulumi config set environmentSuffix <your-suffix>

# Set alert email (optional, defaults to compliance-team@example.com)
pulumi config set alertEmail your-email@example.com

# Set AWS region (optional, defaults to us-east-1)
pulumi config set aws:region us-east-1
```

## Deployment

Deploy the infrastructure:

```bash
pulumi up
```

Review the preview and confirm to deploy. Deployment creates:
- 3 S3 resources (bucket, versioning, lifecycle)
- 2 Lambda functions (scanner and reporter)
- 4 IAM resources (2 roles, 2 policies)
- 2 CloudWatch Log Groups (30-day retention)
- 6 EventBridge resources (2 rules, 2 targets, 2 permissions)
- 4 CloudWatch Alarms (failure and duration monitoring)
- 2 SNS resources (topic and email subscription)
- 1 CloudWatch Dashboard

Total: 27 resources

## Outputs

After deployment, the following outputs are available:

```bash
pulumi stack output bucketName              # S3 bucket name
pulumi stack output topicArn                # SNS topic ARN
pulumi stack output scannerFunctionName     # Scanner Lambda function name
pulumi stack output scannerFunctionArn      # Scanner Lambda function ARN
pulumi stack output reporterFunctionName    # Reporter Lambda function name
pulumi stack output reporterFunctionArn     # Reporter Lambda function ARN
pulumi stack output dashboardName           # CloudWatch dashboard name
pulumi stack output scannerLogGroupName     # Scanner logs
pulumi stack output reporterLogGroupName    # Reporter logs
```

## Usage

### Manual Testing

Invoke the scanner manually:

```bash
aws lambda invoke \
  --function-name $(pulumi stack output scannerFunctionName) \
  --payload '{}' \
  response.json
cat response.json
```

Invoke the reporter manually:

```bash
aws lambda invoke \
  --function-name $(pulumi stack output reporterFunctionName) \
  --payload '{}' \
  response.json
cat response.json
```

### Viewing Scan Results

List scan results in S3:

```bash
aws s3 ls s3://$(pulumi stack output bucketName)/scans/ --recursive
```

Download a specific scan:

```bash
aws s3 cp s3://$(pulumi stack output bucketName)/scans/2025-12-04/2025-12-04T12:00:00.000Z.json ./scan.json
```

### Viewing Daily Reports

List daily reports:

```bash
aws s3 ls s3://$(pulumi stack output bucketName)/reports/daily/
```

Download a report:

```bash
aws s3 cp s3://$(pulumi stack output bucketName)/reports/daily/2025-12-04.json ./report.json
```

### Monitoring

View CloudWatch Dashboard:

```bash
aws cloudwatch get-dashboard \
  --dashboard-name $(pulumi stack output dashboardName) \
  | jq -r '.DashboardBody' | jq .
```

View scanner logs:

```bash
aws logs tail $(pulumi stack output scannerLogGroupName) --follow
```

View reporter logs:

```bash
aws logs tail $(pulumi stack output reporterLogGroupName) --follow
```

## Compliance Checks

The scanner performs the following checks:

1. **Required Tags**: Verifies instances have Environment, Owner, and CostCenter tags
2. **Security Groups**: Detects overly permissive rules (0.0.0.0/0 access)

Violations are reported in scan results and trigger SNS email alerts.

## CloudWatch Alarms

Four alarms monitor Lambda function health:

1. **Scanner Failure Alarm**: Triggers when scanner Lambda has errors
2. **Scanner Duration Alarm**: Triggers when scanner exceeds 5 minutes
3. **Reporter Failure Alarm**: Triggers when reporter Lambda has errors
4. **Reporter Duration Alarm**: Triggers when reporter exceeds 5 minutes

All alarms send notifications to the configured SNS topic/email.

## Data Lifecycle

- **Scan Results**: Stored in `s3://bucket/scans/{date}/{timestamp}.json`
- **Daily Reports**: Stored in `s3://bucket/reports/daily/{date}.json`
- **Lifecycle Policy**: After 90 days, all objects transition to Glacier storage class
- **Versioning**: Enabled on S3 bucket for audit trail

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

Confirm the deletion when prompted. This will remove all infrastructure including:
- Lambda functions
- S3 bucket (with `forceDestroy: true`, all objects will be deleted)
- CloudWatch resources (log groups, alarms, dashboard)
- IAM roles and policies
- SNS topic and subscription
- EventBridge rules

## Troubleshooting

### SNS Email Subscription

After deployment, check your email for AWS SNS subscription confirmation. Click the confirmation link to start receiving alerts.

### Lambda Function Errors

Check CloudWatch Logs:

```bash
aws logs tail $(pulumi stack output scannerLogGroupName) --since 1h
aws logs tail $(pulumi stack output reporterLogGroupName) --since 1h
```

### No Scan Results

Verify the scanner is running:

```bash
aws lambda get-function \
  --function-name $(pulumi stack output scannerFunctionName)
```

Check EventBridge rule:

```bash
aws events list-targets-by-rule \
  --rule compliance-scanner-schedule-<environmentSuffix>
```

### Permission Issues

Verify IAM roles have correct policies attached:

```bash
aws iam list-role-policies \
  --role-name compliance-scanner-role-<environmentSuffix>
```

## Cost Considerations

Estimated monthly costs (us-east-1):

- **Lambda**: Scanner runs 4x daily (120 invocations/month), Reporter runs 1x daily (30 invocations/month)
  - Minimal cost (<$1/month for typical workloads)
- **S3**: Storage costs depend on scan volume
  - Standard storage: ~$0.023/GB/month
  - Glacier storage (after 90 days): ~$0.004/GB/month
- **CloudWatch**: Log storage (30-day retention) and alarms
  - Logs: ~$0.50/GB ingested
  - Alarms: $0.10/alarm/month ($0.40 total)
- **SNS**: Email notifications
  - First 1,000 notifications free, then $2/100,000

Total estimated cost: $2-5/month for typical usage

## Security

- **IAM Least Privilege**: Each Lambda has minimal required permissions
- **S3 Versioning**: Full audit trail for all scan results
- **CloudWatch Logs**: 30-day retention for compliance auditing
- **Encryption**: S3 uses default AWS encryption (SSE-S3)
- **No Hardcoded Credentials**: All AWS SDK clients use IAM role credentials

## Support

For issues or questions:
1. Check CloudWatch Logs for error messages
2. Verify IAM permissions are correctly configured
3. Ensure SNS subscription is confirmed
4. Review EventBridge rule schedules and targets
