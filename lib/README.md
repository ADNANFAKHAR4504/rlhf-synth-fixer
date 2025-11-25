# Automated Infrastructure Compliance Scanning System

A comprehensive Pulumi TypeScript solution for automated AWS infrastructure compliance scanning with real-time monitoring, reporting, and automated remediation.

## Architecture Overview

This system implements a complete compliance scanning workflow that:
- Monitors AWS resources continuously using AWS Config
- Analyzes compliance status hourly via Lambda functions
- Stores compliance history in DynamoDB for trend analysis
- Generates HTML reports and stores them in S3
- Sends SNS notifications for critical violations (score < 70%)
- Automatically remediates S3 bucket encryption violations
- Provides CloudWatch dashboards for compliance visualization

## AWS Services Used

1. **AWS Config** - Continuous resource compliance tracking with custom rules
2. **Lambda** - Serverless functions for analysis and remediation (Node.js 18.x, 3008MB)
3. **DynamoDB** - Compliance history storage (PAY_PER_REQUEST, ResourceId/Timestamp schema)
4. **S3** - HTML report storage with 30-day lifecycle and encryption
5. **EventBridge** - Hourly scan scheduling (rate(1 hour))
6. **SNS** - Critical violation notifications with KMS encryption
7. **SQS** - Dead letter queue for failed Lambda executions
8. **CloudWatch** - Dashboard for 7-day compliance trends and metrics
9. **IAM** - Least privilege roles and policies for all services
10. **KMS** - Encryption at rest for all data services

## Project Structure

```
.
├── bin/
│   └── tap.ts                  # Pulumi program entry point
├── lib/
│   ├── tap-stack.ts            # Main infrastructure stack
│   ├── PROMPT.md               # Requirements specification
│   ├── MODEL_RESPONSE.md       # Generated implementation
│   └── README.md               # This file
└── metadata.json               # Project metadata
```

## Prerequisites

- Node.js 18.x or higher
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- AWS account with permissions for all services listed above

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
export AWS_REGION=us-east-1
export ENVIRONMENT_SUFFIX=dev
```

## Deployment

1. Preview the infrastructure changes:
```bash
pulumi preview
```

2. Deploy the stack:
```bash
pulumi up
```

3. View stack outputs:
```bash
pulumi stack output
```

Expected outputs:
- `configRecorderName`: AWS Config recorder name
- `complianceTableArn`: DynamoDB compliance history table ARN
- `reportBucketUrl`: S3 bucket URL for HTML reports

## Configuration

### Environment Variables

- `ENVIRONMENT_SUFFIX`: Deployment environment suffix (default: 'dev')
- `AWS_REGION`: Target AWS region (default: 'us-east-1')
- `REPOSITORY`: Git repository name (for tagging)
- `COMMIT_AUTHOR`: Commit author (for tagging)
- `PR_NUMBER`: Pull request number (for tagging)
- `TEAM`: Team name (for tagging)

### Resource Naming

All resources follow the naming convention:
```
{resource-type}-{environment-suffix}
```

Examples:
- `compliance-reports-dev` (S3 bucket)
- `compliance-analysis-dev` (Lambda function)
- `compliance-history-dev` (DynamoDB table)

## Features

### 1. Compliance Scanning

- AWS Config continuously monitors EC2, S3, and IAM resources
- Hourly EventBridge trigger initiates compliance analysis
- Lambda function queries Config for compliance status
- Calculates overall compliance score based on rule violations

### 2. Historical Tracking

- DynamoDB stores compliance scores with timestamps
- Partition key: ResourceId (String)
- Sort key: Timestamp (String)
- Enables trend analysis and compliance reporting over time

### 3. Report Generation

- HTML reports generated for each scan
- Stored in S3 with KMS encryption
- 30-day lifecycle policy automatically deletes old reports
- Reports include: timestamp, score, total rules, compliant count

### 4. Critical Alerts

- SNS notifications sent when compliance score < 70%
- Supports email and Lambda subscriptions
- KMS encrypted for data security
- Includes score and timestamp in notification

### 5. Automated Remediation

- Dedicated Lambda function for S3 bucket encryption violations
- Checks if encryption is already enabled
- Applies AES256 server-side encryption if missing
- Dead letter queue captures failed remediation attempts

### 6. Monitoring Dashboard

- CloudWatch dashboard displays:
  - Lambda invocation counts
  - Lambda error rates
  - Compliance trend metrics (7 days)
- Period: 1 hour aggregation

## Security

### Encryption

- All data at rest encrypted with AWS KMS
- KMS key rotation enabled
- S3 buckets use KMS server-side encryption
- DynamoDB uses AWS managed KMS encryption
- SNS topics encrypted with KMS
- SQS queues encrypted with KMS

### IAM Permissions

- Lambda execution role with least privilege
- Separate IAM role for AWS Config
- Inline policies scoped to specific resources
- No wildcard permissions except for Config API calls

### Network Security

- S3 public access blocked on all buckets
- Resources deployed with parent-child relationships
- X-Ray tracing enabled for Lambda functions

## Lambda Functions

### Compliance Analysis Function

**Purpose**: Analyze AWS Config compliance data and generate reports

**Configuration**:
- Runtime: nodejs18.x
- Memory: 3008MB
- Timeout: 300 seconds
- X-Ray: Enabled

**Environment Variables**:
- `COMPLIANCE_TABLE`: DynamoDB table name
- `REPORT_BUCKET`: S3 bucket name
- `ALERT_TOPIC`: SNS topic ARN

**Workflow**:
1. Fetch compliance data from AWS Config
2. Calculate compliance score
3. Store results in DynamoDB
4. Generate HTML report and upload to S3
5. Send SNS alert if score < 70%

### S3 Remediation Function

**Purpose**: Automatically enable encryption on non-compliant S3 buckets

**Configuration**:
- Runtime: nodejs18.x
- Memory: 3008MB
- Timeout: 300 seconds
- X-Ray: Enabled

**Workflow**:
1. Receive event with bucket name
2. Check current encryption status
3. Enable AES256 encryption if not present
4. Log remediation action

## Testing

### Manual Testing

1. Deploy the stack
2. Wait for initial Config scan (may take a few minutes)
3. Trigger Lambda manually:
```bash
aws lambda invoke \
  --function-name compliance-analysis-dev \
  --payload '{}' \
  output.json
