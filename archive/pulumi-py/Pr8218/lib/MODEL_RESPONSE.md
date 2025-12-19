# Infrastructure Compliance Scanning System - Pulumi Python Implementation

Complete implementation of automated infrastructure compliance scanning system using Pulumi with Python.

## Implementation Overview

This solution implements comprehensive compliance monitoring using:
- **AWS Config** for resource tracking (EC2, RDS, S3, IAM)
- **Lambda Functions** (Python 3.9) for custom compliance rules
- **DynamoDB** for compliance history storage
- **CloudWatch Events** for 6-hour scheduled evaluations
- **SNS** for compliance violation alerts
- **S3** for Config delivery and report storage

All resources include environmentSuffix for multi-environment deployments.

## Architecture

The implementation is organized into modular stacks:

1. **Monitoring Stack** (`lib/monitoring_stack.py`):
   - SNS topic for alerts with email subscription
   - DynamoDB table (partition: resource_id, sort: evaluation_timestamp)
   - S3 buckets for Config delivery and compliance reports
   - Both S3 buckets with versioning and AES-256 encryption

2. **Compliance Stack** (`lib/compliance_stack.py`):
   - 3 Lambda functions for compliance rules (EC2 tags, S3 encryption, RDS backups)
   - 1 Lambda function for report aggregation
   - CloudWatch Events rule with cron(0 */6 * * ? *) schedule
   - IAM roles with least-privilege policies for each Lambda
   - EventBridge targets and permissions

3. **Config Stack** (`lib/config_stack.py`):
   - IAM role with AWS_ConfigRole managed policy
   - Configuration recorder for specified resource types
   - Delivery channel to S3
   - 3 custom Config rules invoking Lambda functions
   - Lambda permissions for Config invocation

## Implementation Files

### Core Infrastructure

**lib/tap_stack.py** - Main orchestration component
- Integrates all three stacks
- Manages dependencies
- Exports stack outputs

**lib/monitoring_stack.py** - Monitoring infrastructure
- Creates SNS, DynamoDB, and S3 resources
- Configures encryption and versioning
- Applies required tags

**lib/compliance_stack.py** - Compliance checking
- Deploys 4 Lambda functions
- Creates CloudWatch Events schedule
- Manages IAM roles and permissions
- Sets up EventBridge integration

**lib/config_stack.py** - AWS Config setup
- Configures Config recorder and delivery
- Creates custom Config rules
- Manages Config IAM role

### Lambda Functions

**lib/lambda/ec2_tag_checker/index.py**
- Checks EC2 instances for required tags (Environment, Owner, CostCenter)
- Stores results in DynamoDB
- Sends SNS alerts for non-compliant instances

**lib/lambda/s3_encryption_checker/index.py**
- Validates S3 buckets have encryption enabled
- Checks for ServerSideEncryptionConfiguration
- Reports compliance status

**lib/lambda/rds_backup_checker/index.py**
- Verifies RDS instances have automated backups
- Checks BackupRetentionPeriod > 0
- Alerts on backup violations

**lib/lambda/report_aggregator/index.py**
- Scans DynamoDB for all evaluations
- Aggregates statistics by resource type and rule
- Generates JSON reports with timestamps
- Stores reports in S3

Each Lambda function includes:
- Error handling and logging
- DynamoDB integration
- SNS notification logic
- Proper typing annotations

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment-suffix}`

Examples:
- `compliance-alerts-dev` (SNS topic)
- `compliance-history-dev` (DynamoDB table)
- `config-delivery-dev` (S3 bucket)
- `compliance-reports-dev` (S3 bucket)
- `ec2-tag-checker-dev` (Lambda function)
- `config-recorder-dev` (AWS Config recorder)

## IAM Permissions

### EC2 Tag Checker Role
- ec2:DescribeInstances, ec2:DescribeTags
- dynamodb:PutItem
- sns:Publish
- CloudWatch Logs permissions

### S3 Encryption Checker Role
- s3:GetEncryptionConfiguration, s3:ListAllMyBuckets
- dynamodb:PutItem
- sns:Publish
- CloudWatch Logs permissions

### RDS Backup Checker Role
- rds:DescribeDBInstances
- dynamodb:PutItem
- sns:Publish
- CloudWatch Logs permissions

### Report Aggregator Role
- dynamodb:Query, dynamodb:Scan
- s3:PutObject
- CloudWatch Logs permissions

### AWS Config Role
- AWS_ConfigRole managed policy
- s3:GetBucketVersioning, s3:PutObject, s3:GetObject

## Compliance Evaluation Flow

1. **CloudWatch Events** triggers Lambda functions every 6 hours
2. **Lambda functions** evaluate resources against rules
3. **Results stored** in DynamoDB with timestamp
4. **SNS alerts sent** for non-compliant resources
5. **Report aggregator** generates summary JSON
6. **Reports stored** in S3 with versioning

## Deployment

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX=dev

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output
```

## Outputs

The stack exports:
- `config_recorder_name`: AWS Config recorder name
- `dynamodb_table_name`: Compliance history table
- `sns_topic_arn`: SNS topic for alerts
- `reports_bucket_name`: S3 bucket for reports

## Compliance Reports Format

Reports are JSON files with structure:
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
    }
  },
  "by_rule": {
    "ec2-required-tags": {
      "total": 50,
      "compliant": 40,
      "non_compliant": 10
    }
  },
  "evaluations": [...]
}
```

## Tagging

All resources tagged with:
- `Environment: Production`
- `Compliance: Required`
- `ManagedBy: Pulumi`

## Destroyability

All resources configured for clean deletion:
- No Retain policies on any resources
- S3 buckets can be destroyed (versioning enabled but not protected)
- DynamoDB with point-in-time recovery but destroyable
- Config recorder can be deleted

## Testing

Unit tests should cover:
- Stack instantiation
- Resource creation with correct names
- IAM policy validation
- Lambda handler logic
- DynamoDB operations
- S3 report generation

## Notes

- AWS Config recorder must be unique per region
- Lambda runtime: Python 3.9+ (boto3 SDK v3 compatible)
- CloudWatch Events cron: `cron(0 */6 * * ? *)` (every 6 hours)
- DynamoDB uses partition key `resource_id` and sort key `evaluation_timestamp`
- SNS email subscription requires manual confirmation
