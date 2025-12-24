# Infrastructure Drift Detection System

A comprehensive Terraform-based solution for automated infrastructure drift detection and analysis across AWS accounts.

## Overview

This system automatically monitors Terraform-managed infrastructure for configuration drift and provides:

- Automated drift detection every 6 hours via EventBridge
- AWS Config integration for tracking EC2, RDS, and S3 changes
- Lambda-based drift analysis with detailed JSON reporting
- SNS notifications for critical drift events
- CloudWatch dashboards for monitoring and metrics visualization
- S3 storage for drift reports with versioning and lifecycle management
- DynamoDB table for Terraform state locking with point-in-time recovery

## Architecture

### Storage Layer
- **S3 Bucket (drift_reports)**: Stores drift analysis reports with versioning, encryption, and lifecycle policies (30-day IA transition, 90-day Glacier transition, 365-day expiration)
- **S3 Bucket (config)**: AWS Config delivery channel for configuration snapshots
- **DynamoDB Table**: State locking table with point-in-time recovery for Terraform operations

### Monitoring Layer
- **AWS Config Recorder**: Tracks configuration changes for EC2, RDS, and S3 resource types
- **AWS Config Rules**: 
  - EC2 instance SSM management monitoring
  - RDS storage encryption verification
  - S3 bucket versioning compliance
- **CloudWatch Dashboard**: Real-time visualization of drift metrics and Lambda performance

### Detection Layer
- **Lambda Function**: Python 3.11 runtime executing drift detection logic
  - Queries AWS Config for resource configuration changes
  - Analyzes differences between current and previous states
  - Generates structured JSON reports with severity levels
  - Publishes CloudWatch metrics
- **EventBridge Rule**: Triggers drift detection every 6 hours
- **SNS Topic**: Sends email notifications for critical drift events

### Security Layer
- **IAM Roles**: Least privilege access for Lambda and AWS Config
- **S3 Encryption**: Server-side encryption (AES256) for all stored reports
- **S3 Bucket Policies**: Block public access, enable AWS Config integration
- **CloudWatch Logs**: Centralized logging with 7-day retention

## Prerequisites

- Terraform >= 1.4.0
- AWS CLI configured with appropriate credentials
- AWS account permissions for:
  - S3 bucket creation and management
  - DynamoDB table creation
  - Lambda function deployment
  - AWS Config service configuration
  - IAM role and policy management
  - CloudWatch resources
  - SNS topic and subscription management

## Deployment

### 1. Configure Variables

Create `terraform.tfvars`:

```hcl
aws_region         = "us-east-1"
environment_suffix = "dev"
notification_email = "your-email@example.com"
repository         = "iac-test-automations"
team               = "devops"
```

### 2. Prepare Lambda Deployment Package

The Lambda function requires the drift_detector.py file packaged as a ZIP:

```bash
cd lib/lambda
python3 -m zipfile -c drift_detector.zip drift_detector.py requirements.txt
cd ../..
```

### 3. Initialize Terraform

```bash
terraform init
```

### 4. Plan Deployment

```bash
terraform plan
```

### 5. Deploy Infrastructure

```bash
terraform apply
```

### 6. Confirm SNS Subscription

After deployment:
1. Check your email for SNS subscription confirmation
2. Click the confirmation link to activate notifications

## Usage

### Manual Drift Detection

Trigger drift detection manually:

```bash
aws lambda invoke \
  --function-name drift-detector-dev \
  --payload '{}' \
  response.json

cat response.json
```

### View Drift Reports

List all drift reports:

```bash
aws s3 ls s3://drift-detection-reports-dev/drift-reports/ --recursive
```

Download a specific report:

```bash
aws s3 cp s3://drift-detection-reports-dev/drift-reports/dev/2025/01/26/120000/drift-report.json .
cat drift-report.json | jq .
```

### Monitor Drift Detection

Access CloudWatch dashboard:
1. Navigate to AWS Console > CloudWatch > Dashboards
2. Open `drift-detection-dashboard-dev`
3. Review:
   - Lambda invocation metrics
   - Error rates
   - Average execution duration
   - Drift event counts

### View Lambda Logs

```bash
aws logs tail /aws/lambda/drift-detector-dev --follow
```

Query errors:

```bash
aws logs filter-log-events \
  --log-group-name /aws/lambda/drift-detector-dev \
  --filter-pattern ERROR \
  --start-time $(date -d '1 hour ago' +%s)000
```

## Drift Report Format

Reports are generated in structured JSON format:

