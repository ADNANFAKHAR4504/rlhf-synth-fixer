# Infrastructure Compliance Monitoring System

Automated infrastructure compliance analysis system for monitoring CloudFormation stack drift, validating security policies, and alerting on non-compliant resources.

## Architecture Overview

This solution deploys:

- **AWS Config**: Continuous monitoring of resource configurations and compliance
- **Lambda Functions**: Custom compliance validation (Tag, AMI, and Drift checks)
- **S3 Buckets**: Storage for compliance reports with lifecycle management
- **EventBridge**: Event-driven compliance checks triggered by AWS Config changes
- **SNS**: Real-time notifications to security team on compliance violations
- **CloudWatch**: Dashboard for compliance metrics and Lambda function monitoring
- **Systems Manager Parameter Store**: Configuration management for approved AMIs and thresholds
- **IAM Roles**: Least privilege access for all services

## Prerequisites

- AWS CLI 2.x configured with appropriate credentials
- AWS account with permissions to create all required resources
- Valid email address for security team notifications

## Deployment

### Step 1: Validate Template

```bash
aws cloudformation validate-template --template-body file://template.json
```

### Step 2: Deploy Stack

```bash
aws cloudformation create-stack \
  --stack-name compliance-monitoring \
  --template-body file://template.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=SecurityTeamEmail,ParameterValue=security@example.com \
    ParameterKey=ApprovedAMIs,ParameterValue="ami-0c55b159cbfafe1f0,ami-0abcdef1234567890" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Step 3: Confirm SNS Subscription

After deployment, check the email address specified in `SecurityTeamEmail` parameter and confirm the SNS subscription.

### Step 4: Start AWS Config Recorder

```bash
RECORDER_NAME=$(aws cloudformation describe-stacks \
  --stack-name compliance-monitoring \
  --query 'Stacks[0].Outputs[?OutputKey==`ConfigRecorderName`].OutputValue' \
  --output text)

aws configservice start-configuration-recorder \
  --configuration-recorder-name $RECORDER_NAME \
  --region us-east-1
```

## Parameters

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| EnvironmentSuffix | Unique suffix for resource naming | dev | Yes |
| SecurityTeamEmail | Email for compliance notifications | - | Yes |
| ApprovedAMIs | Comma-separated list of approved AMI IDs | ami-0c55b159cbfafe1f0,ami-0abcdef1234567890 | No |

## Features

### 1. Tag Compliance Monitoring

Validates that all EC2 instances have required tags:
- Environment
- Owner
- CostCenter

**Schedule**: Every 6 hours
**Lambda**: `tag-compliance-{EnvironmentSuffix}`

### 2. AMI Compliance Monitoring

Ensures all EC2 instances use approved AMIs stored in Parameter Store.

**Schedule**: Every 6 hours
**Lambda**: `ami-compliance-{EnvironmentSuffix}`
**Parameter**: `/compliance/approved-amis`

### 3. CloudFormation Drift Detection

Detects configuration drift in CloudFormation stacks.

**Schedule**: Every 6 hours
**Lambda**: `drift-detection-{EnvironmentSuffix}`

### 4. AWS Config Rules

- **required-tags**: Validates presence of required tags on resources

### 5. Compliance Reports

All compliance check results are stored in S3:
- **Bucket**: `compliance-reports-{EnvironmentSuffix}`
- **Lifecycle**: Transition to Glacier after 30 days, delete after 90 days
- **Organization**: Reports organized by check type and date

### 6. CloudWatch Dashboard

View compliance metrics at:
```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=compliance-dashboard-{EnvironmentSuffix}
```

Dashboard includes:
- Lambda execution metrics
- Lambda error rates
- Recent compliance violations
- AWS Config rule evaluations

## Compliance Checks

### Real-Time Events

EventBridge triggers compliance checks on:
- AWS Config compliance state changes
- Configuration changes detected by AWS Config

### Scheduled Checks

All three Lambda functions run every 6 hours:
- 00:00, 06:00, 12:00, 18:00 UTC

## Notifications

Security team receives SNS email notifications for:
- Resources with missing required tags
- EC2 instances using unapproved AMIs
- CloudFormation stacks with detected drift
- AWS Config compliance rule violations

## Updating Approved AMIs

Update the approved AMI list in Parameter Store:

```bash
aws ssm put-parameter \
  --name "/compliance/approved-amis" \
  --value '["ami-newami1", "ami-newami2"]' \
  --type String \
  --overwrite \
  --region us-east-1
