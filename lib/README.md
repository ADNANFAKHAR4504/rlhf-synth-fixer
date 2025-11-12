# Infrastructure Compliance Analysis System

A comprehensive CloudFormation-based solution for monitoring infrastructure compliance across multiple AWS regions.

## Overview

This system automatically evaluates CloudFormation stacks against company policies, generates detailed compliance reports, and alerts security teams about critical violations.

## Architecture

### Components

1. **AWS Config**: Continuous compliance monitoring with custom rules
2. **Lambda Function**: Report generation and multi-region aggregation (256MB memory)
3. **S3 Bucket**: Encrypted storage for compliance reports (90-day retention)
4. **SNS Topic**: KMS-encrypted alerts for critical violations
5. **EventBridge**: Scheduled compliance checks every 6 hours
6. **CloudWatch Dashboard**: Real-time compliance metrics visualization
7. **KMS Key**: Customer-managed encryption for all data

### Compliance Rules

- **Required Tags**: Environment, Owner, CostCenter, ComplianceLevel
- **Encrypted Volumes**: All EBS volumes must be encrypted
- **S3 Encryption**: All S3 buckets must have encryption enabled
- **Security Groups**: No unrestricted access on high-risk ports (22, 3389, 3306, 5432)

## Deployment

### Prerequisites

- AWS CLI configured with appropriate permissions
- CloudFormation execution permissions
- Permissions for: Config, Lambda, S3, SNS, EventBridge, IAM, KMS, CloudWatch

### Parameters

- `EnvironmentSuffix`: Environment identifier (dev, staging, prod) - default: dev
- `ComplianceCheckSchedule`: Schedule expression - default: rate(6 hours)
- `ReportRetentionDays`: S3 lifecycle retention - default: 90 days
- `SecondaryRegions`: Comma-separated regions for multi-region analysis - default: us-west-2,eu-west-1

### Deploy Stack

```bash
aws cloudformation create-stack \
  --stack-name compliance-analysis-dev \
  --template-body file://lib/TapStack.yml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev \
    ParameterKey=SecondaryRegions,ParameterValue=us-west-2,eu-west-1 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Enable Config Recorder

After stack creation, start the Config recorder:

```bash
aws configservice start-configuration-recorder \
  --configuration-recorder-name compliance-recorder-dev \
  --region us-east-1
```

## Usage

### Subscribe to Alerts

Subscribe an email to the SNS topic:

```bash
aws sns subscribe \
  --topic-arn <ComplianceAlertTopicArn> \
  --protocol email \
  --notification-endpoint security-team@example.com
```

### Manual Compliance Check

Trigger analysis manually:

```bash
aws lambda invoke \
  --function-name compliance-analyzer-dev \
  --region us-east-1 \
  response.json

cat response.json
```

### View Reports

Access reports in S3:

```bash
aws s3 ls s3://compliance-reports-<account-id>-dev/reports/ --recursive
```

Download specific report:

```bash
aws s3 cp s3://compliance-reports-<account-id>-dev/reports/2025-11-12/compliance-20251112-120000.json .
```

### View Dashboard

Access CloudWatch dashboard through AWS Console or use the URL from stack outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name compliance-analysis-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ComplianceDashboardURL`].OutputValue' \
  --output text
```

## Report Format

Compliance reports are JSON-formatted with the following structure:

```json
{
  "report_id": "compliance-20251112-120000",
  "timestamp": "2025-11-12T12:00:00.000Z",
  "environment": "dev",
  "summary": {
    "total_violations": 15,
    "critical_violations": 3,
    "compliant_resources": 85,
    "non_compliant_resources": 15,
    "compliance_percentage": 85.0
  },
  "regions_analyzed": ["us-east-1", "us-west-2", "eu-west-1"],
  "violations": [
    {
      "rule_name": "required-tags-dev",
      "resource_id": "i-1234567890abcdef0",
      "resource_type": "AWS::EC2::Instance",
      "region": "us-east-1",
      "stack_name": "my-application-stack",
      "stack_status": "CREATE_COMPLETE",
      "annotation": "Missing required tags",
      "remediation": [
        "Add missing tags: Environment, Owner, CostCenter, ComplianceLevel",
        "Use CloudFormation stack tags to apply tags to all resources"
      ]
    }
  ],
  "critical_violations": []
}
```

## Monitoring

### CloudWatch Metrics

The system publishes metrics to the `ComplianceAnalytics` namespace:

- `TotalViolations`: Total number of compliance violations
- `CriticalViolations`: Number of critical security violations
- `CompliancePercentage`: Overall compliance rate
- `CompliantResources`: Count of compliant resources
- `NonCompliantResources`: Count of non-compliant resources

### Dashboard Widgets

1. **Violations Trend**: Time series graph showing violations over time
2. **Current Compliance Rate**: Single value widget showing current compliance percentage
3. **Resource Distribution**: Pie chart showing compliant vs non-compliant resources

### Logs

View Lambda execution logs:

```bash
aws logs tail /aws/lambda/compliance-analyzer-dev --follow
```

## Troubleshooting

### Config Recorder Not Running

Check status:
```bash
aws configservice describe-configuration-recorder-status \
  --configuration-recorder-names compliance-recorder-dev
```

Start recorder:
```bash
aws configservice start-configuration-recorder \
  --configuration-recorder-name compliance-recorder-dev
