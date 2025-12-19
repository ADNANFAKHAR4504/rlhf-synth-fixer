# Infrastructure Quality Assurance System

Automated compliance monitoring system that scans AWS resources for tag compliance and security misconfigurations.

## Architecture

- **EC2 Tag Scanner**: Lambda function that checks EC2 instances for required tags (Environment, Owner, CostCenter)
- **S3 Security Scanner**: Lambda function that checks S3 buckets for public access violations
- **EventBridge Scheduler**: Triggers scans every 6 hours automatically
- **CloudWatch Metrics**: Custom namespace 'InfraQA/Compliance' for all compliance metrics
- **CloudWatch Alarms**: Alert when >10% of resources are non-compliant
- **CloudWatch Dashboard**: Real-time visualization of compliance status
- **SNS Notifications**: Email alerts for compliance violations
- **DynamoDB History**: Stores scan results with 30-day TTL for trend analysis

## Deployment

### Prerequisites

- Node.js 18.x or later
- Pulumi CLI installed
- AWS credentials configured

### Deploy

```bash
# Install dependencies
npm install

# Configure environment suffix
pulumi config set environmentSuffix dev

# Deploy
pulumi up
```

### Configure Email Notifications

After deployment, you need to confirm the SNS subscription:

1. Check your email for a confirmation message from AWS SNS
2. Click the confirmation link to activate notifications
3. You will receive alerts when compliance drops below 90%

## How It Works

### EC2 Tag Compliance

The EC2 scanner checks all running instances for three required tags:
- Environment
- Owner
- CostCenter

Instances missing any of these tags are flagged as non-compliant.

### S3 Security Compliance

The S3 scanner checks all buckets for:
- Public access block configuration
- Bucket ACLs allowing public access
- Public bucket policies

Buckets with public access are flagged as security violations.

### Metrics Published

All metrics are published to CloudWatch namespace 'InfraQA/Compliance':

**EC2 Metrics**:
- EC2CompliantInstances (Count)
- EC2NonCompliantInstances (Count)
- EC2CompliancePercentage (Percent)

**S3 Metrics**:
- S3SecureBuckets (Count)
- S3PublicBuckets (Count)
- S3SecurityPercentage (Percent)

### Alarms

Two CloudWatch alarms are configured:
- **ec2-compliance-alarm**: Triggers when EC2 compliance < 90%
- **s3-security-alarm**: Triggers when S3 security < 90%

Both alarms send notifications to the SNS topic.

### Compliance History

All scan results are stored in DynamoDB with:
- Resource type as partition key
- Scan timestamp as sort key
- Automatic expiration after 30 days (TTL)

## Viewing Results

### CloudWatch Dashboard

Access the dashboard in AWS Console:
1. Navigate to CloudWatch > Dashboards
2. Open `compliance-dashboard-{environmentSuffix}`
3. View real-time compliance metrics

### Query History

Use AWS CLI to query scan history:

```bash
# Query EC2 scan history
aws dynamodb query \
  --table-name compliance-history-dev \
  --key-condition-expression "resourceType = :rt" \
  --expression-attribute-values '{":rt":{"S":"EC2"}}'

# Query S3 scan history
aws dynamodb query \
  --table-name compliance-history-dev \
  --key-condition-expression "resourceType = :rt" \
  --expression-attribute-values '{":rt":{"S":"S3"}}'
```

## Manual Scan Trigger

To manually trigger a compliance scan:

```bash
# Trigger EC2 scan
aws lambda invoke \
  --function-name ec2-tag-scanner-dev \
  --invocation-type Event \
  /dev/null

# Trigger S3 scan
aws lambda invoke \
  --function-name s3-security-scanner-dev \
  --invocation-type Event \
  /dev/null
```

## Troubleshooting

### No Metrics Appearing

- Verify Lambda functions are running successfully (check CloudWatch Logs)
- Ensure IAM roles have permissions to publish metrics
- Wait for next scheduled scan (every 6 hours)

### Alarms Not Triggering

- Verify SNS subscription is confirmed
- Check alarm configuration in CloudWatch console
- Ensure sufficient data points are available

### DynamoDB Items Not Expiring

- Verify TTL is enabled on the table
- Check expirationTime attribute is set correctly
- TTL cleanup may take up to 48 hours

## Cost Optimization

This solution uses serverless services to minimize costs:
- Lambda: Pay per invocation (4 invocations per day)
- DynamoDB: On-demand billing
- CloudWatch: Minimal metrics and alarms
- SNS: Minimal notification costs

Estimated monthly cost: < $5 for typical usage

## Cleanup

To remove all resources:

```bash
pulumi destroy
```

All resources will be cleanly removed without manual intervention.
