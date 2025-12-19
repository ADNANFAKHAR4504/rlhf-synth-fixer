# Security Compliance Automation Framework

Automated security compliance monitoring and remediation system built with CDKTF Python for AWS.

## Architecture

This solution implements a comprehensive security compliance framework across multiple AWS regions:

- **Primary Region**: us-east-1 (aggregation and centralized management)
- **Secondary Regions**: us-west-2, eu-west-1

## Components

### AWS Config
- Configuration recorder in all three regions
- Configuration aggregator in us-east-1
- S3 buckets for configuration snapshots
- Custom Config rules for S3 compliance

### Lambda Remediation
- Automatic remediation for non-compliant S3 buckets
- Versioning enablement
- KMS encryption enforcement
- ARM64 architecture for cost optimization
- Python 3.9 runtime

### Security Hub
- Enabled in all regions
- CIS AWS Foundations Benchmark v1.4.0
- Aggregates findings from Config and GuardDuty

### IAM Password Policy
- Minimum 14 characters
- Requires uppercase, lowercase, numbers, symbols
- 90-day password rotation
- 24 password history

### Monitoring & Alerting
- CloudWatch Logs with 90-day retention
- SNS topic for critical compliance violations
- EventBridge rules for automated notifications
- Audit trail for all remediation actions

### Resource Tagging
- Automatic tagging using CDKTF aspects
- Required tags: CostCenter, Environment, ComplianceLevel

## Deployment

### Prerequisites
- AWS CLI configured
- CDKTF CLI installed (`npm install -g cdktf-cli`)
- Python 3.9+
- Terraform

### Environment Variables
```bash
export ENVIRONMENT_SUFFIX="your-unique-suffix"
export AWS_REGION="us-east-1"
```

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Deploy Infrastructure
```bash
cdktf deploy
```

### Create Lambda Deployment Package
```bash
cd lib/lambda
zip -r ../../lambda_function.zip remediation_versioning.py remediation_encryption.py
cd ../..
```

## GuardDuty Setup

**Important**: GuardDuty detectors are NOT created by this infrastructure code due to AWS account-level limitations (one detector per account/region).

To enable GuardDuty:
1. Navigate to AWS GuardDuty console in each region
2. Enable GuardDuty if not already active
3. Configure Security Hub integration to receive findings

## Outputs

- `config_bucket_name`: S3 bucket for Config snapshots
- `sns_topic_arn`: SNS topic for compliance alerts
- `remediation_log_group`: CloudWatch log group for audit trail

## Compliance Rules

### S3 Bucket Versioning
- **Rule**: s3-bucket-versioning-enabled
- **Remediation**: Automatic via Lambda
- **Trigger**: Config rule evaluation

### S3 Bucket Encryption
- **Rule**: s3-bucket-server-side-encryption
- **Remediation**: Automatic via Lambda (KMS encryption)
- **Trigger**: Config rule evaluation

## Monitoring

All remediation actions are logged to:
```
/aws/lambda/config-remediation-{environment_suffix}
```

Log retention: 90 days

## Security Considerations

- All S3 buckets use KMS encryption
- Public access blocked on all Config buckets
- Least privilege IAM roles
- Multi-region deployment for resilience
- Automated compliance enforcement

## Cost Optimization

- Lambda functions use ARM64 architecture
- Serverless architecture (no EC2 instances)
- 90-day log retention (configurable)
- Single NAT gateway per region (if needed)

## Cleanup

To destroy all resources:
```bash
cdktf destroy
```

Note: All resources are configured to be destroyable without manual intervention.
