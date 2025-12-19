# Infrastructure Compliance Scanning System

Automated compliance scanning infrastructure using AWS Config, Lambda, DynamoDB, and S3 with Pulumi Python.

## Overview

This system implements continuous compliance monitoring for AWS resources including EC2, RDS, S3, and IAM. The architecture evaluates resources every 6 hours against custom compliance rules, maintains historical evaluation data, sends alerts for violations, and generates detailed audit reports.

## Architecture Components

### Monitoring Infrastructure
- **SNS Topic**: Sends email alerts for compliance violations
- **DynamoDB Table**: Stores compliance evaluation history
  - Partition key: `resource_id` (string)
  - Sort key: `evaluation_timestamp` (string)
  - Point-in-time recovery enabled
- **S3 Buckets**:
  - Config delivery bucket (versioned, AES-256 encrypted)
  - Compliance reports bucket (versioned, AES-256 encrypted)

### Compliance Rules
- **EC2 Tag Compliance**: Validates instances have required tags (Environment, Owner, CostCenter)
- **S3 Encryption Compliance**: Ensures buckets have server-side encryption enabled
- **RDS Backup Compliance**: Verifies instances have automated backups configured (retention > 0)

### AWS Config Integration
- Configuration recorder tracking EC2, RDS, S3, IAM resources
- Delivery channel to S3 for Config snapshots
- Custom Config rules invoking Lambda functions
- IAM role with AWS_ConfigRole managed policy

### Scheduled Evaluations
- CloudWatch Events rule: `cron(0 */6 * * ? *)`
- Triggers all compliance Lambda functions every 6 hours
- Report aggregator generates JSON summaries

## Prerequisites

- Python 3.9+
- Pulumi CLI 3.x
- AWS credentials configured
- Environment variable `ENVIRONMENT_SUFFIX` (defaults to 'dev')

## Deployment

### Install Dependencies

```bash
# Install Pulumi dependencies
pip install -r requirements.txt
```

### Configure Environment

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX=dev

# Set AWS region (optional, defaults to us-east-1)
export AWS_REGION=us-east-1
```

### Deploy Infrastructure

```bash
# Preview changes
pulumi preview

# Deploy stack
pulumi up

# Confirm with 'yes' when prompted
```

### View Outputs

```bash
# Get stack outputs
pulumi stack output

# Example outputs:
# config_recorder_name: config-recorder-dev
# dynamodb_table_name: compliance-history-dev
# sns_topic_arn: arn:aws:sns:us-east-1:...:compliance-alerts-dev
# reports_bucket_name: compliance-reports-dev-abc123
```

## Resource Naming

All resources include environmentSuffix for multi-environment support:

| Resource Type | Naming Pattern | Example |
|--------------|----------------|---------|
| SNS Topic | `compliance-alerts-{suffix}` | compliance-alerts-dev |
| DynamoDB Table | `compliance-history-{suffix}` | compliance-history-dev |
| Config Bucket | `config-delivery-{suffix}` | config-delivery-dev |
| Reports Bucket | `compliance-reports-{suffix}` | compliance-reports-dev |
| Lambda Functions | `{rule}-checker-{suffix}` | ec2-tag-checker-dev |
| Config Recorder | `config-recorder-{suffix}` | config-recorder-dev |
| IAM Roles | `{service}-role-{suffix}` | ec2-tag-checker-role-dev |

## Compliance Evaluation Flow

1. **CloudWatch Events** triggers Lambda functions every 6 hours
2. **Lambda functions** query AWS APIs for resource compliance
3. **Evaluation results** stored in DynamoDB with timestamp
4. **SNS notifications** sent for non-compliant resources
5. **Report aggregator** scans DynamoDB and generates summary
6. **JSON report** stored in S3 with timestamp

## Compliance Reports

Reports are generated every 6 hours and stored in S3:

### Report Format

```json
{
  "report_timestamp": "2025-12-02T10:00:00Z",
  "summary": {
    "total_resources": 50,
    "total_evaluations": 150,
    "compliant": 120,
    "non_compliant": 30,
    "compliance_percentage": 80.0
  },
  "by_resource_type": {
    "AWS::EC2::Instance": {
      "total": 50,
      "compliant": 40,
      "non_compliant": 10
    },
    "AWS::S3::Bucket": {
      "total": 30,
      "compliant": 25,
      "non_compliant": 5
    },
    "AWS::RDS::DBInstance": {
      "total": 20,
      "compliant": 15,
      "non_compliant": 5
    }
  },
  "by_rule": {
    "ec2-required-tags": {
      "total": 50,
      "compliant": 40,
      "non_compliant": 10
    },
    "s3-encryption-enabled": {
      "total": 30,
      "compliant": 25,
      "non_compliant": 5
    },
    "rds-backup-enabled": {
      "total": 20,
      "compliant": 15,
      "non_compliant": 5
    }
  },
  "evaluations": [
    {
      "resource_id": "i-1234567890abcdef0",
      "evaluation_timestamp": "2025-12-02T10:00:00Z",
      "compliance_type": "NON_COMPLIANT",
      "resource_type": "AWS::EC2::Instance",
      "missing_tags": "[\"CostCenter\"]",
      "rule": "ec2-required-tags"
    }
  ]
}
```

### Accessing Reports

```bash
# List reports
aws s3 ls s3://compliance-reports-{suffix}/

# Download latest report
aws s3 cp s3://compliance-reports-{suffix}/compliance-report-20251202-100000.json ./
```

## SNS Alerts

Non-compliant resources trigger SNS notifications:

### Alert Format

```
Subject: EC2 Tag Compliance Violation

