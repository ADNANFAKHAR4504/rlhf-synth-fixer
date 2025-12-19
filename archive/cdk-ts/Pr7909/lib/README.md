# AWS Config Compliance Monitoring System

Production-ready infrastructure for automated compliance monitoring using AWS Config, Lambda, SNS, and S3.

## Overview

This CDK implementation creates a comprehensive compliance monitoring system that:
- Continuously monitors AWS resource configurations using AWS Config
- Runs automated compliance checks against custom rules
- Analyzes violations and categorizes by severity
- Sends multi-level alerts via SNS topics
- Stores configuration history with lifecycle management

## Architecture

### Components

1. **AWS Config**
   - Configuration Recorder: Monitors all supported resource types
   - Delivery Channel: Sends snapshots every 6 hours
   - Custom Rules: S3 encryption, EC2 instance types, RDS backups

2. **S3 Bucket**
   - Stores configuration snapshots and compliance history
   - Lifecycle policies: IA after 30 days, Glacier after 90 days, delete after 365 days
   - Versioning and encryption enabled

3. **Lambda Function**
   - Analyzes Config evaluation results
   - Generates compliance reports
   - Routes notifications to appropriate SNS topic based on severity

4. **SNS Topics** (4 severity levels)
   - Critical: S3 encryption, RDS backup violations
   - High: Reserved for high-severity violations
   - Medium: EC2 instance type violations
   - Low: General compliance issues

5. **IAM Roles**
   - Config service role with AWS_ConfigRole managed policy
   - Lambda execution role with Config read permissions

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 18+ and npm installed
- AWS CDK CLI installed (`npm install -g aws-cdk`)

### Install Dependencies

```bash
npm install
cd lib/lambda && npm install && cd ../..
```

### Deploy

```bash
# Deploy to development environment
cdk deploy --context environmentSuffix=dev

# Deploy to production with multiple regions
cdk deploy --context environmentSuffix=prod --context regions=us-east-1,eu-west-1
```

### Subscribe to Notifications

After deployment, subscribe to SNS topics for alerts:

```bash
# Get topic ARNs from stack outputs
CRITICAL_TOPIC=$(aws cloudformation describe-stacks --stack-name TapStack --query 'Stacks[0].Outputs[?OutputKey==`CriticalTopicArn`].OutputValue' --output text)

# Subscribe email
aws sns subscribe --topic-arn $CRITICAL_TOPIC --protocol email --notification-endpoint your-email@example.com
```

## Configuration

### Environment Context

- `environmentSuffix`: Unique identifier for resources (default: 'dev')
- `regions`: List of AWS regions to enable Config (default: ['us-east-1'])

### Config Rules

1. **S3 Bucket Encryption** (CRITICAL)
   - Identifier: `S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED`
   - Checks: All S3 buckets have encryption enabled

2. **EC2 Instance Type** (MEDIUM)
   - Identifier: `DESIRED_INSTANCE_TYPE`
   - Allowed types: t3.micro, t3.small, t3.medium

3. **RDS Backup Retention** (CRITICAL)
   - Identifier: `RDS_AUTOMATIC_BACKUP_ENABLED`
   - Checks: RDS databases have automatic backups enabled

## Compliance Reports

The Lambda function generates reports containing:
- Timestamp
- Severity level
- Rule name
- Resource ID and type
- Compliance status
- Environment identifier

Reports are sent to the appropriate SNS topic based on severity.

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

## Resource Naming

All resources follow the naming pattern: `{resource-type}-{environmentSuffix}`

Examples:
- S3 Bucket: `config-snapshots-dev`
- Config Recorder: `config-recorder-dev`
- Lambda Function: `compliance-analyzer-dev`
- SNS Topics: `compliance-critical-dev`, `compliance-high-dev`, etc.

## Tags

All resources are tagged with:
- `CostCenter`: Security
- `Environment`: {environmentSuffix}
- `ComplianceLevel`: High/Medium/Low

## Monitoring

### CloudWatch Logs

Lambda function logs are available in CloudWatch Logs:
- Log Group: `/aws/lambda/compliance-analyzer-{environmentSuffix}`

### Config Dashboard

View compliance status in AWS Config console:
1. Navigate to AWS Config
2. Select "Rules" to see compliance status
3. View "Dashboard" for overall compliance summary

## Cleanup

```bash
cdk destroy --context environmentSuffix=dev
```

Note: All resources are created with `RemovalPolicy.DESTROY` for easy cleanup.

## Troubleshooting

### Config Recorder Not Starting

- Verify IAM role has `AWS_ConfigRole` managed policy
- Check S3 bucket permissions for Config service
- Ensure only one Config recorder exists per region

### Lambda Not Receiving Events

- Verify EventBridge rules are created
- Check Lambda execution role permissions
- Review CloudWatch Logs for errors

### SNS Notifications Not Received

- Confirm subscription to SNS topics
- Check email spam folder
- Verify Lambda has publish permissions to SNS topics

## Security Considerations

1. **IAM Least Privilege**: All roles use minimal required permissions
2. **Encryption**: S3 bucket uses server-side encryption
3. **Versioning**: Configuration snapshots are versioned for audit trail
4. **Tagging**: All resources tagged for cost tracking and compliance

## Cost Optimization

- Lifecycle policies reduce S3 storage costs
- Config snapshots every 6 hours (not continuous)
- Lambda timeout set to 5 minutes (adjust as needed)
- Consider limiting Config to specific resource types for lower costs

## Support

For issues or questions, contact the infrastructure team.