```json
{
  "report_metadata": {
    "generated_at": "2025-01-26T12:00:00Z",
    "environment": "dev",
    "report_version": "1.0",
    "detection_method": "aws_config_analysis"
  },
  "summary": {
    "total_drift_count": 5,
    "critical_drift_count": 2,
    "high_drift_count": 2,
    "medium_drift_count": 1,
    "low_drift_count": 0
  },
  "drift_events": [
    {
      "resource_type": "AWS::EC2::SecurityGroup",
      "resource_id": "sg-12345678",
      "resource_arn": "arn:aws:ec2:us-east-1:123456789012:security-group/sg-12345678",
      "drift_detected_at": "2025-01-26T12:00:00Z",
      "severity": "CRITICAL",
      "changes": {
        "current": {...},
        "previous": {...}
      },
      "configuration_change_time": "2025-01-26T11:55:00Z",
      "remediation": "CRITICAL: Security group rules have changed..."
    }
  ],
  "recommendations": [
    "Review all CRITICAL severity drift immediately",
    "Update Terraform configuration files to reflect desired state",
    "Run terraform plan to identify required changes"
  ]
}
```

## Notifications

### Critical Drift Alert

Sent when critical drift is detected:

```
Subject: [ALERT] Infrastructure Drift Detected - dev

CRITICAL INFRASTRUCTURE DRIFT DETECTED

Environment: dev
Detection Time: 2025-01-26T12:00:00Z

SUMMARY:
- Total Drift Events: 5
- Critical: 2
- High: 2
- Medium: 1
- Low: 0

CRITICAL RESOURCES:
- AWS::EC2::SecurityGroup: sg-12345678
  Remediation: Review security group rules...
- AWS::RDS::DBInstance: my-database
  Remediation: Database configuration drift...

Full Report: s3://drift-detection-reports-dev/drift-reports/dev/2025/01/26/120000/drift-report.json

ACTION REQUIRED: Review and remediate critical drift immediately.
```

### Error Notification

Sent when drift detection fails:

```
Subject: [ERROR] Drift Detection Failed - dev

DRIFT DETECTION FAILURE

Environment: dev
Time: 2025-01-26T12:00:00Z

ERROR:
[Error details]

ACTION REQUIRED: Investigate drift detection system failure.
```

## Cost Optimization

The system is designed for cost efficiency:

- **S3 Lifecycle Policies**: 
  - Standard storage: 0-30 days
  - Standard-IA: 30-90 days
  - Glacier: 90-365 days
  - Expiration: 365 days
- **DynamoDB**: Pay-per-request billing mode (no baseline cost)
- **Lambda**: 
  - 512MB memory allocation
  - 5-minute timeout
  - Runs every 6 hours (4 invocations/day)
- **CloudWatch Logs**: 7-day retention
- **AWS Config**: Tracks only EC2, RDS, and S3 (not all resource types)

### Estimated Monthly Cost (dev environment)
- S3 Storage: $1-2
- DynamoDB: $1
- Lambda Execution: $0.50
- AWS Config: $2-3
- CloudWatch: $1
- SNS: $0.10
- **Total: ~$5-8/month**

## Maintenance

### Update Lambda Code

1. Modify `lib/lambda/drift_detector.py`
2. Recreate deployment package:
   ```bash
   cd lib/lambda
   python3 -m zipfile -c drift_detector.zip drift_detector.py requirements.txt
   ```
3. Apply changes:
   ```bash
   terraform apply
   ```

### Adjust Detection Frequency

Modify EventBridge schedule in `main.tf`:

```hcl
schedule_expression = "rate(12 hours)"  # Change from 6 to 12 hours
```

Then apply:

```bash
terraform apply
```

### Add More Resource Types

Update `drift_detector.py`:

```python
resource_types = [
    'AWS::EC2::Instance',
    'AWS::EC2::SecurityGroup',
    'AWS::RDS::DBInstance',
    'AWS::S3::Bucket',
    'AWS::Lambda::Function',     # Add new types
    'AWS::DynamoDB::Table',
    'AWS::ECS::Cluster'
]
```

Update AWS Config recorder in `main.tf` to include new resource types:

```hcl
resource_types = [
  "AWS::EC2::Instance",
  "AWS::EC2::SecurityGroup",
  "AWS::EC2::Volume",
  "AWS::RDS::DBInstance",
  "AWS::RDS::DBSecurityGroup",
  "AWS::S3::Bucket",
  "AWS::Lambda::Function",      # Add new types
  "AWS::DynamoDB::Table"
]
```

Apply changes:

```bash
terraform apply
```

## Troubleshooting

### Lambda Execution Errors