EC2 Tag Compliance Alert

Found 3 non-compliant EC2 instances:

Instance: i-1234567890abcdef0
Missing Tags: CostCenter, Owner

Instance: i-0987654321fedcba0
Missing Tags: Environment

Instance: i-abcdef1234567890
Missing Tags: CostCenter
```

### Subscribe to Alerts

1. Confirm SNS subscription email (sent automatically)
2. Additional subscriptions:

```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:...:compliance-alerts-dev \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## IAM Permissions

All Lambda functions use least-privilege IAM roles:

### EC2 Tag Checker
- `ec2:DescribeInstances`
- `ec2:DescribeTags`
- `dynamodb:PutItem` (compliance-history table)
- `sns:Publish` (compliance-alerts topic)
- CloudWatch Logs

### S3 Encryption Checker
- `s3:GetEncryptionConfiguration`
- `s3:ListAllMyBuckets`
- `dynamodb:PutItem`
- `sns:Publish`
- CloudWatch Logs

### RDS Backup Checker
- `rds:DescribeDBInstances`
- `dynamodb:PutItem`
- `sns:Publish`
- CloudWatch Logs

### Report Aggregator
- `dynamodb:Query`
- `dynamodb:Scan` (compliance-history table)
- `s3:PutObject` (reports bucket)
- CloudWatch Logs

### AWS Config Role
- `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole` (managed policy)
- `s3:GetBucketVersioning`, `s3:PutObject`, `s3:GetObject` (config bucket)

## Testing

### Run Unit Tests

```bash
# Run all tests
pytest tests/

# Run with coverage
pytest --cov=lib tests/

# Run specific test file
pytest tests/test_monitoring_stack.py
```

### Manual Compliance Check

Trigger Lambda functions manually:

```bash
# Invoke EC2 tag checker
aws lambda invoke \
  --function-name ec2-tag-checker-dev \
  --payload '{}' \
  response.json

# Invoke report aggregator
aws lambda invoke \
  --function-name report-aggregator-dev \
  --payload '{}' \
  response.json
```

## Monitoring

### CloudWatch Logs

Lambda execution logs:
```bash
# View EC2 tag checker logs
aws logs tail /aws/lambda/ec2-tag-checker-dev --follow

# View report aggregator logs
aws logs tail /aws/lambda/report-aggregator-dev --follow
```

### DynamoDB Query

Query compliance history:

```bash
# Query specific resource
aws dynamodb query \
  --table-name compliance-history-dev \
  --key-condition-expression "resource_id = :rid" \
  --expression-attribute-values '{":rid":{"S":"i-1234567890abcdef0"}}'

# Scan recent evaluations
aws dynamodb scan \
  --table-name compliance-history-dev \
  --limit 10
```

### AWS Config Console

View Config recorder status:
```bash
aws configservice describe-configuration-recorders
aws configservice describe-configuration-recorder-status
aws configservice describe-config-rules
```

## Troubleshooting

### Config Recorder Not Starting

```bash
# Check IAM role permissions
aws iam get-role --role-name config-role-dev
aws iam list-attached-role-policies --role-name config-role-dev

# Verify S3 bucket exists
aws s3 ls s3://config-delivery-dev/

# Check delivery channel
aws configservice describe-delivery-channels
```

### Lambda Permissions Issues

```bash
# Check Lambda execution role
aws iam get-role --role-name ec2-tag-checker-role-dev

# View inline policies
aws iam list-role-policies --role-name ec2-tag-checker-role-dev
aws iam get-role-policy --role-name ec2-tag-checker-role-dev --policy-name ec2-tag-checker-role-dev-policy

# Test Lambda locally
cd lib/lambda/ec2_tag_checker
python -m pytest
```

### No Reports Generated

```bash
# Check DynamoDB has data
aws dynamodb scan --table-name compliance-history-dev --limit 5

# Verify report aggregator executed
aws logs filter-log-events \
  --log-group-name /aws/lambda/report-aggregator-dev \
  --filter-pattern "Report generated"

# Check S3 bucket permissions
aws s3api get-bucket-policy --bucket compliance-reports-dev
```

## Cleanup

Destroy all resources:

```bash
# Preview resources to be deleted
pulumi destroy --preview

# Destroy stack
pulumi destroy

# Confirm with 'yes' when prompted
```

All resources are configured for destroyability (no Retain policies).

## Resource Tags

All resources are tagged with:
- `Environment: Production`
- `Compliance: Required`
- `ManagedBy: Pulumi`

## Security Considerations

- SNS topic uses email protocol (consider using SQS for automation)
- S3 buckets use AES-256 encryption (consider KMS for enhanced security)
- Lambda functions have least-privilege IAM roles
- DynamoDB has point-in-time recovery enabled
- Config recorder IAM role uses AWS managed policy
- No public access to S3 buckets

## Cost Optimization

- DynamoDB uses on-demand pricing (PAY_PER_REQUEST)
- Lambda timeout: 300 seconds (5 minutes)
- S3 lifecycle policies not configured (consider for old reports)
- Config recording limited to specific resource types
- CloudWatch Events runs every 6 hours (adjust if needed)

## Compliance Standards

This system helps meet requirements for:
- SOC 2 (continuous monitoring)
- ISO 27001 (security controls)
- PCI DSS (configuration management)
- HIPAA (audit logging)
- GDPR (data protection controls)

## Support

For issues or questions:
1. Check CloudWatch Logs for Lambda errors
2. Verify AWS Config recorder status
3. Review SNS topic subscriptions
4. Query DynamoDB for evaluation data
5. Check S3 buckets for reports

## License

Copyright 2025. All rights reserved.
