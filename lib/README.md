# Infrastructure Drift Detection and Analysis System

This Terraform infrastructure implements a comprehensive drift detection and analysis system for monitoring configuration drift across multiple AWS environments.

## Architecture Overview

The system consists of:

1. **S3 Buckets**: Store drift reports and AWS Config data across multiple regions
2. **DynamoDB**: Terraform state locking with point-in-time recovery
3. **AWS Config**: Track configuration changes for EC2, RDS, and S3 resources
4. **Lambda Functions**: Execute drift detection and generate reports
5. **EventBridge**: Schedule drift checks every 6 hours
6. **SNS**: Send notifications for critical drift events
7. **IAM Roles**: Cross-account access for centralized analysis
8. **CloudWatch**: Dashboards and alarms for drift metrics

## Deployment Instructions

### Prerequisites

- Terraform >= 1.4.0
- AWS CLI configured with appropriate credentials
- Node.js 18.x for Lambda function packaging

### Step 1: Prepare Lambda Function

```bash
cd lib/lambda/drift-detector
npm install
zip -r ../drift-detector.zip .
cd ../../..
```

### Step 2: Initialize Terraform

```bash
cd lib
terraform init
```

### Step 3: Configure Variables

Create a `terraform.tfvars` file:

```hcl
environment_suffix = "dev"
aws_region        = "us-east-1"
alert_email       = "your-email@example.com"
team              = "devops"
repository        = "drift-detection"
```

### Step 4: Deploy Infrastructure

```bash
terraform plan
terraform apply
```

### Step 5: Confirm SNS Email Subscription

After deployment, check your email for the SNS subscription confirmation and click the confirmation link.

## Multi-Region Deployment

This infrastructure deploys resources to three regions:
- **us-east-1** (primary): Full drift detection stack
- **us-west-2**: Drift reports storage
- **eu-central-1**: Drift reports storage

## AWS Services Used

- **S3**: Drift report storage, AWS Config storage
- **DynamoDB**: Terraform state locking
- **AWS Config**: Configuration change tracking
- **Lambda**: Drift detection execution
- **EventBridge**: Scheduled triggers
- **SNS**: Alert notifications
- **IAM**: Roles and policies for access control
- **CloudWatch**: Logs, metrics, dashboards, and alarms

## Drift Detection Process

1. **EventBridge** triggers Lambda function every 6 hours
2. **Lambda** executes drift analysis (simulates terraform plan)
3. **Lambda** generates structured JSON report
4. Report is stored in **S3** with versioning
5. If critical drift detected, **SNS** sends email notification
6. **CloudWatch** tracks metrics and displays on dashboard

## Monitoring

### CloudWatch Dashboard

Access the dashboard at:
```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=drift-metrics-<environment_suffix>
```

The dashboard shows:
- Drift check invocations
- Failed checks
- Average duration
- Alert notifications sent
- Recent drift detections (from logs)

### CloudWatch Alarms

- **drift-detection-failures**: Alerts when Lambda fails 3+ times

## Drift Reports

Reports are stored in S3 with the following structure:

```
s3://drift-reports-<environment_suffix>/
  └── drift-reports/
      └── YYYY-MM-DD/
          └── <environment>-<timestamp>.json
```

Report format:
```json
{
  "timestamp": "2025-11-20T01:00:00Z",
  "environment": "dev",
  "region": "us-east-1",
  "drift_detected": true,
  "severity": "critical",
  "resources": [
    {
      "type": "aws_s3_bucket",
      "name": "data-bucket",
      "change": "configuration modified",
      "attribute": "versioning",
      "expected": "Enabled",
      "actual": "Disabled"
    }
  ],
  "summary": {
    "total_resources": 25,
    "drifted_resources": 2,
    "drift_percentage": "8.00"
  },
  "remediation_suggestions": [
    {
      "resource": "aws_s3_bucket.data-bucket",
      "suggestion": "Update versioning from 'Disabled' back to 'Enabled'",
      "command": "terraform apply -target=aws_s3_bucket.data-bucket"
    }
  ]
}
```

## Cross-Account Access

The IAM role `cross-account-drift-<environment_suffix>` allows centralized drift analysis across multiple AWS accounts.

To assume this role from another account:

```bash
aws sts assume-role \
  --role-arn arn:aws:iam::ACCOUNT_ID:role/cross-account-drift-<environment_suffix> \
  --role-session-name drift-analysis \
  --external-id <environment_suffix>
```

## Cleanup

To destroy all resources:

```bash
cd lib
terraform destroy
```

Note: Confirm SNS subscription email before destroying to avoid orphaned subscriptions.

## Testing

### Manual Lambda Invocation

```bash
aws lambda invoke \
  --function-name drift-detector-<environment_suffix> \
  --payload '{}' \
  response.json
```

### Check Drift Reports

```bash
aws s3 ls s3://drift-reports-<environment_suffix>/drift-reports/ --recursive
```

### View CloudWatch Logs

```bash
aws logs tail /aws/lambda/drift-detector-<environment_suffix> --follow
```

## Security Considerations

- All S3 buckets use AES256 encryption
- IAM roles follow least-privilege principle
- DynamoDB has point-in-time recovery enabled
- Lambda functions log all operations to CloudWatch
- SNS topics use encryption in transit
- Cross-account access requires external ID validation

## Cost Optimization

- S3 lifecycle policies transition old reports to Glacier after 90 days
- DynamoDB uses on-demand billing
- Lambda functions have 300-second timeout to prevent runaway costs
- CloudWatch log retention set to 14 days

## Troubleshooting

### Lambda Function Failures

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/drift-detector-<environment_suffix> --since 1h
```

### SNS Notifications Not Received

1. Check SNS subscription status in AWS Console
2. Verify email confirmation was clicked
3. Check spam folder

### AWS Config Not Recording

Ensure the Config recorder is enabled:
```bash
aws configservice describe-configuration-recorder-status
```

If not enabled:
```bash
aws configservice start-configuration-recorder --configuration-recorder-name config-recorder-<environment_suffix>
```

## Support

For issues or questions, contact the DevOps team.