**Symptom**: Drift detection notifications not received

**Solution**: Check CloudWatch Logs

```bash
aws logs tail /aws/lambda/drift-detector-dev --follow
```

Look for ERROR messages and verify:
- Lambda has permissions to access AWS Config
- S3 bucket is accessible
- SNS topic exists and subscription is confirmed

### AWS Config Not Recording

**Symptom**: No drift detected despite resource changes

**Solution**: Verify Config recorder status

```bash
aws configservice describe-configuration-recorder-status
```

Enable if disabled:

```bash
aws configservice start-configuration-recorder \
  --configuration-recorder-name drift-detection-recorder-dev
```

### SNS Notifications Not Received

**Symptom**: Critical drift detected but no email received

**Solution**: 
1. Verify subscription is confirmed:
   ```bash
   aws sns list-subscriptions-by-topic \
     --topic-arn $(terraform output -raw sns_topic_arn)
   ```
2. Check subscription status is "Confirmed"
3. Review Lambda logs for SNS publish errors
4. Verify email is not in spam folder

### No Drift Detected

**Symptom**: Resources changed but no drift reported

**Possible Causes**:
- AWS Config hasn't recorded the change yet (up to 10-minute delay)
- Resource type not in monitored list
- Lambda doesn't have Config read permissions
- AWS Config recorder not enabled

**Solution**:
1. Verify Config is recording:
   ```bash
   aws configservice describe-configuration-recorders
   ```
2. Check Lambda IAM permissions
3. Verify resource type is in Config recorder configuration
4. Review Lambda logs for API errors

### Lambda Timeout

**Symptom**: Lambda execution times out after 5 minutes

**Solution**: Reduce scope or increase timeout

Option 1 - Limit resource types:
```python
# In drift_detector.py, reduce resource_types list
resource_types = [
    'AWS::EC2::SecurityGroup',  # Only critical types
    'AWS::RDS::DBInstance'
]
```

Option 2 - Increase timeout in `main.tf`:
```hcl
resource "aws_lambda_function" "drift_detector" {
  # ...
  timeout = 600  # Increase to 10 minutes
  # ...
}
```

## Security Considerations

- **S3 Buckets**: Public access blocked, server-side encryption enabled
- **IAM Roles**: Least privilege principle applied
- **CloudWatch Logs**: Limited 7-day retention to minimize log data exposure
- **DynamoDB**: Point-in-time recovery enabled for data protection
- **Lambda**: No hardcoded credentials, uses IAM roles
- **SNS**: Email subscriptions require explicit confirmation

## Resource Naming Convention

All resources follow the pattern: `drift-detection-{component}-${var.environment_suffix}`

Examples:
- `drift-detection-reports-dev`
- `drift-detection-state-lock-dev`
- `drift-detector-dev`
- `drift-detection-schedule-dev`

This ensures:
- Easy identification of drift detection resources
- Support for multiple environments (dev, staging, prod)
- No naming conflicts in shared AWS accounts

## Outputs

After deployment, Terraform provides these outputs:

```bash
terraform output
```

Available outputs:
- `drift_reports_bucket`: S3 bucket for drift reports
- `drift_reports_bucket_arn`: ARN of drift reports bucket
- `config_bucket`: S3 bucket for AWS Config
- `state_lock_table`: DynamoDB table for state locking
- `state_lock_table_arn`: ARN of state lock table
- `sns_topic_arn`: SNS topic for notifications
- `lambda_function_name`: Drift detector Lambda function name
- `lambda_function_arn`: ARN of drift detector function
- `cloudwatch_log_group`: Log group for Lambda logs
- `eventbridge_rule_name`: EventBridge rule name
- `dashboard_name`: CloudWatch dashboard name
- `config_recorder_name`: AWS Config recorder name

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Important**: Empty S3 buckets before destruction:

```bash
# Empty drift reports bucket
aws s3 rm s3://drift-detection-reports-dev --recursive

# Empty config bucket
aws s3 rm s3://drift-detection-config-dev --recursive

# Now destroy
terraform destroy
```

## References

- [AWS Config Documentation](https://docs.aws.amazon.com/config/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Lambda Python Runtime](https://docs.aws.amazon.com/lambda/latest/dg/lambda-python.html)
- [EventBridge Schedule Expressions](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-rule-schedule.html)

## Support

For issues or questions:
1. Review CloudWatch Logs for Lambda errors
2. Verify AWS Config recorder status
3. Check IAM permissions for Lambda and Config roles
4. Confirm SNS subscription status
5. Review this README's Troubleshooting section