```

## Monitoring

### CloudWatch Logs

Lambda function logs are retained for 30 days:
- `/aws/lambda/tag-compliance-{EnvironmentSuffix}`
- `/aws/lambda/ami-compliance-{EnvironmentSuffix}`
- `/aws/lambda/drift-detection-{EnvironmentSuffix}`

### Compliance Reports

Access reports in S3:
```bash
aws s3 ls s3://compliance-reports-{EnvironmentSuffix}/tag-compliance/
aws s3 ls s3://compliance-reports-{EnvironmentSuffix}/ami-compliance/
aws s3 ls s3://compliance-reports-{EnvironmentSuffix}/drift-detection/
```

## Troubleshooting

### AWS Config Not Recording

Ensure the Configuration Recorder is started:
```bash
aws configservice describe-configuration-recorder-status --region us-east-1
```

If stopped, start it:
```bash
aws configservice start-configuration-recorder \
  --configuration-recorder-name config-recorder-{EnvironmentSuffix} \
  --region us-east-1
```

### Lambda Function Errors

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/tag-compliance-{EnvironmentSuffix} --follow
```

### SNS Notifications Not Received

1. Check SNS subscription status:
```bash
aws sns list-subscriptions-by-topic \
  --topic-arn $(aws cloudformation describe-stacks \
    --stack-name compliance-monitoring \
    --query 'Stacks[0].Outputs[?OutputKey==`ComplianceAlertTopicArn`].OutputValue' \
    --output text)
```

2. Confirm subscription via email if pending

## Cost Optimization

- Lambda functions: 256MB memory, ~1-2 minute execution, 4 executions/day = minimal cost
- S3: Lifecycle policies transition to Glacier after 30 days
- AWS Config: Charges for configuration items recorded and rule evaluations
- CloudWatch: 30-day log retention, basic dashboard (no charge for first 3)

## Cleanup

To delete the stack and all resources:

```bash
# Empty S3 buckets first
aws s3 rm s3://compliance-reports-{EnvironmentSuffix} --recursive
aws s3 rm s3://aws-config-bucket-{EnvironmentSuffix} --recursive

# Stop Config Recorder
aws configservice stop-configuration-recorder \
  --configuration-recorder-name config-recorder-{EnvironmentSuffix}

# Delete stack
aws cloudformation delete-stack --stack-name compliance-monitoring
```

## Security Considerations

1. **IAM Roles**: All roles follow least privilege principle
2. **S3 Buckets**: Block all public access enabled
3. **Encryption**: Server-side encryption (AES256) enabled on all S3 buckets
4. **Parameter Store**: Use SecureString type for sensitive parameters
5. **Network**: No VPC required; all services are managed AWS services

## Outputs

| Output | Description |
|--------|-------------|
| ComplianceReportBucketName | S3 bucket for compliance reports |
| ComplianceAlertTopicArn | SNS topic ARN for alerts |
| TagComplianceFunctionArn | Tag compliance Lambda function ARN |
| AMIComplianceFunctionArn | AMI compliance Lambda function ARN |
| DriftDetectionFunctionArn | Drift detection Lambda function ARN |
| ConfigRecorderName | AWS Config recorder name |
| ComplianceDashboardURL | CloudWatch dashboard URL |

## Support

For issues or questions:
1. Check CloudWatch Logs for Lambda function errors
2. Verify AWS Config is recording
3. Confirm SNS subscription is active
4. Review compliance reports in S3