```

### Lambda Timeout Issues

If Lambda times out, consider:
- Reducing the number of secondary regions analyzed
- Increasing Lambda timeout (current: 300 seconds)
- Splitting analysis into multiple invocations

### No Reports Generated

Check EventBridge rule status:
```bash
aws events describe-rule \
  --name compliance-schedule-dev
```

Verify Lambda has correct permissions:
```bash
aws lambda get-policy \
  --function-name compliance-analyzer-dev
```

### SNS Alerts Not Received

Confirm subscription:
```bash
aws sns list-subscriptions-by-topic \
  --topic-arn <ComplianceAlertTopicArn>
```

Check subscription status (should be "Confirmed"):
```bash
aws sns get-subscription-attributes \
  --subscription-arn <SubscriptionArn>
```

## Security Considerations

- All data encrypted at rest using KMS customer-managed keys
- All data in transit uses TLS
- IAM roles follow least-privilege principle (no wildcard permissions except for Config read-only and CloudWatch metrics)
- S3 bucket blocks all public access
- SNS topic requires KMS encryption
- Lambda execution role has scoped permissions to specific resources

## Cost Optimization

- **Lambda**: 256MB memory, charged per execution (every 6 hours)
- **S3**: Lifecycle policy deletes reports after 90 days
- **Config**: Charges based on configuration items recorded and rule evaluations
- **CloudWatch**: Dashboard and metrics within free tier limits
- **EventBridge**: Rule invocations included in free tier

Estimated monthly cost for typical deployment:
- AWS Config: $10-30 (depends on resource count)
- Lambda: $1-5 (96 invocations/month)
- S3: $1-3 (storage and requests)
- KMS: $1/month (key storage)
- Total: Approximately $15-40/month

## Multi-Region Support

The system supports cross-region analysis:

1. **Primary region** (us-east-1): Where CloudFormation stack is deployed
2. **Secondary regions**: Specified via `SecondaryRegions` parameter

Lambda function creates regional AWS clients and aggregates reports from all regions into a single unified report stored in the primary region's S3 bucket.

### Adding More Regions

Update stack parameters:

```bash
aws cloudformation update-stack \
  --stack-name compliance-analysis-dev \
  --use-previous-template \
  --parameters \
    ParameterKey=EnvironmentSuffix,UsePreviousValue=true \
    ParameterKey=SecondaryRegions,ParameterValue=us-west-2,eu-west-1,ap-southeast-1 \
  --capabilities CAPABILITY_NAMED_IAM
```

## Integration Testing

Tests load stack outputs from `cfn-outputs/flat-outputs.json`:

```json
{
  "ComplianceReportsBucketName": "compliance-reports-123456789012-dev",
  "ComplianceAlertTopicArn": "arn:aws:sns:us-east-1:123456789012:compliance-alerts-dev",
  "ComplianceAnalysisFunctionArn": "arn:aws:lambda:us-east-1:123456789012:function:compliance-analyzer-dev",
  "ConfigRecorderName": "compliance-recorder-dev"
}
```

Example test validation:
```bash
# Verify bucket exists and has versioning
aws s3api get-bucket-versioning \
  --bucket compliance-reports-123456789012-dev

# Verify Lambda function configuration
aws lambda get-function-configuration \
  --function-name compliance-analyzer-dev

# Verify Config recorder is running
aws configservice describe-configuration-recorder-status \
  --configuration-recorder-names compliance-recorder-dev
```

## Cleanup

To remove all resources:

```bash
# Stop Config recorder first
aws configservice stop-configuration-recorder \
  --configuration-recorder-name compliance-recorder-dev

# Empty S3 bucket (required before stack deletion)
aws s3 rm s3://compliance-reports-<account-id>-dev --recursive

# Delete all object versions (due to versioning)
aws s3api delete-objects \
  --bucket compliance-reports-<account-id>-dev \
  --delete "$(aws s3api list-object-versions \
    --bucket compliance-reports-<account-id>-dev \
    --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}' \
    --output json)"

# Delete stack
aws cloudformation delete-stack \
  --stack-name compliance-analysis-dev

# Monitor deletion
aws cloudformation wait stack-delete-complete \
  --stack-name compliance-analysis-dev
```

## Resource Naming Convention

All resources use the `EnvironmentSuffix` parameter for uniqueness:

- KMS Key: `compliance-${EnvironmentSuffix}`
- S3 Bucket: `compliance-reports-${AccountId}-${EnvironmentSuffix}`
- SNS Topic: `compliance-alerts-${EnvironmentSuffix}`
- Lambda: `compliance-analyzer-${EnvironmentSuffix}`
- Config Recorder: `compliance-recorder-${EnvironmentSuffix}`
- IAM Roles: `config-service-role-${EnvironmentSuffix}`, `compliance-lambda-role-${EnvironmentSuffix}`
- Config Rules: `required-tags-${EnvironmentSuffix}`, etc.
- EventBridge Rule: `compliance-schedule-${EnvironmentSuffix}`
- CloudWatch Dashboard: `compliance-dashboard-${EnvironmentSuffix}`

This allows multiple environments (dev, staging, prod) to coexist in the same AWS account.

## Support and Maintenance

For issues or questions:
1. Review CloudWatch Logs for Lambda execution details
2. Check AWS Config console for rule evaluation status
3. Verify SNS topic subscriptions for alert delivery
4. Examine S3 bucket for generated reports
5. Review IAM role permissions for any access issues

## License

This infrastructure code is provided as-is for compliance monitoring purposes.