```

4. Check DynamoDB for compliance records:
```bash
aws dynamodb scan \
  --table-name compliance-history-dev
```

5. Verify S3 reports:
```bash
aws s3 ls s3://compliance-reports-dev/
```

### Compliance Score Testing

Create intentional violations:
1. Launch EC2 instance without required tags
2. Create S3 bucket without encryption
3. Create IAM user without MFA

Wait for next hourly scan and check:
- Compliance score should decrease
- New report should be generated
- SNS alert should be sent (if score < 70%)

## Troubleshooting

### Config Recorder Not Starting

Check IAM role permissions:
```bash
aws iam get-role --role-name compliance-config-role-dev
```

Verify managed policy attached:
```
arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
```

### Lambda Function Errors

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/compliance-analysis-dev --follow
```

Common issues:
- Missing environment variables
- Insufficient IAM permissions
- Config API throttling

### DynamoDB Write Failures

Check Lambda execution role policy:
```bash
aws iam get-role-policy \
  --role-name compliance-lambda-role-dev \
  --policy-name compliance-lambda-policy-dev
```

Verify DynamoDB permissions:
- `dynamodb:PutItem`
- `dynamodb:GetItem`
- `dynamodb:Query`

### S3 Upload Failures

Verify bucket encryption:
```bash
aws s3api get-bucket-encryption \
  --bucket compliance-reports-dev
```

Check KMS key policy allows Lambda to use key:
```bash
aws kms describe-key --key-id alias/compliance-dev
```

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

Note: All resources are configured for destruction (no Retain policies).

## Stack Outputs

After deployment, retrieve outputs:

```bash
pulumi stack output configRecorderName    # AWS Config recorder name
pulumi stack output complianceTableArn    # DynamoDB table ARN
pulumi stack output reportBucketUrl       # S3 bucket URL
```

## Cost Considerations

Estimated monthly costs (us-east-1):
- AWS Config: $2/recorder + $0.003/configuration item
- Lambda: Minimal (included in free tier for low invocations)
- DynamoDB: Minimal (PAY_PER_REQUEST, low traffic)
- S3: Minimal (few reports, 30-day retention)
- KMS: $1/key + $0.03/10k requests
- CloudWatch: Minimal (basic dashboards free)
- SNS: $0.50/1M requests
- SQS: $0.40/1M requests

Total estimated: $5-10/month for typical usage

## Compliance Standards

This system can be extended to check compliance against:
- CIS AWS Foundations Benchmark
- PCI-DSS
- HIPAA
- SOC 2
- GDPR

Add custom AWS Config rules for specific compliance requirements.

## Contributing

When modifying this infrastructure:

1. Follow naming convention with environmentSuffix
2. Maintain least privilege IAM policies
3. Keep all resources destroyable (no Retain policies)
4. Add appropriate tags (CostCenter, Compliance)
5. Update documentation for new features

## License

Copyright Turing 2025. All rights reserved.
